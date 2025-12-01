# Monthly Reading Challenge

A modern web application for daily English reading practice with interactive features, progress tracking, and vocabulary building.

## Features

- 30-day reading challenge with daily stories
- Text-to-speech functionality with multiple voice options
- Interactive teleprompter for pronunciation practice
- Vocabulary builder with word definitions and flashcards
- Progress tracking and statistics dashboard
- Social sharing with custom image generation
- Responsive design for mobile, tablet, and desktop

## Technology Stack

- React 18
- Vite
- Tailwind CSS
- Web Speech API
- Canvas API for image generation

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/monthly-reading-challenge.git
cd monthly-reading-challenge
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/     # React components
├── data/          # Reading content data
├── utils/         # Utility functions
└── App.jsx        # Main application component
```

## Features in Detail

### Reading Practice
- Daily reading content organized by month and day
- Clean, readable interface with Swiss design principles
- Smooth typing animations for text display

### Text-to-Speech
- Multiple voice options
- Word-by-word highlighting during playback
- Adjustable speech rate

**Note on Browser Voice Differences:**
- **Microsoft Edge**: Has access to all Windows SAPI5 TTS voices (typically 10-20+ English voices) because it uses Windows' native TTS engine directly.
- **Google Chrome**: Uses its own TTS engine and typically has fewer voices (2-4 English voices by default). Chrome may require user interaction to load voices.

**To Get More Voices in Chrome:**
1. Install additional Windows voices:
   - Go to **Settings** > **Time & Language** > **Speech**
   - Under **Manage voices**, select **Add voices** to install additional TTS voices
   - Restart your computer after installing
2. The app automatically refreshes voices when you interact with the voice selector dropdown
3. Some voices may become available after clicking the "Listen" button for the first time

### Teleprompter Mode
- Full-screen practice mode
- Adjustable scroll speed and text size
- Countdown timer before practice starts

### Vocabulary Builder
- Auto-highlighting of difficult words
- Click words to see definitions
- Save words to personal dictionary
- Flashcard review mode

### Progress Tracking
- Daily streak counter
- Total words read
- Total practice time
- Monthly progress calendar
- Achievement badges

### Social Sharing
- Generate custom share images with progress stats
- QR code for easy link sharing
- Share links that open specific reading days

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available for personal and educational use.

## Attribution

Created by Zayn


