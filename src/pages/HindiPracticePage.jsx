import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, ChevronLeft, ChevronRight, BookOpen, Languages, Type, CheckCircle, XCircle, Filter, RefreshCw, Menu, X, Globe, Loader2 } from 'lucide-react';

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
    const [isCorrect, setIsCorrect] = useState(null); // true | false | null
    const [showAnswer, setShowAnswer] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle
    const [apiServerRunning, setApiServerRunning] = useState(false);
    const [apiCache, setApiCache] = useState({});
    const [isValidating, setIsValidating] = useState(false);
    const inputRefs = useRef([]);

    // Check if API server is running
    useEffect(() => {
        const checkAPIServer = async () => {
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
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const loadCSV = async () => {
            try {
                const response = await fetch('/basic-practice.csv');
                const text = await response.text();

                const lines = text.split('\n').filter(line => line.trim());
                const parsedWords = lines.slice(1).map(line => {
                    // Handle CSV parsing with potential quoted values
                    const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
                    const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());

                    return {
                        source: cleanValues[0] || 'General',
                        hindi: cleanValues[1],
                        transliteration: cleanValues[2],
                        meaning: cleanValues[3]
                    };
                }).filter(word => word.hindi && word.transliteration);

                setAllWords(parsedWords);
                setWords(parsedWords);

                // Extract unique categories
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
        // Fisher-Yates shuffle for the current filtered list
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
        // On mobile, close sidebar after selection
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
            // Focus first input
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
            console.error('API validation error:', error);
        }
        return null;
    };

    const fuzzyNormalize = (text) => {
        return text.toLowerCase().trim()
            // Handle vowel length variations (common beginner mistake)
            .replace(/aa/g, 'a')
            .replace(/ii/g, 'i')
            .replace(/uu/g, 'u')
            .replace(/ee/g, 'e')
            .replace(/oo/g, 'o')
            // Remove non-alphanumeric
            .replace(/[^a-z0-9]/g, '');
    };

    const handleCheckAnswer = async () => {
        if (!currentWord) return;

        setIsValidating(true);
        let correct = false;

        if (mode === 'read') {
            // Check each word individually
            const targetWords = currentWord.transliteration.split(/\s+/);
            const hindiWords = currentWord.hindi.split(/\s+/);

            // We need to check all words asynchronously using API ONLY
            const results = await Promise.all(wordInputs.map(async (input, idx) => {
                if (!targetWords[idx]) return false;

                const normalizedInput = normalizeText(input || '');

                // Use API for validation if available
                if (apiServerRunning && hindiWords[idx]) {
                    const transliterations = await validateWordWithApi(hindiWords[idx]);
                    if (transliterations && transliterations.length > 0) {
                        // Check if user's input matches any API transliteration
                        const matched = transliterations.some(t => {
                            const normalizedApi = normalizeText(t);
                            return normalizedApi === normalizedInput;
                        });

                        console.log('API Validation:', {
                            hindi: hindiWords[idx],
                            input,
                            apiTransliterations: transliterations,
                            matched
                        });

                        return matched;
                    }
                }

                // If API is not running or failed, validation fails
                console.warn('⚠ API not available for validation. Please start the API server with: npm run server');
                return false;
            }));

            const allCorrect = results.every(r => r === true);
            correct = allCorrect && wordInputs.length === targetWords.length;

        } else if (mode === 'translate') {
            // User types English meaning
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
            // Move to next input if available
            if (index < wordInputs.length - 1) {
                inputRefs.current[index + 1].focus();
            }
        } else if (e.key === 'Backspace' && !wordInputs[index] && index > 0) {
            // Move to previous input if current is empty and backspace is pressed
            e.preventDefault();
            inputRefs.current[index - 1].focus();
        }
    };

    return (
        <div className="h-screen w-screen bg-stone-50 text-slate-800 font-sans selection:bg-[#880000]/20 flex flex-col overflow-hidden">
            {/* Navbar */}
            <nav className="w-full bg-white border-b border-slate-200 shadow-sm flex-shrink-0 z-20">
                <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 text-slate-400 hover:text-[#880000] hover:bg-[#880000]/10 rounded-lg transition-colors"
                                title="Back to Home"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex items-center gap-2 text-[#880000]">
                                <Languages size={24} />
                                <span className="font-bold tracking-wider text-sm md:text-base uppercase">Hindi Practice</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/type-to-reveal')}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[#880000] hover:bg-[#880000]/10 rounded-lg transition-colors text-sm font-semibold"
                            >
                                <Type size={18} />
                                <span className="hidden md:inline">Type Practice</span>
                            </button>
                            {/* Mobile Sidebar Toggle */}
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Sidebar (Word List) */}
                <div id="sidebar-container" className={`
                    absolute lg:static inset-y-0 left-0 z-10 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-3">Word List</h3>
                        {/* Category Filter in Sidebar */}
                        <div id="category-filter-container" className="flex gap-2 overflow-x-auto pb-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${selectedCategory === cat
                                        ? 'bg-[#880000] text-white'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div id="word-list-container" className="flex-1 overflow-y-auto p-2 space-y-1">
                        {words.map((word, idx) => (
                            <button
                                key={idx}
                                id={`word-item-${idx}`}
                                onClick={() => handleWordSelect(idx)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex flex-col ${currentIndex === idx
                                    ? 'bg-[#880000]/10 border border-[#880000]/20'
                                    : 'hover:bg-slate-50 border border-transparent'
                                    }`}
                            >
                                <span className={`font-bold ${currentIndex === idx ? 'text-[#880000]' : 'text-slate-800'}`}>
                                    {word.hindi}
                                </span>
                                <span className="text-slate-500 text-xs truncate">
                                    {word.meaning}
                                </span>
                            </button>
                        ))}
                        {words.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                No words found
                            </div>
                        )}
                    </div>
                </div>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="absolute inset-0 bg-black/20 z-0 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Content Area */}
                <div id="main-content-area" className="flex-1 flex flex-col items-center justify-center py-2 px-4 md:px-6 overflow-hidden w-full">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <RefreshCw className="animate-spin text-[#880000] mb-4" size={32} />
                            <p className="text-slate-600">Loading practice data...</p>
                        </div>
                    ) : words.length === 0 ? (
                        <div className="text-center py-16 max-w-md">
                            <BookOpen className="mx-auto text-slate-300 mb-4" size={64} />
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">No Data Found</h3>
                            <p className="text-slate-600">
                                No words found for the selected category.
                            </p>
                            <button
                                onClick={() => setSelectedCategory('All')}
                                className="mt-4 text-[#880000] font-semibold hover:underline"
                            >
                                Reset Filters
                            </button>
                        </div>
                    ) : (
                        <div className="w-full max-w-3xl flex flex-col items-center gap-3 h-full justify-center">

                            {/* Controls Bar */}
                            <div id="controls-bar" className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-700">Mode:</span>
                                    {apiServerRunning ? (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold border border-green-200" title="API Validation Active">
                                            <Globe size={10} /> API
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-bold border border-orange-200" title="Local Validation Only">
                                            <Globe size={10} /> DB
                                        </div>
                                    )}
                                </div>

                                {/* Mode Switcher */}
                                <div id="mode-switcher" className="flex bg-slate-100 p-1 rounded-lg flex-shrink-0 w-full sm:w-auto overflow-x-auto">
                                    <button
                                        onClick={() => setMode('flashcard')}
                                        className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${mode === 'flashcard' ? 'bg-white text-[#880000] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        Flashcards
                                    </button>
                                    <button
                                        onClick={() => setMode('read')}
                                        className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${mode === 'read' ? 'bg-white text-[#880000] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        Reading
                                    </button>
                                    <button
                                        onClick={() => setMode('translate')}
                                        className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${mode === 'translate' ? 'bg-white text-[#880000] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        Meaning
                                    </button>
                                </div>
                            </div>

                            {/* Progress Indicator */}
                            <div id="progress-indicator" className="w-full flex items-center justify-between px-2 text-sm text-slate-500 font-medium">
                                <span>Card {currentIndex + 1} of {words.length}</span>
                                <span className="bg-slate-100 px-2 py-1 rounded text-xs uppercase tracking-wider">{currentWord?.source}</span>
                            </div>

                            {/* Flashcard Mode */}
                            {mode === 'flashcard' && (
                                <div id="flashcard-container" className="perspective-1000 w-full flex-1 min-h-0 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
                                    <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                        {/* Front */}
                                        <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center justify-center p-8 hover:shadow-2xl transition-shadow">
                                            <span className="absolute top-6 left-6 text-xs font-bold text-slate-300 uppercase tracking-widest">Hindi</span>
                                            <h3 className="text-5xl md:text-7xl font-bold text-slate-800 mb-6 text-center leading-tight">
                                                {currentWord?.hindi}
                                            </h3>
                                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                                                <RotateCw size={14} /> Click to flip
                                            </p>
                                        </div>

                                        {/* Back */}
                                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-[#880000] to-[#660000] rounded-3xl shadow-xl flex flex-col items-center justify-center p-8 text-white">
                                            <span className="absolute top-6 left-6 text-xs font-bold text-white/40 uppercase tracking-widest">Answer</span>
                                            <div className="text-center space-y-6">
                                                <div>
                                                    <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Transliteration</p>
                                                    <p className="text-3xl md:text-4xl font-mono font-bold text-white">{currentWord?.transliteration}</p>
                                                </div>
                                                <div className="w-16 h-1 bg-white/20 mx-auto rounded-full"></div>
                                                <div>
                                                    <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Meaning</p>
                                                    <p className="text-2xl md:text-3xl font-medium text-white">{currentWord?.meaning}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Reading Mode (Word Chunking) */}
                            {mode === 'read' && (
                                <div id="reading-mode-container" className="w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-200 flex flex-col gap-4 flex-1 min-h-0 justify-center">
                                    <div className="text-center space-y-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">
                                            Type the Transliteration (Word by Word)
                                        </p>
                                    </div>

                                    <div className="w-full max-w-4xl mx-auto flex flex-wrap justify-center gap-4 md:gap-6">
                                        {currentWord?.hindi.split(/\s+/).map((word, idx) => {
                                            const targetWords = currentWord.transliteration.split(/\s+/);
                                            const targetWord = targetWords[idx] || '';
                                            const isWordCorrect = showAnswer && normalizeText(wordInputs[idx] || '') === normalizeText(targetWord);

                                            return (
                                                <div key={idx} className="flex flex-col items-center gap-2">
                                                    <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
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
                                                            if (showAnswer) {
                                                                setShowAnswer(false);
                                                                setIsCorrect(null);
                                                            }
                                                        }}
                                                        onKeyDown={(e) => handleWordInputKeyDown(e, idx)}
                                                        placeholder={idx === 0 ? "Type..." : ""}
                                                        className={`w-32 md:w-40 px-3 py-2 text-center rounded-lg border-2 text-lg outline-none transition-all ${showAnswer
                                                            ? isWordCorrect
                                                                ? 'border-green-500 bg-green-50 text-green-900'
                                                                : 'border-red-500 bg-red-50 text-red-900'
                                                            : 'border-slate-200 focus:border-[#880000] focus:ring-2 focus:ring-[#880000]/10'
                                                            }`}
                                                        disabled={showAnswer}
                                                    />
                                                    {showAnswer && !isWordCorrect && (
                                                        <span className="text-xs font-mono text-red-600 font-bold">{targetWord}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="w-full max-w-xl mx-auto mt-4 space-y-3">
                                        {!showAnswer ? (
                                            <button
                                                id="read-check-answer-btn"
                                                onClick={handleCheckAnswer}
                                                disabled={isValidating}
                                                className="w-full py-4 bg-[#880000] hover:bg-[#770000] disabled:bg-slate-400 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                            >
                                                {isValidating ? <Loader2 className="animate-spin" /> : 'Check Answer'}
                                            </button>
                                        ) : (
                                            <div className="animate-in fade-in slide-in-from-top-4 space-y-4">
                                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                                                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Full Meaning</p>
                                                    <p className="text-lg text-slate-800">{currentWord?.meaning}</p>
                                                </div>
                                                <button
                                                    id="read-next-word-btn"
                                                    onClick={handleNext}
                                                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
                                                >
                                                    Next Word <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Translation Mode (Full Sentence) */}
                            {mode === 'translate' && (
                                <div id="translation-mode-container" className="w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-200 flex flex-col gap-4 flex-1 min-h-0 justify-center">
                                    <div className="text-center space-y-4">
                                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">
                                            Translate to English
                                        </p>
                                        <h3 className="text-5xl md:text-6xl font-bold text-slate-900">
                                            {currentWord?.hindi}
                                        </h3>
                                    </div>

                                    <div className="w-full max-w-xl mx-auto space-y-4">
                                        <div className="relative">
                                            <input
                                                id="translation-input"
                                                type="text"
                                                value={userInput}
                                                onChange={(e) => {
                                                    setUserInput(e.target.value);
                                                    if (showAnswer) {
                                                        setShowAnswer(false);
                                                        setIsCorrect(null);
                                                    }
                                                }}
                                                onKeyDown={handleKeyDown}
                                                placeholder="e.g. hello"
                                                className={`w-full px-6 py-4 rounded-xl border-2 text-xl outline-none transition-all ${showAnswer
                                                    ? isCorrect
                                                        ? 'border-green-500 bg-green-50 text-green-900'
                                                        : 'border-red-500 bg-red-50 text-red-900'
                                                    : 'border-slate-200 focus:border-[#880000] focus:ring-4 focus:ring-[#880000]/10'
                                                    }`}
                                                autoFocus
                                            />
                                            {showAnswer && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    {isCorrect ? <CheckCircle className="text-green-600" /> : <XCircle className="text-red-600" />}
                                                </div>
                                            )}
                                        </div>

                                        {!showAnswer ? (
                                            <button
                                                id="translate-check-answer-btn"
                                                onClick={handleCheckAnswer}
                                                className="w-full py-4 bg-[#880000] hover:bg-[#770000] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98]"
                                            >
                                                Check Answer
                                            </button>
                                        ) : (
                                            <div className="animate-in fade-in slide-in-from-top-4 space-y-4">
                                                {!isCorrect && (
                                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-xs text-slate-500 uppercase font-bold">Transliteration</p>
                                                                <p className="text-lg font-mono text-slate-800">{currentWord?.transliteration}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-slate-500 uppercase font-bold">Meaning</p>
                                                                <p className="text-lg text-slate-800">{currentWord?.meaning}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <button
                                                    id="translate-next-word-btn"
                                                    onClick={handleNext}
                                                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
                                                >
                                                    Next Word <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Navigation Footer */}
                            <div className="flex items-center gap-4 mt-1 shrink-0">
                                <button
                                    id="prev-btn"
                                    onClick={handlePrev}
                                    className="p-4 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-slate-600"
                                    title="Previous"
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                <button
                                    id="shuffle-btn"
                                    onClick={handleShuffle}
                                    className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-slate-600 font-semibold"
                                >
                                    <RotateCw size={20} />
                                    <span>Shuffle</span>
                                </button>

                                <button
                                    id="next-btn"
                                    onClick={handleNext}
                                    className="p-4 bg-white border border-slate-200 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-slate-600"
                                    title="Next"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>

                        </div>
                    )}
                </div>

                <style>{`
                    .perspective-1000 { perspective: 1000px; }
                    .transform-style-3d { transform-style: preserve-3d; }
                    .backface-hidden { backface-visibility: hidden; }
                    .rotate-y-180 { transform: rotateY(180deg); }
                `}</style>
            </div>
        </div>
    );
};

export default HindiPracticePage;
