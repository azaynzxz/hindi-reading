import pypdf
import sys
import re
import csv
import json
import urllib.request
import os

sys.stdout.reconfigure(encoding='utf-8')

PDF_PATH = r"d:\Praktek\Hindi Daily Reading\Matrials Basic\Basic-Hindi-1723411713.pdf"
CSV_PATH = r"d:\Praktek\Hindi Daily Reading\public\conversations.csv"
API_URL = "http://localhost:3001/api/transliterate"

# Topics map
TOPICS = {
    61: "Daily Conversation - Greetings",
    63: "Daily Conversation - Friends Meet",
    65: "Daily Conversation - Contact Info",
    67: "Daily Conversation - With Teacher",
    99: "Daily Conversation - Family",
    135: "Daily Conversation - House Tour",
    142: "Daily Conversation - Room Tour",
    152: "Daily Conversation - Hometown",
    177: "Daily Conversation - Vegetable Market",
    182: "Daily Conversation - Restaurant",
    187: "Daily Conversation - Host Mother",
    206: "Daily Conversation - SIM Card Shop",
    210: "Daily Conversation - Cooking",
    213: "Daily Conversation - Directions",
    216: "Daily Conversation - Social Media",
    219: "Daily Conversation - Making Tea",
    238: "Daily Conversation - Bank Account",
    252: "Daily Conversation - Weekend Hobbies",
    255: "Daily Conversation - Festivals",
    259: "Daily Conversation - Travel Plans",
    285: "Daily Conversation - Summer Vacation",
    294: "Daily Conversation - Independence Day"
}

SPEAKER_MAP = {
    "विद्या": "Vidya",
    "शिल्पा": "Shilpa",
    "पीटर": "Peter",
    "ऋतिक": "Hritik",
    "कमला": "Kamala",
    "जेन": "Jen",
    "दुकानदार": "Shopkeeper",
    "बैरा": "Waiter",
    "पूजा": "Puja",
    "केरेन": "Karen",
    "संगीता": "Sangeeta",
    "अक्षय": "Akshay"
}

def query_transliteration_api(hindi_text):
    """Calls local API to transliterate Hindi sentence."""
    data = json.dumps({"text": hindi_text}).encode("utf-8")
    req = urllib.request.Request(API_URL, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=2) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            if res_data.get("success") and res_data.get("transliterations"):
                return res_data["transliterations"][0]
    except Exception:
        pass
    return ""

def clean_text(text):
    """Clean up leading/trailing symbols and dialogue noise."""
    cleaned = text.strip()
    cleaned = re.sub(r'^[\s\.:|!?—\-\(\)]+', '', cleaned)
    cleaned = re.sub(r'[\s\.:|!?—\-\(\)]+$', '', cleaned)
    return cleaned.strip()

def is_devanagari(text):
    return any(0x0900 <= ord(char) <= 0x097F for char in text)

def is_english(text):
    return any(ord('a') <= ord(char.lower()) <= ord('z') for char in text)

def parse_page_dialogues(page_num, reader):
    page = reader.pages[page_num - 1]
    text = page.extract_text()
    if not text:
        return []
        
    lines = text.split('\n')
    turns = []
    
    speaker_pattern = re.compile(r'^([^\da-zA-Z\.:\s\(]+)\s*::?\s*(.*)$')
    current_turn = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        m = speaker_pattern.match(line)
        if m:
            if current_turn:
                turns.append(current_turn)
            
            speaker = m.group(1).strip()
            content = m.group(2).strip()
            
            # Separate Hindi and English parts
            hindi_part = ""
            eng_part = ""
            
            split_match = re.search(r'\s+([a-zA-Z0-9\s\.,\?!\'\’\-\(\)]*)$', content)
            if split_match:
                eng_part = split_match.group(1).strip()
                hindi_part = content[:split_match.start()].strip()
            else:
                if is_devanagari(content):
                    hindi_part = content
                else:
                    eng_part = content
                    
            current_turn = {
                "Speaker": speaker,
                "Hindi": hindi_part,
                "English": eng_part
            }
        else:
            if current_turn:
                if not is_devanagari(line):
                    current_turn["English"] += " " + line
                else:
                    split_match = re.search(r'\s+([a-zA-Z0-9\s\.,\?!\'\’\-\(\)]*)$', line)
                    if split_match:
                        e = split_match.group(1).strip()
                        h = line[:split_match.start()].strip()
                        if h:
                            current_turn["Hindi"] += " " + h
                        if e:
                            current_turn["English"] += " " + e
                    else:
                        if is_devanagari(line) and not is_english(line):
                            current_turn["Hindi"] += " " + line
                        elif is_english(line) and not is_devanagari(line):
                            current_turn["English"] += " " + line
                        else:
                            if is_devanagari(line):
                                current_turn["Hindi"] += " " + line
                            else:
                                current_turn["English"] += " " + line
                            
    if current_turn:
        turns.append(current_turn)
        
    return turns

def process_conversations():
    if not os.path.exists(PDF_PATH):
        print(f"Error: PDF not found at {PDF_PATH}")
        return
        
    print(f"Opening PDF: {PDF_PATH}")
    reader = pypdf.PdfReader(PDF_PATH)
    
    new_rows = []
    api_queries = 0
    
    for page_num, topic in TOPICS.items():
        print(f"Parsing Page {page_num} ({topic})...")
        turns = parse_page_dialogues(page_num, reader)
        
        for turn in turns:
            hindi_speaker = turn["Speaker"]
            english_speaker = SPEAKER_MAP.get(hindi_speaker, hindi_speaker)
            
            raw_hindi = clean_text(turn["Hindi"])
            raw_english = clean_text(turn["English"])
            
            # Clean speaker name if it was left in English part
            # E.g. "Shilpa: Hello" -> "Hello"
            raw_english = re.sub(r'^[a-zA-Z\s]+:\s*', '', raw_english)
            
            # Heuristic split for inline transliteration (only on pages 61, 63, 65)
            translit = ""
            meaning = raw_english
            
            if page_num in (61, 63, 65):
                split_match = re.search(r'([\.\?!,])\s+([A-Z][a-zA-Z0-9\s\.,\?!\'\’\-\(\)]*)$', raw_english)
                if split_match:
                    translit = raw_english[:split_match.start() + 1].strip()
                    meaning = split_match.group(2).strip()
            
            # Clean values
            raw_hindi = clean_text(raw_hindi)
            translit = clean_text(translit)
            meaning = clean_text(meaning)
            
            if not raw_hindi or not meaning:
                continue
                
            # If no transliteration was extracted, call API
            if not translit:
                api_queries += 1
                api_translit = query_transliteration_api(raw_hindi)
                if api_translit:
                    translit = clean_text(api_translit)
                else:
                    translit = raw_hindi
            
            # Construct prefix form: "Speaker: Text"
            full_hindi = f"{hindi_speaker}: {raw_hindi}"
            full_translit = f"{english_speaker}: {translit}"
            full_meaning = f"{english_speaker}: {meaning}"
            
            new_rows.append({
                "Source": topic,
                "Hindi": full_hindi,
                "Transliteration": full_translit,
                "Meaning": full_meaning
            })
            
    print(f"Extraction complete. Formatted {len(new_rows)} conversation turns.")
    
    # Save back to CSV
    print(f"Saving database to {CSV_PATH}...")
    headers = ["Source", "Hindi", "Transliteration", "Meaning"]
    with open(CSV_PATH, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for row in new_rows:
            writer.writerow({
                "Source": row["Source"],
                "Hindi": row["Hindi"],
                "Transliteration": row["Transliteration"],
                "Meaning": row["Meaning"]
            })
            
    print(f"Done! API Queries: {api_queries}")

if __name__ == "__main__":
    process_conversations()
