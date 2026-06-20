# Backend API Setup Guide

## ✅ Setup Complete!

Your Hindi transliteration validation system with backend API is now ready!

## 🚀 Running the Application

### Option 1: Run Both Servers Separately (Current Setup)

**Terminal 1 - Frontend:**
```bash
npm run dev
```
Runs on: http://localhost:5173

**Terminal 2 - Backend API:**
```bash
npm run server
```
Runs on: http://localhost:3001

### Option 2: Run Both Together
```bash
npm run dev:all
```
This runs both servers in a single terminal using `concurrently`.

## ☁️ Deploying the API on Vercel

If Cloudflare Workers cannot run your Express server, you can deploy the transliteration API as Vercel serverless functions:

1. [Install the Vercel CLI](https://vercel.com/docs/cli) and run `vercel login`.
2. From the project root, run `vercel` (first-time setup) and accept the prompts:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Deploy with `vercel deploy --prod`.

### How it works
- The frontend is built with `npm run build` → output served from `dist`.
- `/api/transliterate` and `/api/health` are serverless functions defined in `api/*.js`.
- The frontend automatically calls `/api/...` relative to the deployed domain, so no extra configuration is needed unless you set `VITE_API_BASE_URL`.

### Optional environment override
If you want the frontend to call a different API domain, set `VITE_API_BASE_URL` in your Vercel Project Settings → Environment Variables (or use a local `.env` file) and rebuild.

## 🌐 How It Works

### Architecture
```
Frontend (React)
    ↓
Backend API Server (Node.js/Express)
    ↓
Google Transliteration API
```

### Validation Flow
1. **Local Database First** (800+ entries) - Instant validation
2. **Backend API Fallback** - Validates any Hindi word via Google's API
3. **Caching** - API results are cached for repeat queries

## 📊 Features

### Frontend (`TypeToRevealPage.jsx`)
- ✅ Auto-detects if API server is running
- ✅ Shows "API ON" or "DB ONLY" status in navbar
- ✅ Real-time validation with loading indicators
- ✅ Displays source of validation (database vs API)
- ✅ Globe icon (🌐) for API-validated words

### Backend (`server.js`)
- ✅ Express.js API server
- ✅ CORS enabled for frontend access
- ✅ `/api/transliterate` - Main validation endpoint
- ✅ `/api/health` - Health check endpoint

## 🎯 Visual Indicators

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| ✅ Correct (DB) | Green | ✓ | Matches local database |
| ✅ Correct (API) | Green | ✓ + 🌐 | Validated by Google API |
| ❌ Incorrect | Red | ✗ | Wrong (shows correct answer) |
| ⏳ Validating | Blue | Spinner | Checking with API... |
| ⚠️ Pending | Orange | - | Need API server |

## 🔧 API Endpoints

### POST `/api/transliterate`
**Request:**
```json
{
  "text": "हम"
}
```

**Response:**
```json
{
  "success": true,
  "word": "हम",
  "transliterations": ["ham", "hum", "hama"]
}
```

### GET `/api/health`
**Response:**
```json
{
  "status": "OK",
  "message": "Transliteration API server running"
}
```

## 🧪 Testing

1. **Start both servers** (frontend + backend)
2. **Navigate to** http://localhost:5173/type-to-reveal
3. **Check status** - Should show "API ON" in green
4. **Paste Hindi text:**
   ```
   हम
   तेरे
   बिन
   ```
5. **Type transliterations** - Should validate instantly!

## 📝 Example Usage

### Words in Database (Instant)
- समझना → "samajhanaa" ✅ Green instantly

### Words NOT in Database (API Validation)
- हम → "ham" → 🔵 Validating... → ✅ Green (with 🌐 icon)
- तेरे → "tere" → 🔵 Validating... → ✅ Green (with 🌐 icon)

## 🐛 Troubleshooting

### "API Server Not Running" Message
**Solution:** Run `npm run server` in a separate terminal

### PORT 3001 Already in Use
**Solution:** Kill the process using port 3001 or change PORT in `server.js`

### CORS Errors
**Solution:** Backend already has CORS enabled. Ensure frontend is accessing `http://localhost:3001`

### No Validation for Unknown Words
**Check:**
1. API server is running (`npm run server`)
2. Green "API ON"  badge shows in navbar
3. Console logs show "✓ API server connected"

## 💡 Tips

1. **Local Database** = Fast, but limited to 800+ entries
2. **API Server** = Unlimited words, but requires server running
3. **Caching** = First API call is slow (~500ms), subsequent calls are instant
4. **Auto-detect** = Frontend automatically checks API status every 5 seconds

## 🎓 Next Steps

- Add more words to `hindi-practice.csv` or `conversations.csv` for instant validation
- The API will handle any words not in the database
- Consider deploying the backend API for production use

---

**You're all set!** 🚀 Your type-to-reveal feature now has unlimited Hindi word validation! 🎉
