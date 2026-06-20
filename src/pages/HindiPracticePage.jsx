import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, ChevronLeft, ChevronRight, BookOpen, Languages, Type, CheckCircle, XCircle, RefreshCw, Menu, X, Globe, Loader2 } from 'lucide-react';

import { API_BASE_URL } from '../utils/api';

const normalizeText = (text) => text.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

const HindiPracticePage = () => {
    const navigate = useNavigate();
    const [allWords, setAllWords] = useState([]);
    const [words, setWords] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [mode, setMode] = useState('flashcard'); // 'flashcard' | 'read' | 'translate'
    const [userInput, setUserInput] = useState('');
    const [wordInputs, setWordInputs] = useState([]);
    const [isCorrect, setIsCorrect] = useState(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [apiServerRunning, setApiServerRunning] = useState(false);
    const [apiCache, setApiCache] = useState({});
    const [isValidating, setIsValidating] = useState(false);
    const inputRefs = useRef([]);

    // Check if API server is running — only poll when tab is visible
    useEffect(() => {
        const checkAPIServer = async () => {
            if (document.visibilityState !== 'visible') return;
            try {
                const response = await fetch(`${API_BASE_URL}/health`);
                const data = await response.json();
                if (data.status === 'OK') {
                    setApiServerRunning(true);
                }
            } catch (error) {
                setApiServerRunning(false);
            }
        };

        checkAPIServer();
        const interval = setInterval(checkAPIServer, 5000);
        document.addEventListener('visibilitychange', checkAPIServer);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', checkAPIServer);
        };
    }, []);

    useEffect(() => {
        const loadCSV = async () => {
            try {
                const response = await fetch('/hindi-practice.csv');
                const text = await response.text();

                const lines = text.split('\n').filter(line => line.trim());
                const parsedWords = lines.slice(1).map(line => {
                    // Handle CSV parsing with potential quoted values
                    const values = line.match(/(\".*?\"|[^,]+)(?=\s*,|\s*$)/g) || [];
                    const cleanValues = values.map(v => v.replace(/^\"|\"$/g, '').trim());

                    return {
                        source: cleanValues[0] || 'General',
                        hindi: cleanValues[1],
                        transliteration: cleanValues[2],
                        meaning: cleanValues[3]
                    };
                }).filter(word => word.hindi && word.transliteration);

                setAllWords(parsedWords);
                setWords(parsedWords);

                const uniqueCategories = ['All', ...new Set(parsedWords.map(w => w.source))];
                setCategories(uniqueCategories);

                setIsLoading(false);
            } catch (error) {
                console.error('Error loading CSV:', error);
                setIsLoading(false);
            }
        };

        loadCSV();
    }, []);

    // Filter words when category changes
    useEffect(() => {
        if (selectedCategory === 'All') {
            setWords(allWords);
        } else {
            setWords(allWords.filter(w => w.source === selectedCategory));
        }
        setCurrentIndex(0);
        resetStateForNewCard();
    }, [selectedCategory, allWords]);

    const resetStateForNewCard = () => {
        setIsFlipped(false);
        setShowAnswer(false);
        setUserInput('');
        setWordInputs([]);
        setIsCorrect(null);
    };

    const handleNext = () => {
        if (!words.length) return;
        resetStateForNewCard();
        setCurrentIndex((prev) => (prev + 1) % words.length);
    };

    const handlePrev = () => {
        if (!words.length) return;
        resetStateForNewCard();
        setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
    };

    const handleShuffle = () => {
        if (!words.length) return;
        resetStateForNewCard();
        const shuffled = [...words];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setWords(shuffled);
        setCurrentIndex(0);
    };

    const handleWordSelect = (index) => {
        resetStateForNewCard();
        setCurrentIndex(index);
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    const currentWord = words[currentIndex];

    // Initialize word inputs when current word changes or mode changes to 'read'
    useEffect(() => {
        if (currentWord && mode === 'read') {
            const hindiWords = currentWord.hindi.split(/\s+/);
            setWordInputs(new Array(hindiWords.length).fill(''));
            setTimeout(() => {
                if (inputRefs.current[0]) inputRefs.current[0].focus();
            }, 100);
        }
    }, [currentWord, mode]);

    const validateWordWithApi = async (hindiWord) => {
        if (apiCache[hindiWord]) return apiCache[hindiWord];

        try {
            const response = await fetch(`${API_BASE_URL}/transliterate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: hindiWord })
            });

            const data = await response.json();

            if (data.success && data.transliterations) {
                setApiCache(prev => ({
                    ...prev,
                    [hindiWord]: data.transliterations
                }));
                return data.transliterations;
            }
        } catch (error) {
            // silently fail
        }
        return null;
    };

    const handleCheckAnswer = async () => {
        if (!currentWord) return;

        setIsValidating(true);
        let correct = false;

        if (mode === 'read') {
            const targetWords = currentWord.transliteration.split(/\s+/);
            const hindiWords = currentWord.hindi.split(/\s+/);

            const results = await Promise.all(wordInputs.map(async (input, idx) => {
                if (!targetWords[idx]) return false;

                const normalizedInput = normalizeText(input || '');

                if (apiServerRunning && hindiWords[idx]) {
                    const transliterations = await validateWordWithApi(hindiWords[idx]);
                    if (transliterations && transliterations.length > 0) {
                        return transliterations.some(t => normalizeText(t) === normalizedInput);
                    }
                }

                return null;
            }));

            const apiUnavailable = results.some(r => r === null);
            if (apiUnavailable) {
                setIsCorrect('api_unavailable');
                setShowAnswer(true);
                setIsValidating(false);
                return;
            }

            const allCorrect = results.every(r => r === true);
            correct = allCorrect && wordInputs.length === targetWords.length;

        } else if (mode === 'translate') {
            if (!userInput.trim()) {
                setIsValidating(false);
                return;
            }
            correct = normalizeText(userInput) === normalizeText(currentWord.meaning);
        }

        setIsCorrect(correct);
        setShowAnswer(true);
        setIsValidating(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !showAnswer) {
            handleCheckAnswer();
        } else if (e.key === 'Enter' && showAnswer) {
            handleNext();
        }
    };

    const handleWordInputKeyDown = (e, index) => {
        if (e.key === 'Enter' && !showAnswer) {
            handleCheckAnswer();
        } else if (e.key === 'Enter' && showAnswer) {
            handleNext();
        } else if (e.key === ' ' && !showAnswer) {
            e.preventDefault();
            if (index < wordInputs.length - 1) {
                inputRefs.current[index + 1].focus();
            }
        } else if (e.key === 'Backspace' && !wordInputs[index] && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1].focus();
        }
    };

    // ─── RENDER ────────────────────────────────────────────────────────────
    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-stone-50" style={{ background: 'var(--bg)', color: 'var(--fg)', fontFamily: "'DM Sans', sans-serif" }}>

            {/* ── Navbar — Swiss: no shadow, 1px bottom rule only ── */}
            <nav className="w-full bg-white border-b flex-shrink-0 z-20 fixed top-0" style={{ borderColor: 'var(--rule)' }}>
                <div className="w-full max-w-6xl mx-auto px-6">
                    <div className="h-12 flex items-center justify-between">
                        {/* Left: back + title */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center gap-1 transition-opacity hover:opacity-60"
                                style={{ color: 'var(--muted)', fontSize: '12px', letterSpacing: '0.05em' }}
                                title="Back"
                            >
                                <ChevronLeft size={14} />
                                <span className="uppercase font-medium hidden sm:inline">Reading</span>
                            </button>
                            <div className="w-px h-4" style={{ background: 'var(--rule)' }} />
                            <span className="font-bold uppercase tracking-widest" style={{ fontSize: '12px', color: 'var(--fg)' }}>
                                Hindi Practice
                            </span>
                        </div>

                        {/* Right: nav links + API status */}
                        <div className="flex items-center gap-6">
                            {/* API status — minimal badge */}
                            <span className="hidden sm:flex items-center gap-1.5" style={{ fontSize: '11px', letterSpacing: '0.08em', color: apiServerRunning ? '#4A7C59' : 'var(--muted)' }}>
                                <Globe size={11} />
                                <span className="uppercase font-medium">{apiServerRunning ? 'API' : 'DB'}</span>
                            </span>

                            <button
                                onClick={() => navigate('/type-to-reveal')}
                                className="hidden sm:block uppercase font-medium transition-opacity hover:opacity-60"
                                style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--muted)' }}
                            >
                                Type Practice
                            </button>

                            <button
                                onClick={() => navigate('/hindi-conversation')}
                                className="hidden sm:block uppercase font-medium transition-opacity hover:opacity-60"
                                style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--muted)' }}
                            >
                                Conversation
                            </button>

                            <button
                                onClick={() => navigate('/')}
                                className="hidden sm:flex items-center gap-1 uppercase font-medium transition-opacity hover:opacity-60"
                                style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--muted)' }}
                            >
                                <BookOpen size={12} />
                                <span>Reading</span>
                            </button>

                            {/* Mobile sidebar toggle */}
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden transition-opacity hover:opacity-60"
                                style={{ color: 'var(--fg)' }}
                            >
                                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Main Layout ── */}
            <div className="w-full flex-1 flex flex-col items-center justify-center pt-16 md:pt-20 pb-4 px-4 md:px-6 lg:px-8 min-h-0 overflow-hidden">
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0 max-h-full relative">

                    {/* ── Sidebar — Swiss: flat panel, 1px right rule, no bg card ── */}
                    <aside className={`
                        absolute lg:static inset-y-0 left-0 z-10 w-72 lg:w-full lg:h-full lg:min-h-0 bg-white flex flex-col lg:col-span-3
                        border transition-transform duration-300 ease-in-out
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    `} style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>

                        {/* Category filter */}
                        <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--rule)' }}>
                            <p className="uppercase font-medium mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--muted)' }}>
                                Category
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className="transition-all"
                                        style={{
                                            fontSize: '11px',
                                            letterSpacing: '0.06em',
                                            padding: '3px 8px',
                                            border: '1px solid',
                                            borderColor: selectedCategory === cat ? 'var(--accent)' : 'var(--rule)',
                                            color: selectedCategory === cat ? 'var(--accent)' : 'var(--muted)',
                                            background: selectedCategory === cat ? 'rgba(136,0,0,0.05)' : 'transparent',
                                            fontWeight: selectedCategory === cat ? '600' : '400',
                                            borderRadius: 0,
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Word list — rows with 1px rules */}
                        <div className="flex-1 overflow-y-auto">
                            {words.map((word, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleWordSelect(idx)}
                                    className="w-full text-left flex flex-col px-5 py-3 transition-colors border-b"
                                    style={{
                                        borderColor: 'var(--rule)',
                                        background: currentIndex === idx ? 'rgba(136,0,0,0.04)' : 'transparent',
                                        borderLeft: currentIndex === idx ? '2px solid var(--accent)' : '2px solid transparent',
                                    }}
                                >
                                    <span className="font-bold" style={{
                                        fontSize: '15px',
                                        color: currentIndex === idx ? 'var(--accent)' : 'var(--fg)'
                                    }}>
                                        {word.hindi}
                                    </span>
                                    <span className="truncate" style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
                                        {word.meaning}
                                    </span>
                                </button>
                            ))}
                            {words.length === 0 && (
                                <div className="px-5 py-8 text-center" style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                    No words found
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* Mobile sidebar overlay */}
                    {isSidebarOpen && (
                        <div
                            className="absolute inset-0 bg-black/20 z-[5] lg:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    {/* ── Main content area ── */}
                    <main className="lg:col-span-9 flex flex-col min-h-0 bg-white border" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                        <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 flex flex-col items-center justify-start">
                            <div className="w-full max-w-2xl flex flex-col gap-5">

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-3">
                                <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
                                <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Loading practice data...</p>
                            </div>
                        ) : words.length === 0 ? (
                            <div className="text-center py-16">
                                <BookOpen className="mx-auto mb-4" size={40} style={{ color: 'var(--rule)' }} />
                                <p className="font-bold mb-1" style={{ fontSize: '18px' }}>No words found</p>
                                <button
                                    onClick={() => setSelectedCategory('All')}
                                    className="underline transition-opacity hover:opacity-60"
                                    style={{ fontSize: '13px', color: 'var(--accent)' }}
                                >
                                    Reset filters
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* ── Controls bar — flat, no card ── */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--rule)' }}>

                                    {/* Mode switcher — plain text underline tabs */}
                                    <div className="flex items-center gap-6">
                                        {[
                                            { id: 'flashcard', label: 'Flashcard' },
                                            { id: 'read', label: 'Reading' },
                                            { id: 'translate', label: 'Meaning' },
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => { setMode(m.id); resetStateForNewCard(); }}
                                                className="transition-all"
                                                style={{
                                                    fontSize: '13px',
                                                    fontWeight: mode === m.id ? '700' : '400',
                                                    color: mode === m.id ? 'var(--accent)' : 'var(--muted)',
                                                    borderBottom: mode === m.id ? '2px solid var(--accent)' : '2px solid transparent',
                                                    paddingBottom: '2px',
                                                    letterSpacing: '0.02em',
                                                }}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Counter + shuffle */}
                                    <div className="flex items-center gap-4">
                                        <span style={{ fontSize: '12px', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                                            {currentIndex + 1} <span style={{ color: 'var(--rule)' }}>/</span> {words.length}
                                        </span>
                                        <button
                                            onClick={handleShuffle}
                                            className="flex items-center gap-1.5 transition-opacity hover:opacity-60"
                                            style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.08em' }}
                                        >
                                            <RotateCw size={12} />
                                            <span className="uppercase">Shuffle</span>
                                        </button>
                                        <span className="text-xs px-1.5 py-0.5 border uppercase" style={{
                                            fontSize: '10px',
                                            letterSpacing: '0.08em',
                                            borderColor: 'var(--rule)',
                                            color: 'var(--muted)',
                                            background: 'transparent',
                                        }}>
                                            {currentWord?.source}
                                        </span>
                                    </div>
                                </div>

                                {/* ── Flashcard Mode ── */}
                                {mode === 'flashcard' && (
                                    <div
                                        id="flashcard-container"
                                        className="perspective-1000 w-full cursor-pointer"
                                        style={{ height: '340px' }}
                                        onClick={() => setIsFlipped(!isFlipped)}
                                    >
                                        <div className={`relative w-full h-full transform-style-3d transition-all duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
                                            {/* Front */}
                                            <div className="absolute inset-0 backface-hidden bg-white border flex flex-col items-center justify-center p-8"
                                                style={{ borderColor: 'var(--rule)' }}>
                                                <span className="absolute top-5 left-6 uppercase font-medium" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--muted)' }}>
                                                    Hindi
                                                </span>
                                                <h3 className="font-bold text-center leading-tight mb-6" style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', color: 'var(--fg)' }}>
                                                    {currentWord?.hindi}
                                                </h3>
                                                <p className="flex items-center gap-2 uppercase" style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'var(--muted)' }}>
                                                    <RotateCw size={12} /> Tap to flip
                                                </p>
                                            </div>

                                            {/* Back */}
                                            <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8"
                                                style={{ background: 'var(--fg)' }}>
                                                <span className="absolute top-5 left-6 uppercase font-medium" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)' }}>
                                                    Answer
                                                </span>
                                                <div className="text-center space-y-6">
                                                    <div>
                                                        <p className="uppercase mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}>
                                                            Transliteration
                                                        </p>
                                                        <p className="font-bold font-mono" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', color: 'white' }}>
                                                            {currentWord?.transliteration}
                                                        </p>
                                                    </div>
                                                    <div className="w-12 h-px mx-auto" style={{ background: 'rgba(255,255,255,0.2)' }} />
                                                    <div>
                                                        <p className="uppercase mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)' }}>
                                                            Meaning
                                                        </p>
                                                        <p className="font-medium" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', color: 'rgba(255,255,255,0.9)' }}>
                                                            {currentWord?.meaning}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── Reading Mode ── */}
                                {mode === 'read' && (
                                    <div id="reading-mode-container" className="w-full flex flex-col gap-6">
                                        <p className="uppercase font-medium" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--muted)' }}>
                                            Type the transliteration — word by word
                                        </p>

                                        <div className="flex flex-wrap justify-center gap-6 py-4">
                                            {currentWord?.hindi.split(/\s+/).map((word, idx) => {
                                                const targetWords = currentWord.transliteration.split(/\s+/);
                                                const targetWord = targetWords[idx] || '';
                                                const isWordCorrect = showAnswer && isCorrect !== 'api_unavailable' &&
                                                    normalizeText(wordInputs[idx] || '') === normalizeText(targetWord);
                                                const isWordWrong = showAnswer && isCorrect !== 'api_unavailable' && !isWordCorrect;

                                                return (
                                                    <div key={idx} className="flex flex-col items-center gap-3">
                                                        <h3 className="font-bold text-center" style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', color: 'var(--fg)' }}>
                                                            {word}
                                                        </h3>
                                                        <input
                                                            id={`reading-input-${idx}`}
                                                            ref={el => inputRefs.current[idx] = el}
                                                            type="text"
                                                            value={wordInputs[idx] || ''}
                                                            onChange={(e) => {
                                                                const newInputs = [...wordInputs];
                                                                newInputs[idx] = e.target.value;
                                                                setWordInputs(newInputs);
                                                                if (showAnswer) { setShowAnswer(false); setIsCorrect(null); }
                                                            }}
                                                            onKeyDown={(e) => handleWordInputKeyDown(e, idx)}
                                                            placeholder={idx === 0 ? 'Type...' : ''}
                                                            disabled={showAnswer && isCorrect !== 'api_unavailable'}
                                                            className="text-center outline-none transition-colors"
                                                            style={{
                                                                width: '120px',
                                                                padding: '8px 12px',
                                                                fontSize: '14px',
                                                                fontFamily: "'DM Sans', sans-serif",
                                                                border: '1px solid',
                                                                borderRadius: 0,
                                                                borderColor: isWordCorrect ? '#4A7C59' : isWordWrong ? 'var(--accent)' : 'var(--rule)',
                                                                background: isWordCorrect ? '#F0FAF3' : isWordWrong ? 'rgba(136,0,0,0.04)' : 'white',
                                                                color: isWordCorrect ? '#2D5E40' : isWordWrong ? 'var(--accent)' : 'var(--fg)',
                                                            }}
                                                        />
                                                        {showAnswer && isCorrect !== 'api_unavailable' && isWordWrong && (
                                                            <span className="font-mono font-bold" style={{ fontSize: '12px', color: 'var(--accent)' }}>
                                                                {targetWord}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Action */}
                                        <div className="flex flex-col gap-3">
                                            {!showAnswer ? (
                                                <button
                                                    id="read-check-answer-btn"
                                                    onClick={handleCheckAnswer}
                                                    disabled={isValidating}
                                                    className="w-full py-3 font-bold uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-40 flex items-center justify-center gap-2"
                                                    style={{ fontSize: '12px', letterSpacing: '0.12em', background: 'var(--fg)', color: 'white', border: 'none', borderRadius: 0 }}
                                                >
                                                    {isValidating ? <Loader2 className="animate-spin" size={16} /> : 'Check Answer'}
                                                </button>
                                            ) : isCorrect === 'api_unavailable' ? (
                                                <div className="border-l-2 pl-4 py-3" style={{ borderColor: '#D97706' }}>
                                                    <p className="font-bold mb-1" style={{ fontSize: '13px', color: '#B45309' }}>API Server Required</p>
                                                    <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                                        Reading mode needs the API server. Run{' '}
                                                        <code style={{ fontFamily: 'monospace', background: '#FEF3C7', padding: '1px 5px', color: '#92400E' }}>npm run server</code>
                                                    </p>
                                                    <button id="read-next-word-btn" onClick={handleNext} className="mt-3 uppercase font-bold underline transition-opacity hover:opacity-60" style={{ fontSize: '12px', letterSpacing: '0.08em', color: 'var(--fg)' }}>
                                                        Next →
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3">
                                                    <div className="border-l-2 pl-4 py-2" style={{ borderColor: isCorrect ? '#4A7C59' : 'var(--accent)' }}>
                                                        <p className="font-bold" style={{ fontSize: '13px', color: isCorrect ? '#2D5E40' : 'var(--accent)' }}>
                                                            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                        </p>
                                                        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>
                                                            {currentWord?.meaning}
                                                        </p>
                                                    </div>
                                                    <button
                                                        id="read-next-word-btn"
                                                        onClick={handleNext}
                                                        className="w-full py-3 font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
                                                        style={{ fontSize: '12px', letterSpacing: '0.12em', background: 'var(--fg)', color: 'white', border: 'none', borderRadius: 0 }}
                                                    >
                                                        Next →
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ── Translation Mode ── */}
                                {mode === 'translate' && (
                                    <div id="translation-mode-container" className="w-full flex flex-col gap-6">
                                        <p className="uppercase font-medium" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--muted)' }}>
                                            Translate to English
                                        </p>

                                        <h3 className="font-bold text-center" style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', color: 'var(--fg)' }}>
                                            {currentWord?.hindi}
                                        </h3>

                                        <div className="relative">
                                            <input
                                                id="translation-input"
                                                type="text"
                                                value={userInput}
                                                onChange={(e) => {
                                                    setUserInput(e.target.value);
                                                    if (showAnswer) { setShowAnswer(false); setIsCorrect(null); }
                                                }}
                                                onKeyDown={handleKeyDown}
                                                placeholder="English meaning..."
                                                autoFocus
                                                className="w-full outline-none transition-colors"
                                                style={{
                                                    padding: '12px 16px',
                                                    fontSize: '16px',
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    border: '1px solid',
                                                    borderRadius: 0,
                                                    borderColor: showAnswer
                                                        ? isCorrect ? '#4A7C59' : 'var(--accent)'
                                                        : 'var(--rule)',
                                                    background: showAnswer
                                                        ? isCorrect ? '#F0FAF3' : 'rgba(136,0,0,0.04)'
                                                        : 'white',
                                                    color: 'var(--fg)',
                                                }}
                                            />
                                            {showAnswer && (
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    {isCorrect
                                                        ? <CheckCircle size={18} style={{ color: '#4A7C59' }} />
                                                        : <XCircle size={18} style={{ color: 'var(--accent)' }} />}
                                                </span>
                                            )}
                                        </div>

                                        {!showAnswer ? (
                                            <button
                                                id="translate-check-answer-btn"
                                                onClick={handleCheckAnswer}
                                                className="w-full py-3 font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
                                                style={{ fontSize: '12px', letterSpacing: '0.12em', background: 'var(--fg)', color: 'white', border: 'none', borderRadius: 0 }}
                                            >
                                                Check Answer
                                            </button>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                {!isCorrect && (
                                                    <div className="border-l-2 pl-4 py-2" style={{ borderColor: 'var(--rule)' }}>
                                                        <p className="uppercase font-medium mb-0.5" style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--muted)' }}>Correct answer</p>
                                                        <p className="font-mono font-bold" style={{ fontSize: '14px', color: 'var(--fg)' }}>{currentWord?.transliteration}</p>
                                                        <p style={{ fontSize: '14px', color: 'var(--fg)', marginTop: '4px' }}>{currentWord?.meaning}</p>
                                                    </div>
                                                )}
                                                <button
                                                    id="translate-next-word-btn"
                                                    onClick={handleNext}
                                                    className="w-full py-3 font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
                                                    style={{ fontSize: '12px', letterSpacing: '0.12em', background: 'var(--fg)', color: 'white', border: 'none', borderRadius: 0 }}
                                                >
                                                    Next →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Navigation — Swiss: flat arrow buttons ── */}
                                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--rule)' }}>
                                    <button
                                        id="prev-btn"
                                        onClick={handlePrev}
                                        className="flex items-center gap-2 transition-opacity hover:opacity-60"
                                        style={{ fontSize: '12px', letterSpacing: '0.08em', color: 'var(--muted)', padding: '8px 0' }}
                                    >
                                        <ChevronLeft size={16} />
                                        <span className="uppercase">Prev</span>
                                    </button>

                                    {/* Progress ticks */}
                                    <div className="hidden sm:flex items-center gap-1">
                                        {Array.from({ length: Math.min(words.length, 30) }).map((_, i) => (
                                            <div key={i} style={{
                                                width: '6px', height: '6px',
                                                background: i === currentIndex % 30 ? 'var(--accent)' : 'var(--rule)',
                                                transition: 'background 0.2s',
                                            }} />
                                        ))}
                                        {words.length > 30 && (
                                            <span style={{ fontSize: '10px', color: 'var(--muted)', marginLeft: '4px' }}>+{words.length - 30}</span>
                                        )}
                                    </div>

                                    <button
                                        id="next-btn"
                                        onClick={handleNext}
                                        className="flex items-center gap-2 transition-opacity hover:opacity-60"
                                        style={{ fontSize: '12px', letterSpacing: '0.08em', color: 'var(--muted)', padding: '8px 0' }}
                                    >
                                        <span className="uppercase">Next</span>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>

                            </>
                        )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* 3D flip card styles are in index.css */}
        </div>
    );
};

export default HindiPracticePage;
