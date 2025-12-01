import express from 'express';
import cors from 'cors';
import { generateTransliterations, handleNuktas } from './lib/transliteration.js';

const app = express();
const PORT = 3001;

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Transliteration endpoint
app.post('/api/transliterate', (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    console.log(`\nTransliterating: ${text}`);
    console.log('Hex:', text.split('').map(c => c.charCodeAt(0).toString(16)).join(' '));

    try {
        const nuktaText = handleNuktas(text);
        console.log('NuktaText:', nuktaText);

        const transliterations = generateTransliterations(text);
        console.log(`  ✓ Variations: ${transliterations.join(', ')}`);

        res.json({
            success: true,
            transliterations
        });
    } catch (error) {
        console.error('Transliteration error:', error);
        res.status(500).json({ error: 'Transliteration failed' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Smart Hindi → Roman Transliteration API'
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Transliteration API server running on http://localhost:${PORT}`);
    console.log(`📡 Endpoint: http://localhost:${PORT}/api/transliterate`);
    console.log(`✨ Features: Nukta support, multiple romanization variations, schwa deletion\n`);
});
