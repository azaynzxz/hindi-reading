import pypdf
import sys
import re
import csv
import json
import urllib.request
import os

sys.stdout.reconfigure(encoding='utf-8')

PDF_PATH = r"d:\Praktek\Hindi Daily Reading\Matrials Basic\Basic-Hindi-1723411713.pdf"
CSV_PATH = r"d:\Praktek\Hindi Daily Reading\public\basic-practice.csv"
API_URL = "http://localhost:3001/api/transliterate"

# The complete list of pages with dialogues
dialogue_pages = [
    61, 63, 65, 67, 99, 135, 142, 152, 177, 182, 187, 206, 210, 213, 216, 219, 238, 252, 255, 259, 285, 294
]

def query_transliteration_api(hindi_text):
    """Calls the local API server to get the English transliteration for a Hindi phrase."""
    data = json.dumps({"text": hindi_text}).encode("utf-8")
    req = urllib.request.Request(
        API_URL, 
        data=data, 
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=2) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if res_data.get("success") and res_data.get("transliterations"):
                return res_data["transliterations"][0]
    except Exception:
        pass
    return ""

def clean_text(text):
    """Clean up leading/trailing spaces and dialogue noise/punctuation markers."""
    cleaned = text.strip()
    cleaned = re.sub(r'^[\s\.:|!?—\-\(\)]+', '', cleaned)
    cleaned = re.sub(r'[\s\.:|!?—\-\(\)]+$', '', cleaned)
    return cleaned.strip()

def split_dialogue_line(text):
    """
    Tries to split English translation into translit + meaning.
    Returns (hindi, transliteration, meaning) or None.
    """
    match = re.search(r'\s+([a-zA-Z0-9\s\.,\?!\'\’\-]*)$', text)
    if not match:
        return None
        
    english = match.group(1).strip()
    hindi = text[:match.start()].strip()
    
    # Strip any English speaker prefix (e.g. "Shilpa: Hello" -> "Hello")
    english = re.sub(r'^[a-zA-Z\s]+:\s*', '', english)
    
    # Apply punctuation heuristic: check if there's a punctuation followed by capital letter
    split_match = re.search(r'([\.\?!,])\s+([A-Z][a-zA-Z\s\.,\?!\'\’\-]*)$', english)
    if split_match:
        translit = english[:split_match.start() + 1].strip()
        meaning = split_match.group(2).strip()
        return hindi, translit, meaning
    else:
        return hindi, "", english

def parse_phrases():
    if not os.path.exists(PDF_PATH):
        print(f"Error: PDF not found at {PDF_PATH}")
        return []

    print(f"Opening PDF: {PDF_PATH}")
    reader = pypdf.PdfReader(PDF_PATH)
    
    phrases = []
    
    for page_num in dialogue_pages:
        page = reader.pages[page_num - 1]
        text = page.extract_text()
        if not text:
            continue
            
        lines = text.split('\n')
        
        # Read first few lines to find chapter name
        chapter = f"Page {page_num}"
        for line in lines[:5]:
            if "Chapter" in line or "CHAPTER" in line:
                chapter = line.strip()
                chapter = re.sub(r'(Chapter \d+: [^\n]+) Chapter \d+.*$', r'\1', chapter)
                break

        for line in lines:
            line = line.strip()
            # Dialogue start: speaker name (Devanagari) followed by colon/double colon
            m = re.match(r'^([^\da-zA-Z\.:\s]+)\s*::?\s*(.+)$', line)
            if not m:
                continue
                
            speaker = m.group(1).strip()
            content = m.group(2).strip()
            
            res = split_dialogue_line(content)
            if not res:
                continue
                
            hindi, translit, meaning = res
            
            # Clean up
            hindi = clean_text(hindi)
            translit = clean_text(translit)
            meaning = clean_text(meaning)
            
            if not hindi or not meaning:
                continue
                
            phrases.append({
                "Source": "Daily Conversation",
                "Hindi": hindi,
                "Transliteration": translit,
                "Meaning": meaning
            })
            
    print(f"Parsed {len(phrases)} phrases from PDF.")
    return phrases

def load_existing_csv():
    if not os.path.exists(CSV_PATH):
        return []
    
    existing = []
    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing.append(row)
    return existing

def merge_and_save(phrases):
    existing = load_existing_csv()
    print(f"Existing database has {len(existing)} rows.")
    
    # Index by Hindi to prevent duplicates
    existing_dict = {row["Hindi"].strip(): row for row in existing}
    
    added_count = 0
    api_queries = 0
    
    for phrase in phrases:
        hindi = phrase["Hindi"]
        if hindi in existing_dict:
            # Update transliteration if existing is missing it
            if not existing_dict[hindi]["Transliteration"] and phrase["Transliteration"]:
                existing_dict[hindi]["Transliteration"] = phrase["Transliteration"]
            continue
            
        # Get missing transliteration
        if not phrase["Transliteration"]:
            api_queries += 1
            api_translit = query_transliteration_api(phrase["Hindi"])
            if api_translit:
                phrase["Transliteration"] = clean_text(api_translit)
            else:
                phrase["Transliteration"] = phrase["Hindi"]
                
        existing.append(phrase)
        added_count += 1
        
    print(f"Saving merged database to {CSV_PATH}...")
    headers = ["Source", "Hindi", "Transliteration", "Meaning"]
    with open(CSV_PATH, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for row in existing:
            writer.writerow({
                "Source": row.get("Source", ""),
                "Hindi": row.get("Hindi", ""),
                "Transliteration": row.get("Transliteration", ""),
                "Meaning": row.get("Meaning", "")
            })
            
    print("\n--- Summary ---")
    print(f"New phrases added: {added_count}")
    print(f"API Transliteration queries made: {api_queries}")
    print(f"Total rows in database: {len(existing)}")

if __name__ == "__main__":
    phrases = parse_phrases()
    if phrases:
        merge_and_save(phrases)
