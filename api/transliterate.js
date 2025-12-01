import { generateTransliterations } from '../lib/transliteration.js';

const extractText = (body) => {
    if (!body) {
        return '';
    }

    if (typeof body === 'string') {
        try {
            const parsed = JSON.parse(body);
            return parsed?.text ?? '';
        } catch (error) {
            return body;
        }
    }

    if (typeof body === 'object') {
        return body.text ?? '';
    }

    return '';
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const text = extractText(req.body);

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const transliterations = generateTransliterations(text);

        return res.status(200).json({
            success: true,
            transliterations
        });
    } catch (error) {
        console.error('Transliteration error:', error);
        return res.status(500).json({ error: 'Transliteration failed' });
    }
}

