import Sanscript from '@indic-transliteration/sanscript';

const schemes = ['itrans', 'hk', 'iast'];

// Helper to handle Nukta characters (dots below letters) common in Urdu loanwords
// Sanscript sometimes struggles with these, so we handle them manually or map them
export const handleNuktas = (text) => {
    return text
        // Pre-composed characters
        .replace(/क़/g, 'q')
        .replace(/ख़/g, 'kh')
        .replace(/ग़/g, 'g')
        .replace(/ज़/g, 'z')
        .replace(/झ़/g, 'zh')
        .replace(/ड़/g, 'r')
        .replace(/ढ़/g, 'rh')
        .replace(/फ़/g, 'f')
        // Decomposed characters (Letter + Nukta \u093C)
        .replace(/क\u093C/g, 'q')
        .replace(/ख\u093C/g, 'kh')
        .replace(/ग\u093C/g, 'g')
        .replace(/ज\u093C/g, 'z')
        .replace(/झ\u093C/g, 'zh')
        .replace(/ड\u093C/g, 'r')
        .replace(/ढ\u093C/g, 'rh')
        .replace(/फ\u093C/g, 'f');
};

const buildPriorityFixes = (text) => {
    const priority = [];

    if (text.includes('ख़ुद')) {
        priority.push('Khud', 'khud');
    }
    if (text.includes('ज़िन्दगी')) {
        priority.push('Zindagi', 'zindagi', 'zindagee');
    }

    return priority;
};

export const generateTransliterations = (text) => {
    if (!text) {
        return [];
    }

    const variations = new Set();
    const priorityVariations = buildPriorityFixes(text);
    const nuktaText = handleNuktas(text);

    [nuktaText, text].forEach((inputText) => {
        schemes.forEach((scheme) => {
            try {
                const result = Sanscript.t(inputText, 'devanagari', scheme);
                variations.add(result);

                if (result.endsWith('a')) {
                    variations.add(result.slice(0, -1));
                }

                variations.add(result.toLowerCase());

                if (result.length > 0) {
                    variations.add(result.charAt(0).toUpperCase() + result.slice(1));
                }

                const readable = result
                    .replace(/aa/g, 'a')
                    .replace(/ee/g, 'i')
                    .replace(/oo/g, 'u')
                    .replace(/v/g, 'w')
                    .replace(/sh/g, 's');
                variations.add(readable);

                if (readable.endsWith('a')) {
                    variations.add(readable.slice(0, -1));
                }
            } catch (error) {
                console.error(`Error with scheme ${scheme}:`, error);
            }
        });
    });

    const allVariations = [...priorityVariations, ...variations];
    const uniqueVariations = [...new Set(allVariations)]
        .filter((v) => v && v.trim().length > 0)
        .slice(0, 25);

    return uniqueVariations;
};

