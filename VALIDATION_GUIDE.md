# Type to Reveal - Validation Feature

## How Validation Works

### Database Loading
- On page load, the app fetches and parses `basic-practice.csv`
- Creates a dictionary mapping Hindi words to their correct transliterations
- Currently contains **38 words** from the CSV file
- Loading status shown on empty state

### Validation Logic

#### 1. **Case-Insensitive Matching**
- Converts both user input and correct answer to lowercase
- Removes extra whitespace
- Example: "SamajhaNaa", "samajhanaa", "SAMAJHANAA" all match "SamajhaNaa"

#### 2. **Three Validation States**

**🟢 Correct** (Green)
- User input matches the correct transliteration (case-insensitive)
- Card shows: Green border, green background, green checkmark
- Displays the meaning below the input (if available)

**🟡 Incorrect** (Yellow)
- User typed something, but it doesn't match the correct answer
- Card shows: Yellow border, yellow background, yellow X icon
- Shows the correct answer below: "Correct: SamajhaNaa"

**🔴 Unknown** (Red accent)
- User typed something for a word NOT in the database
- Card shows: Red border, red background, alert icon
- Small "?" shown to indicate word is not in database
- Accepts any input since we don't have the correct answer

**⚪ Empty** (Gray)
- No input yet
- Card shows: Gray border, white background
- Hindi word appears in gray

### Visual Feedback

#### Progress Tracking
**Desktop Sidebar:**
- Progress bar showing completion percentage
- Accuracy counter: "X/Y (Z%)" showing correct vs attempted
- Color-coded: Green (≥80%), Yellow (50-79%), Red (<50%)

**Main Area Header:**
- Shows "X correct / Y / Z completed"
- Real-time updates as you type

#### Card Colors
- **Border**: Changes based on validation state
- **Background**: Subtle tint matching the border color
- **Hindi Word**: Changes from gray → green/yellow/red based on state
- **Input Field**: Border and text color match validation state

### Features
✅ **Real-time validation** - Checks as you type
✅ **Case-insensitive** - Don't worry about capitalization  
✅ **Instant feedback** - See if you're correct immediately
✅ **Shows correct answer** - If wrong, displays the right transliteration
✅ **Shows meaning** - When correct, displays the word's meaning
✅ **Handles unknown words** - Works with words not in the database
✅ **Accuracy tracking** - Shows your overall correctness percentage

### Example Usage

**Paste this text:**
```
समझना
सुनना
बोलना
नमस्ते
```

**Type:**
- Card 1: Type "samajhanaa" → ✅ Green (Correct!)
- Card 2: Type "SuNaNaa" → ✅ Green (Correct! Case doesn't matter)
- Card 3: Type "speak" → ⚠️ Yellow (Wrong! Shows "Correct: boLaNaa")
- Card 4: Type "namaste" → ✅ Green (Correct!)

### Technical Details

**Normalization Function:**
```javascript
const normalizeText = (text) => {
    return text.toLowerCase().trim().replace(/\s+/g, '');
};
```

**Validation States:**
- `empty` - No input
- `correct` - Matches database
- `incorrect` - Doesn't match database
- `unknown` - Word not found in database

### Database Words (38 total)
From CSV sources:
- **Getting Started PDF**: Basic words (नमस्ते, हिंदी, सुनना, बोलना, समझना, etc.)
- **Top 25 Cheatsheet**: Common questions and phrases

### Future Enhancements
- [ ] Add partial matching (show if you're close)
- [ ] Suggest corrections for common mistakes
- [ ] Track which words you struggle with
- [ ] Add difficulty levels
- [ ] Sound pronunciation on correct answer
- [ ] Save progress/statistics to localStorage
