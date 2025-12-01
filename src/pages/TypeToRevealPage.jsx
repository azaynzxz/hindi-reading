import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Type, ChevronLeft, RefreshCw, CheckCircle, Languages, XCircle, Loader2, Globe, Eye, Share2, X } from 'lucide-react';
import WordPoster from '../components/WordPoster';
import { getStorage, setStorage, StorageKeys } from '../utils/storage';

import { API_BASE_URL } from '../utils/api';

const TypeToRevealPage = () => {
    const navigate = useNavigate();
    const [pastedText, setPastedText] = useState('');
    const [words, setWords] = useState([]);
    const [userInputs, setUserInputs] = useState({});
    const [hindiDatabase, setHindiDatabase] = useState({});
    const [isLoadingDB, setIsLoadingDB] = useState(true);
    const [apiCache, setApiCache] = useState({});
    const [validating, setValidating] = useState({});
    const [apiServerRunning, setApiServerRunning] = useState(false);
    const [showAnswer, setShowAnswer] = useState({}); // Track which cards show answers
    const [showPoster, setShowPoster] = useState(false);
    const [currentSessionTime, setCurrentSessionTime] = useState(0);
    const [totalPracticeTime, setTotalPracticeTime] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const practiceStartTimeRef = useRef(null);
    const timeIntervalRef = useRef(null);

    // Check if API server is running
    useEffect(() => {
        const checkAPIServer = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/health`);
                const data = await response.json();
                if (data.status === 'OK') {
                    setApiServerRunning(true);
                    console.log('✓ API server connected');
                }
            } catch (error) {
                setApiServerRunning(false);
                console.warn('⚠ API server not running. Run: npm run server');
            }
        };

        checkAPIServer();
        const interval = setInterval(checkAPIServer, 5000);
        return () => clearInterval(interval);
    }, []);

    // Load statistics and progress on mount
    useEffect(() => {
        const stats = getStorage(StorageKeys.HINDI_PRACTICE_STATISTICS, {
            totalTimePracticed: 0,
            totalWordsPracticed: 0,
            practiceSessions: 0
        });
        setTotalPracticeTime(stats.totalTimePracticed || 0);

        const progress = getStorage(StorageKeys.HINDI_PRACTICE_PROGRESS, {
            currentStreak: 0,
            longestStreak: 0,
            lastPracticeDate: null
        });
        setCurrentStreak(progress.currentStreak || 0);
    }, []);

    // Track practice time
    useEffect(() => {
        if (practiceStartTimeRef.current) {
            timeIntervalRef.current = setInterval(() => {
                if (practiceStartTimeRef.current) {
                    const elapsed = Math.floor((Date.now() - practiceStartTimeRef.current) / 1000);
                    setCurrentSessionTime(elapsed);
                }
            }, 1000);
        } else {
            if (timeIntervalRef.current) {
                clearInterval(timeIntervalRef.current);
                timeIntervalRef.current = null;
            }
        }

        return () => {
            if (timeIntervalRef.current) {
                clearInterval(timeIntervalRef.current);
            }
        };
    }, [words.length]); // Re-run when words change (practice starts/stops)

    // Save practice time when session ends
    useEffect(() => {
        return () => {
            // Cleanup: save time when component unmounts or practice ends
            if (practiceStartTimeRef.current) {
                const practiceDuration = Math.floor((Date.now() - practiceStartTimeRef.current) / 1000);
                if (practiceDuration > 0) {
                    const stats = getStorage(StorageKeys.HINDI_PRACTICE_STATISTICS, {
                        totalTimePracticed: 0,
                        totalWordsPracticed: 0,
                        practiceSessions: 0
                    });
                    stats.totalTimePracticed = (stats.totalTimePracticed || 0) + practiceDuration;
                    stats.practiceSessions = (stats.practiceSessions || 0) + 1;
                    setStorage(StorageKeys.HINDI_PRACTICE_STATISTICS, stats);
                    setTotalPracticeTime(stats.totalTimePracticed);

                    // Update streak
                    const today = new Date().toISOString().split('T')[0];
                    const progress = getStorage(StorageKeys.HINDI_PRACTICE_PROGRESS, {
                        currentStreak: 0,
                        longestStreak: 0,
                        lastPracticeDate: null
                    });

                    const lastDate = progress.lastPracticeDate ? new Date(progress.lastPracticeDate) : null;
                    const todayDate = new Date(today);

                    if (!lastDate || Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24)) === 1) {
                        progress.currentStreak = (progress.currentStreak || 0) + 1;
                    } else if (Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24)) > 1) {
                        progress.currentStreak = 1;
                    } else if (!lastDate) {
                        progress.currentStreak = 1;
                    }

                    if (progress.currentStreak > progress.longestStreak) {
                        progress.longestStreak = progress.currentStreak;
                    }

                    progress.lastPracticeDate = today;
                    setStorage(StorageKeys.HINDI_PRACTICE_PROGRESS, progress);
                    setCurrentStreak(progress.currentStreak);
                }
                practiceStartTimeRef.current = null;
            }
        };
    }, []);

    // Load CSV database on mount
    useEffect(() => {
        const loadCSV = async () => {
            try {
                const response = await fetch('/basic-practice.csv');
                const text = await response.text();

                const lines = text.split('\n').filter(line => line.trim());
                const database = {};

                lines.slice(1).forEach(line => {
                    const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
                    const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());

                    const hindi = cleanValues[1];
                    const transliteration = cleanValues[2];
                    const meaning = cleanValues[3];

                    if (hindi && transliteration) {
                        database[hindi] = {
                            transliteration: transliteration,
                            meaning: meaning || ''
                        };
                    }
                });

                setHindiDatabase(database);
                setIsLoadingDB(false);
                console.log('Loaded', Object.keys(database).length, 'words into database');
            } catch (error) {
                console.error('Error loading CSV:', error);
                setIsLoadingDB(false);
            }
        };

        loadCSV();
    }, []);

    const handleTextPaste = (e) => {
        const text = e.target.value;
        setPastedText(text);

        if (text.trim().length === 0) {
            // Stop tracking time when text is cleared
            if (practiceStartTimeRef.current) {
                const practiceDuration = Math.floor((Date.now() - practiceStartTimeRef.current) / 1000);
                if (practiceDuration > 0) {
                    const stats = getStorage(StorageKeys.HINDI_PRACTICE_STATISTICS, {
                        totalTimePracticed: 0,
                        totalWordsPracticed: 0,
                        practiceSessions: 0
                    });
                    stats.totalTimePracticed = (stats.totalTimePracticed || 0) + practiceDuration;
                    setStorage(StorageKeys.HINDI_PRACTICE_STATISTICS, stats);
                    setTotalPracticeTime(stats.totalTimePracticed);
                }
                practiceStartTimeRef.current = null;
                setCurrentSessionTime(0);
            }
            setWords([]);
            setUserInputs({});
            setApiCache({});
            setValidating({});
            setShowAnswer({});
            return;
        }

        // Start tracking time when user pastes text
        if (!practiceStartTimeRef.current) {
            practiceStartTimeRef.current = Date.now();
            setCurrentSessionTime(0);
        }

        const cleanedText = text.replace(/\r?\n|\r/g, ' ').trim();
        const wordArray = cleanedText.split(/\s+/).filter(word => word.length > 0);

        setWords(wordArray);

        const inputs = {};
        wordArray.forEach((word, index) => {
            inputs[index] = '';
        });
        setUserInputs(inputs);
        setApiCache({});
        setValidating({});
        setShowAnswer({});
    };

    const handleInputChange = async (index, value) => {
        // Start tracking time when user starts typing
        if (!practiceStartTimeRef.current && words.length > 0) {
            practiceStartTimeRef.current = Date.now();
            setCurrentSessionTime(0);
        }

        setUserInputs(prev => ({
            ...prev,
            [index]: value
        }));

        // Auto-validate after user finishes typing
        if (value.trim().length > 0 && apiServerRunning) {
            const word = words[index];
            if (!hindiDatabase[word] && !apiCache[word]) {
                setValidating(prev => ({ ...prev, [index]: true }));
                await validateWord(word);
                setValidating(prev => ({ ...prev, [index]: false }));
            }
        }
    };

    const validateWord = async (hindiWord) => {
        if (apiCache[hindiWord]) return;

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
            }
        } catch (error) {
            console.error('API validation error:', error);
        }
    };

    const handleReset = () => {
        // Save time before resetting
        if (practiceStartTimeRef.current) {
            const practiceDuration = Math.floor((Date.now() - practiceStartTimeRef.current) / 1000);
            if (practiceDuration > 0) {
                const stats = getStorage(StorageKeys.HINDI_PRACTICE_STATISTICS, {
                    totalTimePracticed: 0,
                    totalWordsPracticed: 0,
                    practiceSessions: 0
                });
                stats.totalTimePracticed = (stats.totalTimePracticed || 0) + practiceDuration;
                setStorage(StorageKeys.HINDI_PRACTICE_STATISTICS, stats);
                setTotalPracticeTime(stats.totalTimePracticed);
            }
            practiceStartTimeRef.current = null;
            setCurrentSessionTime(0);
        }
        setPastedText('');
        setWords([]);
        setUserInputs({});
        setApiCache({});
        setValidating({});
        setShowAnswer({});
    };

    const handleUniqueFilter = () => {
        if (!pastedText) return;

        // Split, filter unique, and rejoin
        const cleanedText = pastedText.replace(/\r?\n|\r/g, ' ').trim();
        const wordArray = cleanedText.split(/\s+/).filter(word => word.length > 0);
        const uniqueWords = [...new Set(wordArray)];

        // Update text area to show unique words only
        setPastedText(uniqueWords.join(' '));
        setWords(uniqueWords);

        // Reset inputs as indices change
        setUserInputs({});
        setApiCache({});
        setValidating({});
        setShowAnswer({});
    };

    const normalizeText = (text) => {
        return text.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    };

    const getValidationState = (index) => {
        const word = words[index];
        const userInput = userInputs[index];

        if (!userInput || userInput.trim().length === 0) {
            return { state: 'empty' };
        }

        if (validating[index]) {
            return { state: 'validating' };
        }

        // Check local database first
        if (hindiDatabase[word]) {
            const correctAnswer = hindiDatabase[word].transliteration;
            if (normalizeText(userInput) === normalizeText(correctAnswer)) {
                return {
                    state: 'correct',
                    correctAnswer: correctAnswer,
                    meaning: hindiDatabase[word].meaning,
                    source: 'database'
                };
            } else {
                return {
                    state: 'incorrect',
                    correctAnswer: correctAnswer,
                    source: 'database'
                };
            }
        }

        // Check API cache
        if (apiCache[word]) {
            const normalized = normalizeText(userInput);
            for (const transliteration of apiCache[word]) {
                if (normalizeText(transliteration) === normalized) {
                    return {
                        state: 'correct',
                        correctAnswer: transliteration,
                        source: 'api'
                    };
                }
            }
            return {
                state: 'incorrect',
                correctAnswer: apiCache[word][0],
                source: 'api'
            };
        }

        // Not yet validated
        return { state: 'pending', word: word };
    };

    const getStats = () => {
        let completed = 0;
        let correct = 0;

        words.forEach((_, index) => {
            const validation = getValidationState(index);
            if (validation.state === 'correct' || validation.state === 'incorrect') {
                completed++;
                if (validation.state === 'correct') {
                    correct++;
                }
            }
        });

        return { completed, correct };
    };

    const stats = getStats();
    const progressPercent = words.length > 0 ? Math.round((stats.completed / words.length) * 100) : 0;
    const accuracyPercent = stats.completed > 0 ? Math.round((stats.correct / stats.completed) * 100) : 0;

    return (
        <div className="h-screen w-screen bg-stone-50 text-slate-800 font-sans selection:bg-[#880000]/20 flex flex-col items-center justify-center overflow-hidden">
            {/* Navbar */}
            <nav className="w-full bg-white border-b border-slate-200 shadow-sm flex-shrink-0 z-20 fixed top-0">
                <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 text-slate-400 hover:text-[#880000] hover:bg-[#880000]/10 rounded-lg transition-colors"
                                title="Back to Reading"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <Type className="text-[#880000]" size={24} />
                            <span className="font-bold tracking-wider text-sm md:text-base uppercase">Type to Reveal</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {apiServerRunning ? (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs">
                                    <Globe size={14} />
                                    <span className="font-semibold">API ON</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs">
                                    <Globe size={14} />
                                    <span className="font-semibold">DB ONLY</span>
                                </div>
                            )}
                            <button
                                onClick={() => navigate('/hindi-practice')}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[#880000] hover:bg-[#880000]/10 rounded-lg transition-colors text-sm font-semibold"
                            >
                                <Languages size={18} />
                                <span className="hidden md:inline">Hindi Practice</span>
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[#880000] hover:bg-[#880000]/10 rounded-lg transition-colors text-sm font-semibold"
                            >
                                <BookOpen size={18} />
                                <span className="hidden md:inline">Reading</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="w-full flex-1 flex flex-col items-center justify-center pt-20 md:pt-24 pb-4 px-4 md:px-6 lg:px-8 min-h-0 overflow-hidden">
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0 max-h-full">
                    {/* Left Sidebar */}
                    <div className="hidden lg:block lg:col-span-3 flex flex-col min-h-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col overflow-hidden">
                            <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                                <Type size={16} className="text-[#880000]" /> Paste Hindi Text
                            </h3>
                            <textarea
                                value={pastedText}
                                onChange={handleTextPaste}
                                placeholder={`Paste Hindi text here...${apiServerRunning ? '\n\n✓ API server running - unlimited words!' : '\n\n⚠ API server not running\nOnly 38 database words can be validated'}`}
                                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-[#880000] focus:ring-2 focus:ring-[#880000]/20 outline-none transition-all text-base font-sans resize-y min-h-[200px] max-h-[500px]"
                            />
                            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                                <div className="flex items-center justify-between text-xs text-slate-600">
                                    <span>Progress</span>
                                    <span className="font-bold text-[#880000]">{progressPercent}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-[#880000] h-full transition-all duration-300"
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                                {stats.completed > 0 && (
                                    <div className="flex items-center justify-between text-xs text-slate-600">
                                        <span>Accuracy</span>
                                        <span className={`font-bold ${accuracyPercent >= 80 ? 'text-green-600' : accuracyPercent >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {stats.correct}/{stats.completed} ({accuracyPercent}%)
                                        </span>
                                    </div>
                                )}
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={handleUniqueFilter}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-semibold text-sm"
                                        title="Remove duplicate words"
                                    >
                                        <RefreshCw size={16} className="rotate-90" />
                                        Unique
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-semibold text-sm"
                                    >
                                        <RefreshCw size={16} />
                                        Reset
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowPoster(true)}
                                    disabled={words.length === 0}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#880000] hover:bg-[#770000] text-white rounded-lg transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Share2 size={16} />
                                    Create Poster
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9 flex flex-col min-h-0">
                        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 min-h-full">
                                {words.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Type className="mx-auto text-[#880000] mb-4" size={64} />
                                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Ready to Practice!</h3>
                                        <p className="text-slate-600 max-w-lg mx-auto mb-4">
                                            Paste Hindi text to practice transliteration.
                                        </p>
                                        {isLoadingDB ? (
                                            <p className="text-sm text-slate-500">Loading database...</p>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-sm text-green-600 font-semibold">
                                                    ✓ Local DB: {Object.keys(hindiDatabase).length} words
                                                </p>
                                                {apiServerRunning ? (
                                                    <p className="text-sm text-blue-600 font-semibold">
                                                        ✓ API Server: Unlimited words!
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-orange-600">
                                                        ⚠ Run <code className="bg-orange-100 px-1 rounded">npm run server</code> for unlimited validation
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-6 flex items-center justify-between">
                                            <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                                                <Languages className="text-[#880000]" size={24} />
                                                Practice Cards
                                            </h2>
                                            <div className="hidden lg:flex items-center gap-3 text-sm text-slate-600">
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle size={16} className="text-green-500" />
                                                    <span className="font-semibold">{stats.correct} correct</span>
                                                </div>
                                                <span>/</span>
                                                <span className="font-semibold">{words.length} total</span>
                                            </div>
                                        </div>

                                        {/* Word Cards Grid - COMPACT VERSION */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                            {words.map((word, index) => {
                                                const validation = getValidationState(index);
                                                const hasInput = userInputs[index]?.trim().length > 0;

                                                let borderColor = 'border-slate-200';
                                                let bgColor = 'bg-white';
                                                let textColor = 'text-slate-400';
                                                let icon = null;

                                                if (validation.state === 'correct') {
                                                    borderColor = 'border-green-500';
                                                    bgColor = 'bg-green-50';
                                                    textColor = 'text-green-600';
                                                    icon = <CheckCircle size={14} className="text-green-500" />;
                                                } else if (validation.state === 'incorrect') {
                                                    borderColor = 'border-red-500';
                                                    bgColor = 'bg-red-50';
                                                    textColor = 'text-red-700';
                                                    icon = <XCircle size={14} className="text-red-600" />;
                                                } else if (validation.state === 'validating') {
                                                    borderColor = 'border-blue-400';
                                                    bgColor = 'bg-blue-50';
                                                    textColor = 'text-blue-600';
                                                    icon = <Loader2 size={14} className="text-blue-500 animate-spin" />;
                                                } else if (validation.state === 'pending' && hasInput && !apiServerRunning) {
                                                    borderColor = 'border-orange-400';
                                                    bgColor = 'bg-orange-50';
                                                    textColor = 'text-orange-700';
                                                }

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`rounded-lg border-2 transition-all duration-300 ${borderColor} ${bgColor} hover:shadow-md`}
                                                    >
                                                        <div className="p-2.5 space-y-1.5">
                                                            {/* Card Header */}
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                                    #{index + 1}
                                                                </span>
                                                                <div className="flex items-center gap-1">
                                                                    {validation.source === 'api' && (
                                                                        <Globe size={10} className="text-blue-500" title="API" />
                                                                    )}
                                                                    {icon}
                                                                </div>
                                                            </div>

                                                            {/* Hindi Word */}
                                                            <div className="text-center">
                                                                <p className={`text-xl font-bold transition-colors duration-300 ${textColor}`}>
                                                                    {word}
                                                                </p>
                                                            </div>

                                                            {/* Input Field */}
                                                            <div>
                                                                <input
                                                                    type="text"
                                                                    value={userInputs[index] || ''}
                                                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                                                    placeholder="Type..."
                                                                    className={` w-full px-2 py-1.5 border-2 rounded-md outline-none transition-all text-center font-medium text-xs ${validation.state === 'correct'
                                                                        ? 'border-green-500 bg-white text-green-700 font-semibold'
                                                                        : validation.state === 'incorrect'
                                                                            ? 'border-red-500 bg-white text-red-700 font-semibold'
                                                                            : validation.state === 'validating'
                                                                                ? 'border-blue-400 bg-white text-blue-700'
                                                                                : 'border-slate-200 focus:border-[#880000] text-slate-700'
                                                                        }`}
                                                                />
                                                            </div>

                                                            {/* Show Answer Button */}
                                                            {validation.state !== 'correct' && validation.state !== 'validating' && validation.correctAnswer && (
                                                                <button
                                                                    onClick={() => setShowAnswer(prev => ({ ...prev, [index]: !prev[index] }))}
                                                                    className="w-full flex items-center justify-center gap-1 px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors text-[10px] font-semibold"
                                                                >
                                                                    <Eye size={10} />
                                                                    {showAnswer[index] ? 'Hide' : 'Show'}
                                                                </button>
                                                            )}

                                                            {/* Revealed Answer */}
                                                            {showAnswer[index] && validation.correctAnswer && (
                                                                <div className="text-center text-[10px] bg-blue-50 text-blue-700 py-1 px-1.5 rounded-md font-semibold">
                                                                    {validation.correctAnswer}
                                                                </div>
                                                            )}

                                                            {/* Feedback Messages */}
                                                            {validation.state === 'correct' && validation.meaning && (
                                                                <div className="text-center text-[9px] text-green-600 italic truncate">
                                                                    {validation.meaning}
                                                                </div>
                                                            )}

                                                            {validation.state === 'validating' && (
                                                                <div className="text-center text-[9px] text-blue-600">
                                                                    Checking...
                                                                </div>
                                                            )}

                                                            {validation.state === 'pending' && hasInput && !apiServerRunning && (
                                                                <div className="text-center text-[9px] text-orange-600">
                                                                    ⚠ Need API
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Poster Modal */}
            {showPoster && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                        <button
                            onClick={() => setShowPoster(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
                        >
                            <X size={20} className="text-slate-600" />
                        </button>
                        <div className="p-8 flex flex-col items-center">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Progress Poster</h2>
                            <WordPoster
                                title="HINDI PRACTICE"
                                subtitle="Transliteration"
                                meta={`Accuracy: ${accuracyPercent}%`}
                                text={pastedText}
                                footerLabel="HINDI READING PRACTICE"
                                footerText="By Zayn · Hindi Reading Daily"
                                statistics={{
                                    totalWordsRead: stats.completed,
                                    totalTimePracticed: totalPracticeTime + currentSessionTime
                                }}
                                progress={{
                                    currentStreak: currentStreak
                                }}
                                month={1}
                                day={1}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TypeToRevealPage;
