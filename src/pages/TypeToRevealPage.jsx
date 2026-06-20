import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Type, ChevronLeft, RefreshCw, CheckCircle, Languages, XCircle, Loader2, Globe, Eye, Share2, X, ChevronDown, ChevronUp } from 'lucide-react';
import WordPoster from '../components/WordPoster';
import { getStorage, setStorage, StorageKeys } from '../utils/storage';
import { APP_AUTHOR, HINDI_FOOTER_TEXT } from '../utils/constants';
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
    const [showAnswer, setShowAnswer] = useState({});
    const [showPoster, setShowPoster] = useState(false);
    const [currentSessionTime, setCurrentSessionTime] = useState(0);
    const [totalPracticeTime, setTotalPracticeTime] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [isMobileInputOpen, setIsMobileInputOpen] = useState(true); // Mobile panel expanded by default
    const practiceStartTimeRef = useRef(null);
    const timeIntervalRef = useRef(null);

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

    // Track practice time — runs continuously while practiceStartTimeRef is set
    useEffect(() => {
        timeIntervalRef.current = setInterval(() => {
            if (practiceStartTimeRef.current) {
                const elapsed = Math.floor((Date.now() - practiceStartTimeRef.current) / 1000);
                setCurrentSessionTime(elapsed);
            }
        }, 1000);

        return () => {
            if (timeIntervalRef.current) {
                clearInterval(timeIntervalRef.current);
            }
        };
    }, []); // Only once — reads ref each tick, no stale closure issue

    // Save practice time when component unmounts
    useEffect(() => {
        return () => {
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

                    const today = new Date().toISOString().split('T')[0];
                    const progress = getStorage(StorageKeys.HINDI_PRACTICE_PROGRESS, {
                        currentStreak: 0,
                        longestStreak: 0,
                        lastPracticeDate: null
                    });

                    const lastDate = progress.lastPracticeDate ? new Date(progress.lastPracticeDate) : null;
                    const todayDate = new Date(today);

                    if (!lastDate || Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24)) > 1) {
                        progress.currentStreak = 1;
                    } else if (Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24)) === 1) {
                        progress.currentStreak = (progress.currentStreak || 0) + 1;
                    }

                    if (progress.currentStreak > progress.longestStreak) {
                        progress.longestStreak = progress.currentStreak;
                    }

                    progress.lastPracticeDate = today;
                    setStorage(StorageKeys.HINDI_PRACTICE_PROGRESS, progress);
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
                    const values = line.match(/(\".*?\"|[^,]+)(?=\s*,|\s*$)/g) || [];
                    const cleanValues = values.map(v => v.replace(/^\"|\"$/g, '').trim());

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
            } catch (error) {
                console.error('Error loading CSV:', error);
                setIsLoadingDB(false);
            }
        };

        loadCSV();
    }, []);

    const savePracticeTime = () => {
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
    };

    const handleTextPaste = (e) => {
        const text = e.target.value;
        setPastedText(text);

        if (text.trim().length === 0) {
            savePracticeTime();
            setWords([]);
            setUserInputs({});
            setApiCache({});
            setValidating({});
            setShowAnswer({});
            return;
        }

        if (!practiceStartTimeRef.current) {
            practiceStartTimeRef.current = Date.now();
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

        // Collapse mobile input panel once text is loaded
        if (wordArray.length > 0) {
            setIsMobileInputOpen(false);
        }
    };

    const handleInputChange = async (index, value) => {
        if (!practiceStartTimeRef.current && words.length > 0) {
            practiceStartTimeRef.current = Date.now();
        }

        setUserInputs(prev => ({
            ...prev,
            [index]: value
        }));

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
            // Silently fail — API unavailable
        }
    };

    const handleReset = () => {
        savePracticeTime();
        setPastedText('');
        setWords([]);
        setUserInputs({});
        setApiCache({});
        setValidating({});
        setShowAnswer({});
        setIsMobileInputOpen(true);
    };

    const handleUniqueFilter = () => {
        if (!pastedText) return;

        const cleanedText = pastedText.replace(/\r?\n|\r/g, ' ').trim();
        const wordArray = cleanedText.split(/\s+/).filter(word => word.length > 0);
        const uniqueWords = [...new Set(wordArray)];

        setPastedText(uniqueWords.join(' '));
        setWords(uniqueWords);

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

    // Shared input panel (used in sidebar + mobile)
    const InputPanel = () => (
        <div className="flex flex-col gap-3">
            <textarea
                value={pastedText}
                onChange={handleTextPaste}
                placeholder={`Paste Hindi text here...\n\n${apiServerRunning ? '✓ API server — unlimited words!' : '⚠ DB only — 38 words validated'}`}
                className="w-full outline-none transition-colors resize-y"
                style={{
                    padding: '10px 12px',
                    fontSize: '14px',
                    fontFamily: "'DM Sans', sans-serif",
                    border: '1px solid var(--rule)',
                    borderRadius: 0,
                    minHeight: '140px',
                    maxHeight: '300px',
                    color: 'var(--fg)',
                    background: 'white',
                }}
            />

            {/* Progress */}
            <div className="space-y-1">
                <div className="flex items-center justify-between" style={{ fontSize: '11px', letterSpacing: '0.04em', color: 'var(--muted)' }}>
                    <span>Progress</span>
                    <span style={{ fontWeight: '700', color: 'var(--accent)' }}>{progressPercent}%</span>
                </div>
                <div className="w-full h-1" style={{ background: 'var(--rule)' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
                </div>
                {stats.completed > 0 && (
                    <div className="flex items-center justify-between" style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        <span>Accuracy</span>
                        <span style={{ fontWeight: '700', color: accuracyPercent >= 80 ? '#4A7C59' : accuracyPercent >= 50 ? '#D97706' : 'var(--accent)' }}>
                            {stats.correct}/{stats.completed} ({accuracyPercent}%)
                        </span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={handleUniqueFilter}
                    className="flex-1 flex items-center justify-center gap-1.5 transition-opacity hover:opacity-70"
                    style={{ padding: '7px 10px', fontSize: '11px', letterSpacing: '0.06em', border: '1px solid var(--rule)', borderRadius: 0, color: 'var(--muted)', background: 'transparent', fontWeight: '600' }}
                    title="Remove duplicate words"
                >
                    <RefreshCw size={12} className="rotate-90" />
                    UNIQUE
                </button>
                <button
                    onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-1.5 transition-opacity hover:opacity-70"
                    style={{ padding: '7px 10px', fontSize: '11px', letterSpacing: '0.06em', border: '1px solid var(--rule)', borderRadius: 0, color: 'var(--muted)', background: 'transparent', fontWeight: '600' }}
                >
                    <RefreshCw size={12} />
                    RESET
                </button>
            </div>
            <button
                onClick={() => setShowPoster(true)}
                disabled={words.length === 0}
                className="w-full flex items-center justify-center gap-2 transition-opacity hover:opacity-80 disabled:opacity-30"
                style={{ padding: '8px 12px', fontSize: '11px', letterSpacing: '0.1em', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 0, fontWeight: '700' }}
            >
                <Share2 size={12} />
                CREATE POSTER
            </button>
        </div>
    );


    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-stone-50" style={{ background: 'var(--bg)', color: 'var(--fg)', fontFamily: "'DM Sans', sans-serif" }}>
            {/* Navbar — Swiss: no shadow, 1px bottom rule */}
            <nav className="w-full bg-white border-b flex-shrink-0 z-20 fixed top-0" style={{ borderColor: 'var(--rule)' }}>
                <div className="w-full max-w-6xl mx-auto px-6">
                    <div className="h-12 flex items-center justify-between">
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
                            <span className="font-bold uppercase tracking-widest" style={{ fontSize: '12px', color: 'var(--fg)' }}>Type to Reveal</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="hidden sm:flex items-center gap-1.5" style={{ fontSize: '11px', letterSpacing: '0.08em', color: apiServerRunning ? '#4A7C59' : 'var(--muted)' }}>
                                <Globe size={11} />
                                <span className="uppercase font-medium">{apiServerRunning ? 'API' : 'DB'}</span>
                            </span>
                            <button
                                onClick={() => navigate('/hindi-practice')}
                                className="hidden sm:block uppercase font-medium transition-opacity hover:opacity-60"
                                style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--muted)' }}
                            >
                                Hindi
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center gap-1 uppercase font-medium transition-opacity hover:opacity-60"
                                style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--muted)' }}
                            >
                                <BookOpen size={12} />
                                <span className="hidden sm:inline">Reading</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>


            {/* Mobile input panel — collapsible */}
            <div className="lg:hidden flex-shrink-0 bg-white border-b mt-12 z-10" style={{ borderColor: 'var(--rule)' }}>
                <button
                    onClick={() => setIsMobileInputOpen(prev => !prev)}
                    className="w-full flex items-center justify-between px-5 py-3 transition-opacity hover:opacity-70"
                    style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.06em', color: 'var(--fg)' }}
                >
                    <span className="flex items-center gap-2">
                        <Type size={16} className="text-[#880000]" />
                        {words.length > 0
                            ? `${words.length} words loaded — ${progressPercent}% done`
                            : 'Paste Hindi Text'}
                    </span>
                    {isMobileInputOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>
                {isMobileInputOpen && (
                    <div className="px-4 pb-4">
                        <InputPanel />
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="w-full flex-1 flex flex-col items-center justify-center pt-4 lg:pt-16 xl:pt-20 pb-4 px-4 md:px-6 lg:px-8 min-h-0 overflow-hidden">
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0 max-h-full relative animate-slideUp">
                    {/* Desktop Left Sidebar — Swiss: flat panel, 1px right border */}
                    <div className="hidden lg:flex lg:col-span-3 flex-col bg-white border p-5 gap-4 overflow-y-auto min-h-0" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                        <p className="uppercase font-medium" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--muted)' }}>Paste Hindi Text</p>
                        <InputPanel />
                        {/* DB info */}
                        {!isLoadingDB && (
                            <div className="pt-3 border-t space-y-1" style={{ borderColor: 'var(--rule)' }}>
                                <p style={{ fontSize: '11px', color: '#4A7C59' }}>✓ DB: {Object.keys(hindiDatabase).length} words</p>
                                {apiServerRunning
                                    ? <p style={{ fontSize: '11px', color: '#3B82F6' }}>✓ API: Unlimited</p>
                                    : <p style={{ fontSize: '11px', color: 'var(--muted)' }}>Run <code style={{ fontFamily: 'monospace', background: '#FEF3C7', padding: '1px 4px', color: '#92400E', fontSize: '10px' }}>npm run server</code> for unlimited</p>
                                }
                            </div>
                        )}
                    </div>

                    {/* Cards area — always scrollable */}
                    <main className="lg:col-span-9 flex flex-col min-h-0 bg-white border" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8">
                        {words.length === 0 ? (
                            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center py-16">
                                <Type size={48} className="mx-auto mb-6" style={{ color: 'var(--rule)' }} />
                                <h3 className="font-bold mb-2" style={{ fontSize: '20px', color: 'var(--fg)' }}>Ready to Practice</h3>
                                <p className="max-w-md mx-auto mb-4" style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                    {window.innerWidth < 1024
                                        ? 'Tap "Paste Hindi Text" above to get started.'
                                        : 'Paste Hindi text in the sidebar to generate practice cards.'}
                                </p>
                                {isLoadingDB ? (
                                    <p className="flex items-center gap-2" style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                        <Loader2 size={13} className="animate-spin" /> Loading database...
                                    </p>
                                ) : (
                                    <div className="space-y-1">
                                        <p style={{ fontSize: '12px', color: '#4A7C59' }}>✓ DB: {Object.keys(hindiDatabase).length} words</p>
                                        {apiServerRunning
                                            ? <p style={{ fontSize: '12px', color: '#3B82F6' }}>✓ API: Unlimited</p>
                                            : <p style={{ fontSize: '12px', color: 'var(--muted)' }}>⚠ Run <code style={{ fontFamily: 'monospace', background: '#FEF3C7', padding: '1px 4px' }}>npm run server</code> for unlimited</p>
                                        }
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--rule)' }}>
                                    <p className="font-bold uppercase tracking-widest" style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--fg)' }}>
                                        Practice Cards
                                    </p>
                                    <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                        <span style={{ color: '#4A7C59', fontWeight: '600' }}>{stats.correct}</span> correct · {words.length} total
                                    </p>
                                </div>

                                {/* Word Cards Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                                    {words.map((word, index) => {
                                        const validation = getValidationState(index);
                                        const hasInput = userInputs[index]?.trim().length > 0;

                                        let borderColor = 'var(--rule)';
                                        let bgColor = 'white';
                                        let textColor = 'var(--muted)';
                                        let icon = null;

                                        if (validation.state === 'correct') {
                                            borderColor = '#4A7C59';
                                            bgColor = '#F0FAF3';
                                            textColor = '#2D5E40';
                                            icon = <CheckCircle size={12} style={{ color: '#4A7C59' }} />;
                                        } else if (validation.state === 'incorrect') {
                                            borderColor = 'var(--accent)';
                                            bgColor = 'rgba(136,0,0,0.04)';
                                            textColor = 'var(--accent)';
                                            icon = <XCircle size={12} style={{ color: 'var(--accent)' }} />;
                                        } else if (validation.state === 'validating') {
                                            borderColor = '#93C5FD';
                                            bgColor = '#EFF6FF';
                                            textColor = '#2563EB';
                                            icon = <Loader2 size={12} className="animate-spin" style={{ color: '#3B82F6' }} />;
                                        } else if (validation.state === 'pending' && hasInput && !apiServerRunning) {
                                            borderColor = '#D97706';
                                            bgColor = '#FFFBEB';
                                            textColor = '#92400E';
                                        }

                                        return (
                                            <div
                                                key={index}
                                                className="transition-all duration-200"
                                                style={{ border: '1px solid', borderColor, background: bgColor }}
                                            >
                                                <div className="p-2.5 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-bold uppercase" style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'var(--muted)' }}>
                                                            #{index + 1}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            {validation.source === 'api' && (
                                                                <Globe size={10} className="text-blue-500" title="API" />
                                                            )}
                                                            {icon}
                                                        </div>
                                                    </div>

                                                    <div className="text-center">
                                                        <p className="text-xl font-bold transition-colors duration-300" style={{ color: textColor }}>
                                                            {word}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={userInputs[index] || ''}
                                                            onChange={(e) => handleInputChange(index, e.target.value)}
                                                            placeholder="Type..."
                                                            className="w-full outline-none text-center font-medium transition-colors"
                                                            style={{
                                                                padding: '5px 6px',
                                                                fontSize: '12px',
                                                                border: '1px solid',
                                                                borderRadius: 0,
                                                                borderColor: validation.state === 'correct' ? '#4A7C59'
                                                                    : validation.state === 'incorrect' ? 'var(--accent)'
                                                                    : validation.state === 'validating' ? '#93C5FD'
                                                                    : 'var(--rule)',
                                                                background: 'white',
                                                                color: 'var(--fg)',
                                                                fontFamily: "'DM Sans', sans-serif",
                                                            }}
                                                        />
                                                    </div>

                                                    {validation.state !== 'correct' && validation.state !== 'validating' && validation.correctAnswer && (
                                                        <button
                                                            onClick={() => setShowAnswer(prev => ({ ...prev, [index]: !prev[index] }))}
                                                            className="w-full flex items-center justify-center gap-1 transition-opacity hover:opacity-70"
                                                            style={{ fontSize: '10px', letterSpacing: '0.06em', padding: '4px 6px', border: '1px solid var(--rule)', background: 'transparent', color: 'var(--muted)', borderRadius: 0, fontWeight: '500' }}
                                                        >
                                                            <Eye size={10} />
                                                            {showAnswer[index] ? 'Hide' : 'Show'}
                                                        </button>
                                                    )}

                                                    {showAnswer[index] && validation.correctAnswer && (
                                                        <div className="text-center font-mono font-bold" style={{ fontSize: '10px', color: 'var(--fg)', padding: '3px 6px', background: '#F3F4F6', borderRadius: 0 }}>
                                                            {validation.correctAnswer}
                                                        </div>
                                                    )}

                                                    {validation.state === 'correct' && validation.meaning && (
                                                        <div className="text-center truncate" style={{ fontSize: '9px', color: '#4A7C59', fontStyle: 'italic' }}>
                                                            {validation.meaning}
                                                        </div>
                                                    )}
                                                    {validation.state === 'validating' && (
                                                        <div className="text-center" style={{ fontSize: '9px', color: '#3B82F6' }}>Checking...</div>
                                                    )}
                                                    {validation.state === 'pending' && hasInput && !apiServerRunning && (
                                                        <div className="text-center" style={{ fontSize: '9px', color: '#92400E' }}>⚠ Need API</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>

            {/* Poster Modal — Swiss: no rounding */}
            {showPoster && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" style={{ backdropFilter: 'blur(2px)' }}>
                    <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto relative" style={{ border: '1px solid var(--rule)' }}>
                        <button
                            onClick={() => setShowPoster(false)}
                            className="absolute top-4 right-4 z-10 flex items-center gap-1 transition-opacity hover:opacity-60"
                            style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--muted)', padding: '4px 8px', border: '1px solid var(--rule)', borderRadius: 0 }}
                        >
                            <X size={12} />
                            <span className="uppercase font-medium">Close</span>
                        </button>
                        <div className="p-8 flex flex-col items-center">
                            <p className="uppercase font-bold mb-6" style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--muted)' }}>Progress Poster</p>
                            <WordPoster
                                title="HINDI PRACTICE"
                                subtitle="Transliteration"
                                meta={`Accuracy: ${accuracyPercent}%`}
                                text={pastedText}
                                footerLabel="HINDI READING PRACTICE"
                                footerText={`${APP_AUTHOR} · ${HINDI_FOOTER_TEXT}`}
                                statistics={{
                                    totalWordsRead: stats.completed,
                                    totalTimePracticed: totalPracticeTime + currentSessionTime
                                }}
                                progress={{
                                    currentStreak: currentStreak
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TypeToRevealPage;
