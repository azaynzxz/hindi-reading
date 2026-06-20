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

# Manual overrides for pages 61, 63, 65 due to complex multi-column layout extraction errors
MANUAL_OVERLOADS = {
    61: [
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "नमस्ते !", "transliteration": "namaste!", "meaning": "Hello!"},
        {"speaker_hi": "शिल्पा", "speaker_en": "Shilpa", "hindi": "नमस्ते !", "transliteration": "namaste!", "meaning": "Hello!"},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "आपका नाम क्या है?", "transliteration": "aapkaa naam kyaa hai?", "meaning": "What is your name?"},
        {"speaker_hi": "शिल्पा", "speaker_en": "Shilpa", "hindi": "मेरा नाम शिल्पा है| और आपका?", "transliteration": "meraa naam shilpaa hai. aur aapkaa?", "meaning": "My name is Shilpa. And yours?"},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "मेरा नाम विद्या है|", "transliteration": "meraa naam Vidya hai.", "meaning": "My name is Vidya."},
        {"speaker_hi": "शिल्पा", "speaker_en": "Shilpa", "hindi": "आप कहाँ से हैं?", "transliteration": "aap kahaan se hain?", "meaning": "Where are you from?"},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "मैं मिशिगन से हूँ | आप कहाँ से हैं ?", "transliteration": "main Michigan se hoon. aap kahaan se hain?", "meaning": "I am from Michigan. Where are you from?"},
        {"speaker_hi": "शिल्पा", "speaker_en": "Shilpa", "hindi": "मैं शिकागो से हूँ |", "transliteration": "main Chicago se hoon.", "meaning": "I am from Chicago."},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "आप कितने साल की हैं?", "transliteration": "aap kitane saal kii hain?", "meaning": "How old are you?"},
        {"speaker_hi": "शिल्पा", "speaker_en": "Shilpa", "hindi": "मैं बीस साल की हूँ| आपकी उम्र कितनी है?", "transliteration": "main biis saal kii hoon. aapkii umr kitanii hai?", "meaning": "I am 20. What is your age?"},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "मैं इक्कीस (साल) की हूँ |", "transliteration": "main ikkiis (saal) kii hoon.", "meaning": "I am 21."},
        {"speaker_hi": "शिल्पा", "speaker_en": "Shilpa", "hindi": "आपका मेजर क्या है?", "transliteration": "aapkaa major kyaa hai?", "meaning": "What is your major?"},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "मेरा मेजर अंग्रेज़ी है| और आपका ?", "transliteration": "meraa major angrezii hai. aur aapakaa?", "meaning": "My major is English. And yours?"},
        {"speaker_hi": "शिल्पा", "speaker_en": "Shilpa", "hindi": "मेरा मेजर राजनीति शास्त्र है|", "transliteration": "meraa major raajaniiti shaastra hai.", "meaning": "My major is Political science."},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "यह लड़का कौन है?", "transliteration": "ye laRakaa kaun hai?", "meaning": "Who is this boy?"},
        {"speaker_hi": "शिल्पा", "speaker_en": "Shilpa", "hindi": "यह पीटर है|", "transliteration": "ye Peter hai.", "meaning": "He is Peter."},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "नमस्ते पीटर !", "transliteration": "namaste Peter!", "meaning": "Hello Peter!"},
        {"speaker_hi": "पीटर", "speaker_en": "Peter", "hindi": "नमस्ते ! आपका नाम क्या है ?", "transliteration": "namaste! aapkaa naam kyaa hai?", "meaning": "Hello! What is your name?"},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "मैं विद्या हूँ| आप कैसे हैं?", "transliteration": "main vidyaa hoon. aap kaise hain?", "meaning": "I am Vidya. How are you?"},
        {"speaker_hi": "पीटर", "speaker_en": "Peter", "hindi": "मैं अच्छा हूँ| और आप?", "transliteration": "main achchhaa hoon. aur aap?", "meaning": "I am well. and you?"},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "मैं भी अच्छी हूँ, धन्यवाद ! आपकी उम्र कितनी है?", "transliteration": "main bhii achchhii hoon, dhanyavaad! aapkii umr kitanii hai?", "meaning": "I am well too. Thanks! What is your age?"},
        {"speaker_hi": "पीटर", "speaker_en": "Peter", "hindi": "मैं उन्नीस साल का हूँ| आपका मेजर क्या है ?", "transliteration": "main unniis saal kaa hoon. aapakaa major kyaa hai?", "meaning": "I am 19 years old. What is your major?"},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "मेरा मेजर अंग्रेज़ी है, और आपका?", "transliteration": "meraa major angrezii hai, aur aapakaa?", "meaning": "My major is English. And yours?"},
        {"speaker_hi": "पीटर", "speaker_en": "Peter", "hindi": "मेरा भी |", "transliteration": "meraa bhii.", "meaning": "Mine too."},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "आप से मिलकर ख़ुशी हुई |", "transliteration": "aap se milakar khushii huii.", "meaning": "Nice to meet you."},
        {"speaker_hi": "पीटर", "speaker_en": "Peter", "hindi": "मुझे भी, नमस्ते !", "transliteration": "mujhe bhii, namaste!", "meaning": "Me too, Bye!"},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "नमस्ते !", "transliteration": "namaste!", "meaning": "Bye!"}
    ],
    63: [
        {"speaker_hi": "ऋतिक", "speaker_en": "Hritik", "hindi": "नमस्ते", "transliteration": "namaste", "meaning": "Hello"},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "नमस्ते", "transliteration": "namaste", "meaning": "Hello"},
        {"speaker_hi": "ऋतिक", "speaker_en": "Hritik", "hindi": "क्या हाल है", "transliteration": "kyaa haal hai", "meaning": "How are you"},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "सब ठीक है | और तुम", "transliteration": "sab Thiik hai. aur tum", "meaning": "All is well. and you"},
        {"speaker_hi": "ऋतिक", "speaker_en": "Hritik", "hindi": "मैं भी ठीक हूँ", "transliteration": "main bhii Thiik hoon", "meaning": "I am well too"},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "क्लास चलें", "transliteration": "class chalen", "meaning": "Should we go to class"},
        {"speaker_hi": "ऋतिक", "speaker_en": "Hritik", "hindi": "चलो |", "transliteration": "chalo", "meaning": "Let’s go"},
        {"speaker_hi": "विद्या", "speaker_en": "Vidya", "hindi": "फिर मिलेंगे, नमस्ते", "transliteration": "phir milenge, namaste", "meaning": "See you again, Bye"},
        {"speaker_hi": "ऋतिक", "speaker_en": "Hritik", "hindi": "ठीक है, नमस्ते", "transliteration": "Thiik hai, namaste", "meaning": "Okay, Bye"}
    ],
    65: [
        {"speaker_hi": "शिल्पा", "speaker_en": "Shilpa", "hindi": "हेलो पीटर! क्या चल रहा है?", "transliteration": "Hello Peter! kyaa chal rahaa hai?", "meaning": "Hello Peter! What is going on?"},
        {"speaker_hi": "पीटर", "speaker_en": "Peter", "hindi": "नमस्ते शिल्पा, सब ठीक है| क्या हाल है?", "transliteration": "namaste Shilpaa, sab Thiik hai| kyaa haal hai?", "meaning": "Hello Shilpa, All is well. How are you?"},
        {"speaker_hi": "शिल्पा", "speaker_en": "Shilpa", "hindi": "सब ठीक है| अच्छा, आपका ई.मेल एड्रेस क्या है?", "transliteration": "sab Thiik hai| achchhaa, aapkaa e.mail address kyaa hai?", "meaning": "All is well. Okay, what is your e.mail address?"},
        {"speaker_hi": "पीटर", "speaker_en": "Peter", "hindi": "मेरा ई.मेल एड्रेस peter@gmail.com है| और आपका?", "transliteration": "meraa e.mail address peter@gmail.com hai. aur aapkaa?", "meaning": "My e.mail address is peter@gmail.com. And yours?"},
        {"speaker_hi": "शिल्पा", "speaker_en": "Shilpa", "hindi": "मेरा ई.मेल एड्रेस shilpaa@gmail.com है|", "transliteration": "meraa e.mail address shilpaa@gmail.com hai.", "meaning": "My e.mail address is shilpaa@gmail.com."},
        {"speaker_hi": "पीटर", "speaker_en": "Peter", "hindi": "आपका फ़ोन नंबर क्या है?", "transliteration": "aapkaa phone number kyaa hai?", "meaning": "What is your phone number?"},
        {"speaker_hi": "शिल्पा", "speaker_en": "Shilpa", "hindi": "मेरा फ़ोन नंबर 555-xxx-xxxx है| और आपका?", "transliteration": "meraa phone number 555-xxx-xxxx hai. aur aapkaa?", "meaning": "My phone number is 555-xxx-xxx. And yours?"},
        {"speaker_hi": "पीटर", "speaker_en": "Peter", "hindi": "मेरा फ़ोन नंबर 555-xxx-xxxx है|", "transliteration": "meraa phone number 555-xxx-xxx hai.", "meaning": "My phone number is 555-xxx-xxx."},
        {"speaker_hi": "शिल्पा", "speaker_en": "Shilpa", "hindi": "धन्यवाद ! फिर मिलेंगे, नमस्ते", "transliteration": "dhanyawaad! phir milenge, namaste", "meaning": "Thanks! See you again, Bye"},
        {"speaker_hi": "पीटर", "speaker_en": "Peter", "hindi": "अच्छा, बाय", "transliteration": "achchhaa, bye", "meaning": "Okay, Bye"}
    ]
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

def clean_punctuation_noise(text):
    """Deep cleanup of punctuation markers left by PDF column merges."""
    cleaned = text.strip()
    # Strip leading punctuation noise (commas, question marks, exclamations, pipes, and whitespace)
    cleaned = re.sub(r'^[,\s\?!\.:|]+', '', cleaned)
    # Strip trailing punctuation noise (commas, colons, pipes, and whitespace)
    cleaned = re.sub(r'[,\s\.:|]+$', '', cleaned)
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
            
            # Clean speaker name suffix from content (both Devanagari and English)
            english_speaker = SPEAKER_MAP.get(speaker, speaker)
            content = re.sub(rf'\s*({speaker})$', '', content)
            content = re.sub(rf'\s*({english_speaker})$', '', content, flags=re.IGNORECASE)
            
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
        
        # Check manual overloads
        if page_num in MANUAL_OVERLOADS:
            print(f"  Using manual overload list ({len(MANUAL_OVERLOADS[page_num])} turns).")
            cleaned_turns = MANUAL_OVERLOADS[page_num]
        else:
            turns = parse_page_dialogues(page_num, reader)
            cleaned_turns = []
            
            for turn in turns:
                hindi_speaker = turn["Speaker"]
                english_speaker = SPEAKER_MAP.get(hindi_speaker, hindi_speaker)
                
                raw_hindi = clean_text(turn["Hindi"])
                raw_english = clean_text(turn["English"])
                
                # Clean speaker name if it was left in English part
                raw_english = re.sub(r'^[a-zA-Z\s]+:\s*', '', raw_english)
                
                # Strip trailing speaker name suffix from fields
                raw_hindi = re.sub(rf'\s*({hindi_speaker})$', '', raw_hindi)
                raw_hindi = re.sub(rf'\s*({english_speaker})$', '', raw_hindi, flags=re.IGNORECASE)
                raw_english = re.sub(rf'\s*({english_speaker})$', '', raw_english, flags=re.IGNORECASE)
                
                # Clean values
                raw_hindi = clean_punctuation_noise(clean_text(raw_hindi))
                translit = ""
                meaning = clean_punctuation_noise(clean_text(raw_english))
                
                if not raw_hindi or not meaning:
                    continue
                    
                # If no transliteration was extracted, call API
                if not translit:
                    api_queries += 1
                    api_translit = query_transliteration_api(raw_hindi)
                    if api_translit:
                        translit = clean_punctuation_noise(clean_text(api_translit))
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
