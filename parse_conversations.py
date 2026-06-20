import pypdf
import sys
import re
import json
import urllib.request
import os

sys.stdout.reconfigure(encoding='utf-8')

PDF_PATH = r"d:\Praktek\Hindi Daily Reading\Matrials Basic\Basic-Hindi-1723411713.pdf"
CONVO_DIR = r"d:\Praktek\Hindi Daily Reading\public\conversations"
UNIFIED_JSON_PATH = r"d:\Praktek\Hindi Daily Reading\public\conversations.json"
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

# Regex to match speaker name at the start of a line
speakers_pattern = "|".join(SPEAKER_MAP.keys())
speaker_pattern = re.compile(
    rf'^({speakers_pattern})(?:\s*::?|\s+(?!का\b|की\b|के\b|ने\b|को\b|से\b|में\b|पर\b|जी\b))(.*)$'
)

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

def should_terminate_page(line):
    line_lower = line.lower()
    if "pre-reading" in line_lower:
        return False
    termination_keywords = [
        "please watch the following video",
        "instructor video",
        "test yourself",
        "an interactive h5p element",
        "activities",
        "in your classroom",
        "listening activity",
        "please make a list",
        "rajiv ranjan",
        "basichindi",
        "basic hindi",
        "bbasic hindi",
        "listening listening",
        "activity activity",
        "h5p"
    ]
    for kw in termination_keywords:
        if kw in line_lower:
            return True
    return False

def get_slug(topic_name):
    name = topic_name.replace("Daily Conversation - ", "")
    name = name.lower().strip()
    name = re.sub(r'[^a-z0-9\s-]', '', name)
    name = re.sub(r'[\s-]+', '-', name)
    return name

def parse_page_dialogues(page_num, reader):
    page = reader.pages[page_num - 1]
    text = page.extract_text()
    if not text:
        return []
        
    lines = text.split('\n')
    turns = []
    current_turn = None
    seeking_dialogue = True
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if should_terminate_page(line):
            break
            
        m = speaker_pattern.match(line)
        if m:
            seeking_dialogue = False
            if current_turn:
                turns.append(current_turn)
            
            speaker = m.group(1).strip()
            content = m.group(2).strip()
            
            # Clean speaker name suffix from content
            content = re.sub(rf'\s*({speaker})$', '', content)
            
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
            if not seeking_dialogue and current_turn:
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
    
    index_data = []
    unified_data = {}
    
    os.makedirs(CONVO_DIR, exist_ok=True)
    api_queries = 0
    total_turns_count = 0
    
    for page_num, topic in TOPICS.items():
        slug = get_slug(topic)
        print(f"Parsing Page {page_num} ({topic}) -> slug: {slug}...")
        turns = parse_page_dialogues(page_num, reader)
        
        cleaned_turns = []
        for turn in turns:
            hindi_speaker = turn["Speaker"]
            english_speaker = SPEAKER_MAP.get(hindi_speaker, hindi_speaker)
            
            raw_hindi = clean_text(turn["Hindi"])
            raw_english = clean_text(turn["English"])
            
            # Clean speaker name if it was left in English part
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
                    
            cleaned_turns.append({
                "speaker_hi": hindi_speaker,
                "speaker_en": english_speaker,
                "hindi": raw_hindi,
                "transliteration": translit,
                "meaning": meaning
            })
            
        print(f"  Extracted {len(cleaned_turns)} turns.")
        total_turns_count += len(cleaned_turns)
        
        # Save individual topic JSON
        topic_dir = os.path.join(CONVO_DIR, slug)
        os.makedirs(topic_dir, exist_ok=True)
        topic_json_path = os.path.join(topic_dir, "conversation.json")
        
        topic_data = {
            "theme": topic,
            "slug": slug,
            "turns": cleaned_turns
        }
        with open(topic_json_path, 'w', encoding='utf-8') as f:
            json.dump(topic_data, f, ensure_ascii=False, indent=2)
            
        # Append to index
        index_data.append({
            "slug": slug,
            "theme": topic.replace("Daily Conversation - ", ""),
            "path": f"/conversations/{slug}/conversation.json"
        })
        
        # Add to unified data
        unified_data[slug] = {
            "theme": topic,
            "turns": cleaned_turns
        }
        
    # Save central index JSON
    index_path = os.path.join(CONVO_DIR, "index.json")
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent=2)
        
    # Save unified JSON
    with open(UNIFIED_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(unified_data, f, ensure_ascii=False, indent=2)
        
    print(f"\nExtraction complete! Total turns: {total_turns_count}")
    print(f"API Queries made: {api_queries}")
    print(f"Created index at: {index_path}")
    print(f"Created unified database at: {UNIFIED_JSON_PATH}")

if __name__ == "__main__":
    process_conversations()
