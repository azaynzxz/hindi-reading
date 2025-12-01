import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import HindiPracticePage from './pages/HindiPracticePage.jsx'
import TypeToRevealPage from './pages/TypeToRevealPage.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/m:month-day:day" element={<App />} />
                <Route path="/hindi-practice" element={<HindiPracticePage />} />
                <Route path="/type-to-reveal" element={<TypeToRevealPage />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>,
)
