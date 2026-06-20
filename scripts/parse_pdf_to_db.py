import pypdf
import sys
import re
import csv
import json
import urllib.request
import os

# Set console output encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

PDF_PATH = r"d:\Praktek\Hindi Daily Reading\Matrials Basic\Basic-Hindi-1723411713.pdf"
CSV_PATH = r"d:\Praktek\Hindi Daily Reading\public\hindi-practice.csv"
API_URL = "http://localhost:3001/api/transliterate"

# Regex to match: [Hindi text] [Grammar category] [Rest of row]
# Matches common grammar categories: n.m., n.f., n.m./f., adj., v., pron., adv., post., conj., n.f./m., v.it., v.tr.
row_pattern = re.compile(
    r'^([^\da-zA-Z\.\?]+)\s+(n\.m\.|n\.f\.|n\.m\./f\.|adj\.|v\.|pron\.|adv\.|post\.|conj\.|n\.f\./m\.|v\.it\.|v\.tr\.)\s+(.+)$'
)

def query_transliteration_api(hindi_word):
    """Calls the local API server to get the English transliteration for a Hindi word."""
    data = json.dumps({"text": hindi_word}).encode("utf-8")
    req = urllib.request.Request(
        API_URL, 
        data=data, 
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        # 2-second timeout to fail fast if backend server is not running
        with urllib.request.urlopen(req, timeout=2) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if res_data.get("success") and res_data.get("transliterations"):
                return res_data["transliterations"][0]
    except Exception:
        pass
    return ""

def clean_latin_meaning(text):
    """Removes trailing grammar noise or prefixes like '& adj.' from the extracted English part."""
    cleaned = text.strip()
    # Remove leading noise
    cleaned = re.sub(r'^(?:&\s*(?:adj\.|conj\.|adv\.|v\.|pron\.|n\.m\.|n\.f\.)\s*)+', '', cleaned)
    return cleaned.strip()

def parse_pdf():
    if not os.path.exists(PDF_PATH):
        print(f"Error: PDF not found at {PDF_PATH}")
        return []

    print(f"Opening PDF: {PDF_PATH}")
    reader = pypdf.PdfReader(PDF_PATH)
    total_pages = len(reader.pages)
    print(f"Total pages to scan: {total_pages}")

    parsed_words = []
    
    # Pre-compiled regex for cleaning headers
    translit_header_pattern = re.compile(r'transliteration', re.IGNORECASE)

    for idx in range(total_pages):
        page = reader.pages[idx]
        text = page.extract_text()
        if not text:
            continue
            
        lines = text.split('\n')
        
        # 1. Identify the chapter name from first few lines of the page
        chapter = "Basic Hindi"
        for line in lines[:5]:
            if "Chapter" in line or "CHAPTER" in line:
                chapter = line.strip()
                # Clean up repeated text patterns (common in PDF extractions)
                chapter = re.sub(r'(Chapter \d+: [^\n]+) Chapter \d+.*$', r'\1', chapter)
                break

        # 2. Check if this page has an explicit Transliteration column
        has_translit_col = bool(translit_header_pattern.search(text[:600]))

        # 3. Parse lines
        for line in lines:
            match = row_pattern.match(line.strip())
            if not match:
                continue
                
            hindi, grammar, rest = match.groups()
            hindi = hindi.strip()
            rest = clean_latin_meaning(rest)

            transliteration = ""
            meaning = ""

            if has_translit_col:
                # Layout A: Group 3 contains [Transliteration] [Meaning]
                parts = rest.split()
                if len(parts) >= 2:
                    transliteration = parts[0]
                    meaning = " ".join(parts[1:])
                else:
                    # Fallback if split fails
                    meaning = rest
            else:
                # Layout B: Group 3 is only the Meaning.
                # Transliteration must be queried from backend API.
                meaning = rest

            # Add to list
            parsed_words.append({
                "Source": chapter,
                "Hindi": hindi,
                "Transliteration": transliteration,
                "Meaning": meaning
            })

    print(f"Extraction complete. Found {len(parsed_words)} matching vocabulary rows.")
    return parsed_words

def load_existing_csv():
    if not os.path.exists(CSV_PATH):
        return []
    
    existing = []
    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing.append(row)
    return existing

def save_merged_database(words):
    # Load current database
    existing_words = load_existing_csv()
    print(f"Currently, {len(existing_words)} words exist in the database.")

    # Index existing words by Hindi to prevent duplicates
    existing_dict = {w["Hindi"].strip(): w for w in existing_words}
    
    merged_count = 0
    new_count = 0
    api_queries = 0

    for word in words:
        hindi = word["Hindi"]
        
        # Prevent duplicates
        if hindi in existing_dict:
            # If the existing entry doesn't have a transliteration, but the PDF does, update it
            if not existing_dict[hindi]["Transliteration"] and word["Transliteration"]:
                existing_dict[hindi]["Transliteration"] = word["Transliteration"]
                merged_count += 1
            continue

        # If transliteration is missing, query the API server
        if not word["Transliteration"]:
            api_queries += 1
            api_translit = query_transliteration_api(word["Hindi"])
            if api_translit:
                word["Transliteration"] = api_translit
            else:
                # Fallback to a placeholder or direct copy of Hindi
                word["Transliteration"] = word["Hindi"]

        # Append new word
        existing_words.append(word)
        new_count += 1

    # Save back to CSV
    print(f"Saving merged database to {CSV_PATH}...")
    headers = ["Source", "Hindi", "Transliteration", "Meaning"]
    with open(CSV_PATH, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for row in existing_words:
            # Ensure keys match exactly
            writer.writerow({
                "Source": row.get("Source", "Basic Hindi"),
                "Hindi": row.get("Hindi", ""),
                "Transliteration": row.get("Transliteration", ""),
                "Meaning": row.get("Meaning", "")
            })

    print("\n--- Summary ---")
    print(f"New words added: {new_count}")
    print(f"Existing words updated: {merged_count}")
    print(f"API Transliteration queries made: {api_queries}")
    print(f"Total vocabulary words in database: {len(existing_words)}")

if __name__ == "__main__":
    extracted = parse_pdf()
    if extracted:
        save_merged_database(extracted)
