// Vocabulary utilities for detecting difficult words

// Common English words that are typically easy
const COMMON_WORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
    'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
    'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
    'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
    'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
    'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
    'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
    'most', 'us', 'is', 'was', 'are', 'were', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
    'can', 'cannot', 'am', 'is', 'are', 'was', 'were'
]);

// Words that are typically considered difficult (longer, less common)
export const isDifficultWord = (word) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:()"'-]/g, '');
    
    // Consider words difficult if:
    // 1. Longer than 6 characters
    // 2. Not in common words list
    // 3. Contains uncommon letter combinations
    
    if (cleanWord.length <= 3) return false; // Very short words are usually easy
    if (COMMON_WORDS.has(cleanWord)) return false;
    if (cleanWord.length > 6) return true;
    if (cleanWord.length > 4 && !COMMON_WORDS.has(cleanWord)) return true;
    
    return false;
};

export const getWordDifficulty = (word) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:()"'-]/g, '');
    if (cleanWord.length <= 3 || COMMON_WORDS.has(cleanWord)) return 'easy';
    if (cleanWord.length > 8) return 'hard';
    if (cleanWord.length > 5) return 'medium';
    return 'easy';
};

