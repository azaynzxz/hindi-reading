import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReadingCard from './components/ReadingCard';
import Dashboard from './components/Dashboard';
import Flashcards from './components/Flashcards';
import month1Data from './data/month1.json';
import month2Data from './data/month2.json';
import month3Data from './data/month3.json';
import { ChevronRight, ChevronLeft, BookOpen, Globe, Square, Play, Pause, X, Type, Settings, Minus, Plus, Monitor, ExternalLink, Calendar, Download, Menu, ChevronDown, ChevronUp, Trophy, TrendingUp, Clock, MapPin, Share2, BarChart3, RotateCw, Languages, CheckCircle, MessageSquare } from 'lucide-react';
import { getStorage, setStorage, StorageKeys } from './utils/storage';
import { APP_AUTHOR, APP_FOOTER_LABEL, CHALLENGE_TITLE } from './utils/constants';

const ReadingChallenge = () => {
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(1);
    const [currentDay, setCurrentDay] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false);
    const [isTeleprompterActive, setIsTeleprompterActive] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(0.8);
    const scrollSpeedRef = useRef(0.8);
    const [fontSize, setFontSize] = useState(48);
    const [countdown, setCountdown] = useState(null);
    const [isControlsExpanded, setIsControlsExpanded] = useState(false);
    const [statistics, setStatistics] = useState(null);
    const [progress, setProgress] = useState(null);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showFlashcards, setShowFlashcards] = useState(false);
    const [practicedDays, setPracticedDays] = useState({});
    const [triggerPracticeTooltip, setTriggerPracticeTooltip] = useState(false);
    const [challengeStats, setChallengeStats] = useState(null);
    const scrollContainerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const practiceStartTimeRef = useRef(null);

    useEffect(() => {
        let timer;
        if (countdown !== null && countdown > 0) {
            timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
        } else if (countdown === 0) {
            setCountdown(null);
            setIsScrolling(true);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    // Update ref when scrollSpeed changes
    useEffect(() => {
        scrollSpeedRef.current = scrollSpeed;
    }, [scrollSpeed]);

    useEffect(() => {
        let intervalId = null;

        if (isScrolling && isTeleprompterActive && countdown === null) {
            // Use interval-based scrolling for reliable speed control
            // Update every 16ms (~60fps) for smooth scrolling
            intervalId = setInterval(() => {
                if (scrollContainerRef.current && isScrolling && isTeleprompterActive) {
                    const currentSpeed = scrollSpeedRef.current;

                    // Speed in pixels per interval (16ms)
                    // Speed 0.3 = 0.6px per 16ms = ~36px/sec (very slow)
                    // Speed 0.5 = 1.0px per 16ms = ~60px/sec (slow)
                    // Speed 0.8 = 1.6px per 16ms = ~96px/sec (normal)
                    // Speed 1.5 = 3.0px per 16ms = ~180px/sec (fast)
                    // Speed 2.0 = 4.0px per 16ms = ~240px/sec (very fast)
                    // Use multiplier of 2.0 to ensure even slowest speeds produce visible scrolling
                    const scrollAmount = currentSpeed * 2.0;

                    if (scrollContainerRef.current && scrollAmount > 0) {
                        const container = scrollContainerRef.current;
                        container.scrollTop += scrollAmount;

                        const { scrollTop, scrollHeight, clientHeight } = container;
                        if (scrollTop + clientHeight >= scrollHeight - 1) {
                            setIsScrolling(false);
                        }
                    }
                }
            }, 16); // ~60fps
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isScrolling, isTeleprompterActive, countdown]);

    const allMonthsData = { 1: month1Data, 2: month2Data, 3: month3Data };
    const activeData = allMonthsData[currentMonth]?.find(d => d.day === currentDay) || null;

    // Load statistics and progress on mount
    useEffect(() => {
        const stats = getStorage(StorageKeys.STATISTICS, {
            totalWordsRead: 0,
            totalTimePracticed: 0,
            practiceSessions: 0,
            countries: {},
            topics: {},
            weeklyProgress: {},
            monthlyProgress: {}
        });
        setStatistics(stats);

        const prog = getStorage(StorageKeys.PROGRESS, {
            completedDays: {},
            currentStreak: 0,
            longestStreak: 0,
            lastPracticeDate: null,
            badges: [],
            monthProgress: {}
        });
        setProgress(prog);

        // Load practiced days (days where Practice button was clicked)
        const practiced = getStorage(StorageKeys.PRACTICED_DAYS, {});
        setPracticedDays(practiced);

        // Handle URL path for sharing (format: /m1-day1 for month 1, day 1)
        const pathname = window.location.pathname;
        // Match format: /m1-day1 (new format)
        const newFormatMatch = pathname.match(/^\/m(\d+)-day(\d+)$/);
        // Match format: /1-1 (old simple format - backward compatibility)
        const simpleMatch = pathname.match(/^\/(\d+)-(\d+)$/);
        // Match format: /month-1-day-1 (old full format - backward compatibility)
        const fullMatch = pathname.match(/\/month-(\d+)-day-(\d+)/);

        if (newFormatMatch) {
            const monthParam = parseInt(newFormatMatch[1]);
            const dayParam = parseInt(newFormatMatch[2]);
            if (monthParam && monthParam >= 1 && monthParam <= 3) setCurrentMonth(monthParam);
            if (dayParam && dayParam >= 1 && dayParam <= 30) setCurrentDay(dayParam);
        } else if (simpleMatch) {
            // Backward compatibility with old simple format
            const monthParam = parseInt(simpleMatch[1]);
            const dayParam = parseInt(simpleMatch[2]);
            if (monthParam && monthParam >= 1 && monthParam <= 3) setCurrentMonth(monthParam);
            if (dayParam && dayParam >= 1 && dayParam <= 30) setCurrentDay(dayParam);
        } else if (fullMatch) {
            // Backward compatibility with old full format
            const monthParam = parseInt(fullMatch[1]);
            const dayParam = parseInt(fullMatch[2]);
            if (monthParam && monthParam >= 1 && monthParam <= 3) setCurrentMonth(monthParam);
            if (dayParam && dayParam >= 1 && dayParam <= 30) setCurrentDay(dayParam);
        } else {
            // Fallback: Check for old query parameter format for backward compatibility
            const urlParams = new URLSearchParams(window.location.search);
            const monthParam = urlParams.get('month');
            const dayParam = urlParams.get('day');
            if (monthParam) setCurrentMonth(parseInt(monthParam));
            if (dayParam) setCurrentDay(parseInt(dayParam));
        }
    }, []);

    // Track teleprompter completion and update statistics
    useEffect(() => {
        if (!isTeleprompterActive && !isClosing && practiceStartTimeRef.current && activeData && allMonthsData[currentMonth]) {
            const practiceDuration = Math.floor((Date.now() - practiceStartTimeRef.current) / 1000);
            practiceStartTimeRef.current = null;

            const stats = getStorage(StorageKeys.STATISTICS, {
                totalWordsRead: 0,
                totalTimePracticed: 0,
                practiceSessions: 0,
                countries: {},
                topics: {},
                weeklyProgress: {},
                monthlyProgress: {}
            });

            stats.totalTimePracticed = (stats.totalTimePracticed || 0) + practiceDuration;
            const wordCount = activeData?.text.split(' ').length || 0;
            stats.totalWordsRead = (stats.totalWordsRead || 0) + wordCount;
            stats.practiceSessions = (stats.practiceSessions || 0) + 1;

            const country = activeData?.country || 'Unknown';
            stats.countries[country] = (stats.countries[country] || 0) + 1;

            const today = new Date();
            const weekKey = `${today.getFullYear()}-W${Math.ceil(today.getDate() / 7)}`;
            stats.weeklyProgress[weekKey] = (stats.weeklyProgress[weekKey] || 0) + practiceDuration;

            const monthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
            stats.monthlyProgress[monthKey] = (stats.monthlyProgress[monthKey] || 0) + practiceDuration;

            setStorage(StorageKeys.STATISTICS, stats);
            setStatistics(stats);

            const prog = getStorage(StorageKeys.PROGRESS, {
                completedDays: {},
                currentStreak: 0,
                longestStreak: 0,
                lastPracticeDate: null,
                badges: [],
                monthProgress: {}
            });

            const dayKey = `${currentMonth}-${currentDay}`;
            const todayStr = today.toISOString().split('T')[0];

            if (!prog.completedDays[dayKey]) {
                prog.completedDays[dayKey] = {
                    completed: true,
                    date: todayStr,
                    practiceTime: practiceDuration
                };

                const lastDate = prog.lastPracticeDate ? new Date(prog.lastPracticeDate) : null;
                const todayDate = new Date(todayStr);

                if (!lastDate || Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24)) === 1) {
                    prog.currentStreak = (prog.currentStreak || 0) + 1;
                } else if (Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24)) > 1) {
                    prog.currentStreak = 1;
                }

                if (prog.currentStreak > prog.longestStreak) {
                    prog.longestStreak = prog.currentStreak;
                }

                if (prog.currentStreak === 7 && !prog.badges.includes('7-day-streak')) {
                    prog.badges.push('7-day-streak');
                }
                if (prog.currentStreak === 30 && !prog.badges.includes('30-day-streak')) {
                    prog.badges.push('30-day-streak');
                }

                prog.lastPracticeDate = todayStr;
            }

            const monthProgressKey = `month-${currentMonth}`;
            if (!prog.monthProgress[monthProgressKey]) {
                prog.monthProgress[monthProgressKey] = { completed: [] };
            }
            if (!prog.monthProgress[monthProgressKey].completed.includes(currentDay)) {
                prog.monthProgress[monthProgressKey].completed.push(currentDay);
            }

            setStorage(StorageKeys.PROGRESS, prog);
            setProgress(prog);
        }
    }, [isTeleprompterActive, isClosing, currentMonth, currentDay]);

    // Update URL when month or day changes (format: /m1-day1)
    useEffect(() => {
        const newPath = `/m${currentMonth}-day${currentDay}`;
        if (window.location.pathname !== newPath) {
            window.history.replaceState({}, '', newPath);
        }
    }, [currentMonth, currentDay]);

    const isDayPracticed = (month, day) => {
        const dayKey = `${month}-${day}`;
        return practicedDays[dayKey] === true;
    };

    const handleDayClick = (day) => {
        const isLocked = day > 1 && !isDayPracticed(currentMonth, day - 1);
        if (isLocked) {
            // On mobile, close the menu and show tooltip
            if (isMobileMenuOpen) {
                setIsMobileMenuClosing(true);
                setTimeout(() => {
                    setIsMobileMenuOpen(false);
                    setIsMobileMenuClosing(false);
                    // Trigger tooltip after menu closes
                    setTimeout(() => {
                        setTriggerPracticeTooltip(true);
                        setTimeout(() => setTriggerPracticeTooltip(false), 100);
                    }, 300);
                }, 300);
            } else {
                // On desktop, just trigger tooltip
                setTriggerPracticeTooltip(true);
                setTimeout(() => setTriggerPracticeTooltip(false), 100);
            }
            return;
        }
        setCurrentDay(day);
    };

    const handleNext = () => {
        // Check if current day is practiced before allowing next
        if (currentDay < 30 && isDayPracticed(currentMonth, currentDay)) {
            setCurrentDay(currentDay + 1);
        }
    };
    const handlePrev = () => { if (currentDay > 1) setCurrentDay(currentDay - 1); };
    const changeMonth = (month) => {
        setCurrentMonth(month);
        setCurrentDay(1);
        setCountdown(null);
        setIsScrolling(false);
    };

    const downloadImage = () => {
        setIsGenerating(true);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1080;
        canvas.height = 1920;
        ctx.fillStyle = '#F2F2F2';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const margin = 80;
        const accentColor = '#880000';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(margin, margin, canvas.width - margin * 2, canvas.height - margin * 2);
        const innerMargin = margin + 60;
        const innerWidth = canvas.width - innerMargin * 2;
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(CHALLENGE_TITLE, innerMargin, innerMargin + 40);
        ctx.fillText(`MONTH ${currentMonth}`, innerMargin, innerMargin + 80);
        ctx.font = 'bold 200px Arial, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.textAlign = 'right';
        ctx.fillText(`${currentDay < 10 ? '0' : ''}${currentDay}`, canvas.width - innerMargin, innerMargin + 140);
        ctx.textAlign = 'left';
        let yPos = innerMargin + 250;
        ctx.font = 'bold 30px Arial, sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText(activeData.country.toUpperCase(), innerMargin, yPos);
        yPos += 80;
        ctx.font = 'bold 70px Arial, sans-serif';
        ctx.fillStyle = '#000000';
        const titleWords = activeData.title.split(' ');
        let titleLine = '';
        for (let i = 0; i < titleWords.length; i++) {
            const testLine = titleLine + titleWords[i] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > innerWidth && i > 0) {
                ctx.fillText(titleLine, innerMargin, yPos);
                titleLine = titleWords[i] + ' ';
                yPos += 80;
            } else {
                titleLine = testLine;
            }
        }
        ctx.fillText(titleLine, innerMargin, yPos);
        yPos += 60;
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(innerMargin, yPos);
        ctx.lineTo(canvas.width - innerMargin, yPos);
        ctx.stroke();
        yPos += 80;
        ctx.font = '36px Arial, sans-serif';
        ctx.fillStyle = '#333333';
        const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
            const words = text.split(' ');
            let line = '';
            let currentY = y;
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = context.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    context.fillText(line, x, currentY);
                    line = words[n] + ' ';
                    currentY += lineHeight;
                } else {
                    line = testLine;
                }
            }
            context.fillText(line, x, currentY);
            return currentY + lineHeight;
        }
        yPos = wrapText(ctx, activeData.text, innerMargin, yPos, innerWidth, 55);

        // Add practice note text with auto-resize so it always fits
        yPos += 40; // spacing after main text
        const practiceNote = `This is my practice today about ${activeData.title}, cannot wait to improve my Hindi with the next training.`;
        const finalFooterY = canvas.height - innerMargin - 20;
        const noteAreaTop = yPos;
        const noteAreaMaxHeight = Math.max(80, finalFooterY - 120 - noteAreaTop); // leave room for footer

        const drawAutoFitNote = (context, text, x, y, maxWidth, maxHeight) => {
            const baseFontSize = 32;
            const minFontSize = 16;
            let chosenFontSize = minFontSize;
            let chosenLines = [];

            const wrapText = (fontSize) => {
                context.font = `italic ${fontSize}px Arial, sans-serif`;
                const words = text.split(' ');
                const lines = [];
                let line = '';
                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = context.measureText(testLine);
                    if (metrics.width > maxWidth && n > 0) {
                        lines.push(line.trim());
                        line = words[n] + ' ';
                    } else {
                        line = testLine;
                    }
                }
                if (line) lines.push(line.trim());
                return lines;
            };

            for (let fontSize = baseFontSize; fontSize >= minFontSize; fontSize -= 2) {
                const lines = wrapText(fontSize);
                const lineHeight = fontSize * 1.4;
                const neededHeight = lines.length * lineHeight;
                if (neededHeight <= maxHeight) {
                    chosenFontSize = fontSize;
                    chosenLines = lines;
                    break;
                }
            }

            if (chosenLines.length === 0) {
                chosenLines = wrapText(minFontSize);
                chosenFontSize = minFontSize;
            }

            context.font = `italic ${chosenFontSize}px Arial, sans-serif`;
            context.fillStyle = '#666666';
            context.textAlign = 'left';
            const lineHeight = chosenFontSize * 1.4;
            let currentY = y;
            chosenLines.forEach(line => {
                if (currentY + lineHeight <= y + maxHeight) {
                    context.fillText(line, x, currentY);
                    currentY += lineHeight;
                }
            });
        };

        if (noteAreaMaxHeight > 0) {
            drawAutoFitNote(ctx, practiceNote, innerMargin, noteAreaTop, innerWidth, noteAreaMaxHeight);
        }

        ctx.fillStyle = accentColor;
        ctx.fillRect(innerMargin, finalFooterY - 50, 60, 6);
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.fillStyle = '#000000';
        ctx.fillText(APP_FOOTER_LABEL, innerMargin, finalFooterY);
        ctx.font = 'normal 24px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'right';
        ctx.fillText(APP_AUTHOR, canvas.width - innerMargin, finalFooterY);
        const link = document.createElement('a');
        link.download = `Reading-Challenge-M${currentMonth}-D${currentDay}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        setIsGenerating(false);
    };


    const toggleTeleprompter = () => {
        if (isTeleprompterActive) {
            setIsClosing(true);
            setIsScrolling(false);
            setCountdown(null);
        } else {
            // Mark this day as practiced when Practice button is clicked
            const dayKey = `${currentMonth}-${currentDay}`;
            const practiced = getStorage(StorageKeys.PRACTICED_DAYS, {});
            if (!practiced[dayKey]) {
                practiced[dayKey] = true;
                setStorage(StorageKeys.PRACTICED_DAYS, practiced);
                setPracticedDays(practiced);
            }

            practiceStartTimeRef.current = Date.now();
            setIsTeleprompterActive(true);
            // Center the title when teleprompter opens
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    const contentElement = container.querySelector('div > h2');
                    if (contentElement) {
                        const containerHeight = container.clientHeight;
                        const titleTop = contentElement.offsetTop;
                        const titleHeight = contentElement.offsetHeight;
                        // Center the title in the viewport
                        container.scrollTop = titleTop - (containerHeight / 2) + (titleHeight / 2);
                    }
                }
            }, 150);
        }
    };

    const handleAnimationEnd = () => {
        if (isClosing) {
            setIsTeleprompterActive(false);
            setIsClosing(false);
        }
    };

    const handlePlayPause = () => {
        if (isScrolling) {
            setIsScrolling(false);
        } else {
            setCountdown(3);
        }
    };

    return (
        <>
            {isTeleprompterActive && (
                <div
                    className={`fixed inset-0 z-[9999] bg-black text-white flex flex-col ${isClosing ? 'animate-slideDown' : 'animate-slideUp'}`}
                    onAnimationEnd={handleAnimationEnd}
                >
                    {countdown !== null && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                            <div className="text-[12rem] md:text-[16rem] font-bold text-red-500 animate-pulse">{countdown}</div>
                        </div>
                    )}
                    <div className="bg-zinc-900 border-b border-zinc-800">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-2">
                                <Monitor className="text-red-500" size={20} />
                                <span className="font-bold text-sm md:text-base">Teleprompter Mode</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Collapse Button */}
                                <button
                                    onClick={() => setIsControlsExpanded(!isControlsExpanded)}
                                    className="p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
                                    title={isControlsExpanded ? 'Hide Controls' : 'Show Controls'}
                                >
                                    <Settings size={20} className={isControlsExpanded ? 'rotate-90' : ''} />
                                </button>
                                <button onClick={toggleTeleprompter} className="text-zinc-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-zinc-800">
                                    <X size={20} className="md:w-7 md:h-7" />
                                </button>
                            </div>
                        </div>

                        {/* Controls - Collapsible */}
                        <div className={`overflow-hidden transition-all duration-300 ${isControlsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="px-4 pb-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                                <div className="flex flex-col gap-2 w-full md:w-56 bg-zinc-800/50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Speed</span>
                                        <span className="text-sm text-zinc-200 font-mono font-bold bg-red-500/20 px-2 py-0.5 rounded">{scrollSpeed.toFixed(1)}x</span>
                                    </div>
                                    {/* Speed Presets */}
                                    <div className="flex gap-1.5 mb-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const newSpeed = 0.3;
                                                setScrollSpeed(newSpeed);
                                                scrollSpeedRef.current = newSpeed;
                                            }}
                                            className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-all ${Math.abs(scrollSpeed - 0.3) < 0.05
                                                ? 'bg-red-500 text-white'
                                                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                                }`}
                                        >
                                            Very Slow
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const newSpeed = 0.5;
                                                setScrollSpeed(newSpeed);
                                                scrollSpeedRef.current = newSpeed;
                                            }}
                                            className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-all ${Math.abs(scrollSpeed - 0.5) < 0.05
                                                ? 'bg-red-500 text-white'
                                                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                                }`}
                                        >
                                            Slow
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const newSpeed = 0.8;
                                                setScrollSpeed(newSpeed);
                                                scrollSpeedRef.current = newSpeed;
                                            }}
                                            className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-all ${Math.abs(scrollSpeed - 0.8) < 0.05
                                                ? 'bg-red-500 text-white'
                                                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                                }`}
                                        >
                                            Normal
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const newSpeed = 1.5;
                                                setScrollSpeed(newSpeed);
                                                scrollSpeedRef.current = newSpeed;
                                            }}
                                            className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-all ${Math.abs(scrollSpeed - 1.5) < 0.05
                                                ? 'bg-red-500 text-white'
                                                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                                }`}
                                        >
                                            Fast
                                        </button>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.3"
                                        max="2"
                                        step="0.05"
                                        value={scrollSpeed}
                                        onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-colors"
                                    />
                                    <div className="flex justify-between text-xs text-zinc-400 mt-1">
                                        <span>Slowest</span>
                                        <span>Fastest</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 w-full md:w-56 bg-zinc-800/50 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Text Size</span>
                                        <span className="text-sm text-zinc-200 font-mono font-bold bg-red-500/20 px-2 py-0.5 rounded">{fontSize}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="16"
                                        max="96"
                                        step="4"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative no-scrollbar" style={{ paddingBottom: '50vh', paddingTop: '50vh', scrollBehavior: 'auto' }}>
                        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center leading-relaxed font-bold transition-all duration-300" style={{ fontSize: `${fontSize}px` }}>
                            <h2 className="text-red-500 mb-12 md:mb-16 uppercase tracking-widest opacity-80" style={{ fontSize: `${fontSize * 0.6}px` }}>{activeData.title}</h2>
                            {activeData.text}
                        </div>
                    </div>
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50">
                        <button onClick={handlePlayPause} disabled={countdown !== null} className={`p-6 rounded-full shadow-2xl transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isScrolling ? 'bg-zinc-800 text-red-400 border border-red-900/50' : 'bg-[#880000] text-white'}`}>
                            {isScrolling ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                        </button>
                    </div>
                </div>
            )}
            <div className="h-screen w-screen bg-stone-50 text-slate-800 font-sans selection:bg-[#880000]/20 flex flex-col items-center justify-center overflow-hidden">
                {/* Navbar */}
            {/* Navbar — Swiss: no shadow, 1px bottom rule */}
                <nav className="w-full bg-white border-b flex-shrink-0 z-20 fixed top-0" style={{ borderColor: 'var(--rule)' }}>
                    <div className="w-full max-w-6xl mx-auto px-6">
                        <div className="h-12 flex items-center justify-between">
                            {/* Wordmark */}
                            <div className="flex items-center gap-2" style={{ color: 'var(--accent)' }}>
                                <BookOpen size={18} />
                                <span className="font-bold uppercase tracking-widest" style={{ fontSize: '12px', color: 'var(--fg)' }}>ENGLISH READING PRACTICE</span>
                            </div>
                            {/* Nav links */}
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => setShowDashboard(true)}
                                    className="hidden sm:block uppercase font-medium transition-opacity hover:opacity-60"
                                    style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--muted)' }}
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => setShowFlashcards(true)}
                                    className="hidden sm:block uppercase font-medium transition-opacity hover:opacity-60"
                                    style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--muted)' }}
                                >
                                    Flashcards
                                </button>
                                <button
                                    onClick={() => navigate('/hindi-practice')}
                                    className="hidden sm:block uppercase font-medium transition-opacity hover:opacity-60"
                                    style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--muted)' }}
                                >
                                    Hindi
                                </button>
                                <button
                                    onClick={() => navigate('/type-to-reveal')}
                                    className="hidden sm:block uppercase font-medium transition-opacity hover:opacity-60"
                                    style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--muted)' }}
                                >
                                    Type
                                </button>
                                <button
                                    onClick={() => navigate('/hindi-conversation')}
                                    className="hidden sm:block uppercase font-medium transition-opacity hover:opacity-60"
                                    style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--muted)' }}
                                >
                                    Conversation
                                </button>
                                {/* Mobile hamburger */}
                                <button
                                    onClick={() => {
                                        if (isMobileMenuOpen) {
                                            setIsMobileMenuClosing(true);
                                            setTimeout(() => {
                                                setIsMobileMenuOpen(false);
                                                setIsMobileMenuClosing(false);
                                            }, 300);
                                        } else {
                                            setIsMobileMenuOpen(true);
                                        }
                                    }}
                                    className="lg:hidden transition-opacity hover:opacity-60"
                                    style={{ color: 'var(--fg)' }}
                                    aria-label="Toggle menu"
                                >
                                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Mobile Bottom Sheet & Tablet Modal */}
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className={`fixed inset-0 bg-black z-30 lg:hidden ${isMobileMenuClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                            onClick={() => {
                                setIsMobileMenuClosing(true);
                                setTimeout(() => {
                                    setIsMobileMenuOpen(false);
                                    setIsMobileMenuClosing(false);
                                }, 300);
                            }}
                        />

                        {/* Mobile Bottom Sheet */}
                        <div className={`fixed bottom-0 left-0 right-0 bg-white border-t z-40 md:hidden max-h-[85vh] overflow-y-auto ${isMobileMenuClosing ? 'animate-bottom-sheet-out' : 'animate-bottom-sheet-in'}`} style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                            <div className="px-6 py-6">
                                {/* Close Button */}
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="uppercase font-bold tracking-widest" style={{ fontSize: '13px', color: 'var(--fg)' }}>Navigation Menu</h2>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuClosing(true);
                                            setTimeout(() => {
                                                setIsMobileMenuOpen(false);
                                                setIsMobileMenuClosing(false);
                                            }, 300);
                                        }}
                                        className="p-1 text-slate-400 hover:text-slate-600 transition-opacity hover:opacity-70"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Month Selector */}
                                <div className="mb-6">
                                    <h3 className="uppercase font-bold tracking-wider mb-3 flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                                        <Calendar size={14} className="text-[#880000]" /> Month Selector
                                    </h3>
                                    <div className="flex border" style={{ borderColor: 'var(--rule)' }}>
                                        <button
                                            onClick={() => {
                                                changeMonth(1);
                                            }}
                                            className="flex-1 py-2 text-xs font-bold uppercase transition-all"
                                            style={{ letterSpacing: '0.06em', background: currentMonth === 1 ? 'var(--accent)' : 'transparent', color: currentMonth === 1 ? 'white' : 'var(--muted)', borderRight: '1px solid var(--rule)', borderRadius: 0 }}
                                        >
                                            M1
                                        </button>
                                        <button
                                            onClick={() => {
                                                changeMonth(2);
                                            }}
                                            className="flex-1 py-2 text-xs font-bold uppercase transition-all"
                                            style={{ letterSpacing: '0.06em', background: currentMonth === 2 ? 'var(--accent)' : 'transparent', color: currentMonth === 2 ? 'white' : 'var(--muted)', borderRight: '1px solid var(--rule)', borderRadius: 0 }}
                                        >
                                            M2
                                        </button>
                                        <button
                                            onClick={() => {
                                                changeMonth(3);
                                            }}
                                            className="flex-1 py-2 text-xs font-bold uppercase transition-all"
                                            style={{ letterSpacing: '0.06em', background: currentMonth === 3 ? 'var(--accent)' : 'transparent', color: currentMonth === 3 ? 'white' : 'var(--muted)', borderRadius: 0 }}
                                        >
                                            M3
                                        </button>
                                    </div>
                                </div>

                                {/* Dashboard & Flashcards Buttons */}
                                <div className="mb-6">
                                    <h3 className="uppercase font-bold tracking-wider mb-3 flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                                        <Trophy size={14} className="text-[#880000]" /> Quick Actions
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                setShowDashboard(true);
                                                setIsMobileMenuClosing(true);
                                                setTimeout(() => {
                                                    setIsMobileMenuOpen(false);
                                                    setIsMobileMenuClosing(false);
                                                }, 300);
                                            }}
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#880000] text-white font-semibold text-xs uppercase transition-all hover:bg-[#770000]"
                                            style={{ borderRadius: 0, letterSpacing: '0.06em' }}
                                        >
                                            <BarChart3 size={14} />
                                            <span>Dashboard</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowFlashcards(true);
                                                setIsMobileMenuClosing(true);
                                                setTimeout(() => {
                                                    setIsMobileMenuOpen(false);
                                                    setIsMobileMenuClosing(false);
                                                }, 300);
                                            }}
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#880000] text-white font-semibold text-xs uppercase transition-all hover:bg-[#770000]"
                                            style={{ borderRadius: 0, letterSpacing: '0.06em' }}
                                        >
                                            <RotateCw size={14} />
                                            <span>Flashcards</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigate('/hindi-practice');
                                                setIsMobileMenuClosing(true);
                                                setTimeout(() => {
                                                    setIsMobileMenuOpen(false);
                                                    setIsMobileMenuClosing(false);
                                                }, 300);
                                            }}
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#880000] text-white font-semibold text-xs uppercase transition-all hover:bg-[#770000]"
                                            style={{ borderRadius: 0, letterSpacing: '0.06em' }}
                                        >
                                            <Languages size={14} />
                                            <span>Hindi Practice</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigate('/type-to-reveal');
                                                setIsMobileMenuClosing(true);
                                                setTimeout(() => {
                                                    setIsMobileMenuOpen(false);
                                                    setIsMobileMenuClosing(false);
                                                }, 300);
                                            }}
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#880000] text-white font-semibold text-xs uppercase transition-all hover:bg-[#770000]"
                                            style={{ borderRadius: 0, letterSpacing: '0.06em' }}
                                        >
                                            <Type size={14} />
                                            <span>Type to Reveal</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigate('/hindi-conversation');
                                                setIsMobileMenuClosing(true);
                                                setTimeout(() => {
                                                    setIsMobileMenuOpen(false);
                                                    setIsMobileMenuClosing(false);
                                                }, 300);
                                            }}
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#880000] text-white font-semibold text-xs uppercase transition-all hover:bg-[#770000]"
                                            style={{ borderRadius: 0, letterSpacing: '0.06em' }}
                                        >
                                            <MessageSquare size={14} />
                                            <span>Conversation</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Day Selector */}
                                <div>
                                    <h3 className="uppercase font-bold tracking-wider mb-3 flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                                        <Square size={14} className="text-[#880000]" /> Day Selector
                                    </h3>
                                    <div className="grid grid-cols-5 gap-1">
                                        {allMonthsData[currentMonth].map((d) => {
                                            const isPracticed = isDayPracticed(currentMonth, d.day);
                                            const isLocked = d.day > 1 && !isDayPracticed(currentMonth, d.day - 1);
                                            return (
                                                <button
                                                    key={d.day}
                                                    onClick={() => handleDayClick(d.day)}
                                                    className="aspect-square text-xs font-bold transition-all"
                                                    style={{
                                                        borderRadius: 0,
                                                        border: '1px solid',
                                                        borderColor: currentDay === d.day ? 'var(--accent)' : isPracticed ? '#4A7C59' : 'var(--rule)',
                                                        background: currentDay === d.day ? 'var(--accent)' : isPracticed ? '#F0FAF3' : 'transparent',
                                                        color: currentDay === d.day ? 'white' : isPracticed ? '#2D5E40' : isLocked ? 'var(--rule)' : 'var(--fg)',
                                                        cursor: isLocked ? 'default' : 'pointer',
                                                        fontSize: '11px',
                                                    }}
                                                    title={isLocked ? 'Complete previous day first' : isPracticed ? 'Practiced' : ''}
                                                >
                                                    {d.day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tablet Modal Popup */}
                        <div className={`hidden md:flex lg:hidden fixed inset-0 z-40 items-center justify-center p-4 ${isMobileMenuClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                            <div className="bg-white border w-full max-w-md overflow-hidden flex flex-col" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                                {/* Header */}
                                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--rule)' }}>
                                    <h2 className="uppercase font-bold tracking-widest flex items-center gap-2" style={{ fontSize: '13px', color: 'var(--fg)' }}>
                                        <Calendar className="text-[#880000]" size={16} />
                                        Select Month & Day
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setIsMobileMenuClosing(true);
                                            setTimeout(() => {
                                                setIsMobileMenuOpen(false);
                                                setIsMobileMenuClosing(false);
                                            }, 300);
                                        }}
                                        className="p-1 text-slate-400 hover:text-slate-600 transition-opacity hover:opacity-70"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Month Selector */}
                                    <div>
                                        <h3 className="uppercase font-bold tracking-wider mb-3 flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                                            <Calendar size={14} className="text-[#880000]" /> Month Selector
                                        </h3>
                                        <div className="flex border" style={{ borderColor: 'var(--rule)' }}>
                                            <button
                                                onClick={() => {
                                                    changeMonth(1);
                                                }}
                                                className="flex-1 py-2 text-xs font-bold uppercase transition-all"
                                                style={{ letterSpacing: '0.06em', background: currentMonth === 1 ? 'var(--accent)' : 'transparent', color: currentMonth === 1 ? 'white' : 'var(--muted)', borderRight: '1px solid var(--rule)', borderRadius: 0 }}
                                            >
                                                M1
                                            </button>
                                            <button
                                                onClick={() => {
                                                    changeMonth(2);
                                                }}
                                                className="flex-1 py-2 text-xs font-bold uppercase transition-all"
                                                style={{ letterSpacing: '0.06em', background: currentMonth === 2 ? 'var(--accent)' : 'transparent', color: currentMonth === 2 ? 'white' : 'var(--muted)', borderRight: '1px solid var(--rule)', borderRadius: 0 }}
                                            >
                                                M2
                                            </button>
                                            <button
                                                onClick={() => {
                                                    changeMonth(3);
                                                }}
                                                className="flex-1 py-2 text-xs font-bold uppercase transition-all"
                                                style={{ letterSpacing: '0.06em', background: currentMonth === 3 ? 'var(--accent)' : 'transparent', color: currentMonth === 3 ? 'white' : 'var(--muted)', borderRadius: 0 }}
                                            >
                                                M3
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dashboard & Flashcards Buttons */}
                                    <div>
                                        <h3 className="uppercase font-bold tracking-wider mb-3 flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                                            <Trophy size={14} className="text-[#880000]" /> Quick Actions
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => {
                                                    setShowDashboard(true);
                                                    setIsMobileMenuClosing(true);
                                                    setTimeout(() => {
                                                        setIsMobileMenuOpen(false);
                                                        setIsMobileMenuClosing(false);
                                                    }, 300);
                                                }}
                                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#880000] text-white font-semibold text-xs uppercase transition-all hover:bg-[#770000]"
                                                style={{ borderRadius: 0, letterSpacing: '0.06em' }}
                                            >
                                                <BarChart3 size={14} />
                                                <span>Dashboard</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowFlashcards(true);
                                                    setIsMobileMenuClosing(true);
                                                    setTimeout(() => {
                                                        setIsMobileMenuOpen(false);
                                                        setIsMobileMenuClosing(false);
                                                    }, 300);
                                                }}
                                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#880000] text-white font-semibold text-xs uppercase transition-all hover:bg-[#770000]"
                                                style={{ borderRadius: 0, letterSpacing: '0.06em' }}
                                            >
                                                <RotateCw size={14} />
                                                <span>Flashcards</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate('/hindi-practice');
                                                    setIsMobileMenuClosing(true);
                                                    setTimeout(() => {
                                                        setIsMobileMenuOpen(false);
                                                        setIsMobileMenuClosing(false);
                                                    }, 300);
                                                }}
                                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#880000] text-white font-semibold text-xs uppercase transition-all hover:bg-[#770000]"
                                                style={{ borderRadius: 0, letterSpacing: '0.06em' }}
                                            >
                                                <Languages size={14} />
                                                <span>Hindi Practice</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate('/type-to-reveal');
                                                    setIsMobileMenuClosing(true);
                                                    setTimeout(() => {
                                                        setIsMobileMenuOpen(false);
                                                        setIsMobileMenuClosing(false);
                                                    }, 300);
                                                }}
                                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#880000] text-white font-semibold text-xs uppercase transition-all hover:bg-[#770000]"
                                                style={{ borderRadius: 0, letterSpacing: '0.06em' }}
                                            >
                                                <Type size={14} />
                                                <span>Type to Reveal</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate('/hindi-conversation');
                                                    setIsMobileMenuClosing(true);
                                                    setTimeout(() => {
                                                        setIsMobileMenuOpen(false);
                                                        setIsMobileMenuClosing(false);
                                                    }, 300);
                                                }}
                                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#880000] text-white font-semibold text-xs uppercase transition-all hover:bg-[#770000]"
                                                style={{ borderRadius: 0, letterSpacing: '0.06em' }}
                                            >
                                                <MessageSquare size={14} />
                                                <span>Conversation</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Day Selector */}
                                    <div>
                                        <h3 className="uppercase font-bold tracking-wider mb-3 flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                                            <Square size={14} className="text-[#880000]" /> Day Selector
                                        </h3>
                                        <div className="grid grid-cols-5 gap-1">
                                            {allMonthsData[currentMonth].map((d) => {
                                                const isPracticed = isDayPracticed(currentMonth, d.day);
                                                const isLocked = d.day > 1 && !isDayPracticed(currentMonth, d.day - 1);
                                                return (
                                                    <button
                                                        key={d.day}
                                                        onClick={() => handleDayClick(d.day)}
                                                        className="aspect-square text-xs font-bold transition-all"
                                                        style={{
                                                            borderRadius: 0,
                                                            border: '1px solid',
                                                            borderColor: currentDay === d.day ? 'var(--accent)' : isPracticed ? '#4A7C59' : 'var(--rule)',
                                                            background: currentDay === d.day ? 'var(--accent)' : isPracticed ? '#F0FAF3' : 'transparent',
                                                            color: currentDay === d.day ? 'white' : isPracticed ? '#2D5E40' : isLocked ? 'var(--rule)' : 'var(--fg)',
                                                            cursor: isLocked ? 'default' : 'pointer',
                                                            fontSize: '11px',
                                                        }}
                                                        title={isLocked ? 'Complete previous day first' : isPracticed ? 'Practiced' : ''}
                                                    >
                                                        {d.day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Main Content */}
                <div className="w-full flex-1 flex flex-col items-center justify-center pt-20 md:pt-24 pb-4 px-4 md:px-6 lg:px-8 min-h-0 overflow-hidden">
                    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0 max-h-full">
                        {/* Desktop Sidebar — Swiss: flat panel, 1px rule border */}
                        <div className="hidden lg:block lg:col-span-3 flex flex-col min-h-0">
                            <div className="border flex-1 flex flex-col p-4" style={{ borderColor: 'var(--rule)', background: 'white' }}>
                                <p className="uppercase font-medium mb-3" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--muted)' }}>Month</p>
                                <div className="flex border mb-4" style={{ borderColor: 'var(--rule)' }}>
                                    <button onClick={() => changeMonth(1)} className="flex-1 py-2 text-xs font-bold uppercase transition-all" style={{ letterSpacing: '0.06em', background: currentMonth === 1 ? 'var(--accent)' : 'transparent', color: currentMonth === 1 ? 'white' : 'var(--muted)', borderRight: '1px solid var(--rule)' }}>M1</button>
                                    <button onClick={() => changeMonth(2)} className="flex-1 py-2 text-xs font-bold uppercase transition-all" style={{ letterSpacing: '0.06em', background: currentMonth === 2 ? 'var(--accent)' : 'transparent', color: currentMonth === 2 ? 'white' : 'var(--muted)', borderRight: '1px solid var(--rule)' }}>M2</button>
                                    <button onClick={() => changeMonth(3)} className="flex-1 py-2 text-xs font-bold uppercase transition-all" style={{ letterSpacing: '0.06em', background: currentMonth === 3 ? 'var(--accent)' : 'transparent', color: currentMonth === 3 ? 'white' : 'var(--muted)' }}>M3</button>
                                </div>

                                {/* Challenge Stats Display */}
                                {challengeStats && (
                                    <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg animate-in fade-in slide-in-from-top-2">
                                        <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <CheckCircle size={12} /> Challenge Stats
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-slate-500 text-[10px] uppercase tracking-wider">Time</span>
                                                <span className="font-mono font-bold text-purple-700">
                                                    {Math.floor(challengeStats.time / 60)}:{String(challengeStats.time % 60).padStart(2, '0')}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-slate-500 text-[10px] uppercase tracking-wider">Accuracy</span>
                                                <span className="font-mono font-bold text-purple-700">{challengeStats.accuracy}%</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-slate-500 text-[10px] uppercase tracking-wider">Correct</span>
                                                <span className="font-mono font-bold text-green-600">{challengeStats.correct}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-slate-500 text-[10px] uppercase tracking-wider">Wrong</span>
                                                <span className="font-mono font-bold text-red-600">{challengeStats.wrong}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <p className="uppercase font-medium mb-3 mt-3" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--muted)' }}>Day</p>
                                <div className="grid grid-cols-5 gap-1">
                                    {allMonthsData[currentMonth].map((d) => {
                                        const isPracticed = isDayPracticed(currentMonth, d.day);
                                        const isLocked = d.day > 1 && !isDayPracticed(currentMonth, d.day - 1);
                                        return (
                                            <button
                                                key={d.day}
                                                onClick={() => handleDayClick(d.day)}
                                                className="aspect-square text-xs font-bold transition-all"
                                                style={{
                                                    borderRadius: 0,
                                                    border: '1px solid',
                                                    borderColor: currentDay === d.day ? 'var(--accent)' : isPracticed ? '#4A7C59' : 'var(--rule)',
                                                    background: currentDay === d.day ? 'var(--accent)' : isPracticed ? '#F0FAF3' : 'transparent',
                                                    color: currentDay === d.day ? 'white' : isPracticed ? '#2D5E40' : isLocked ? 'var(--rule)' : 'var(--fg)',
                                                    cursor: isLocked ? 'default' : 'pointer',
                                                    fontSize: '11px',
                                                }}
                                                title={isLocked ? 'Complete previous day first' : isPracticed ? 'Practiced' : ''}
                                            >
                                                {d.day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Main Reading Card */}
                        <div className="lg:col-span-9 flex flex-col min-h-0">
                            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                                <ReadingCard
                                    activeData={activeData}
                                    currentMonth={currentMonth}
                                    currentDay={currentDay}
                                    isGenerating={isGenerating}
                                    onDownload={downloadImage}
                                    onToggleTeleprompter={toggleTeleprompter}
                                    onPrev={handlePrev}
                                    onNext={handleNext}
                                    isDayPracticed={isDayPracticed}
                                    practicedDays={practicedDays}
                                    statistics={statistics}
                                    progress={progress}
                                    triggerPracticeTooltip={triggerPracticeTooltip}
                                    onChallengeStatsUpdate={setChallengeStats}
                                />
                                <div className="mt-6 pb-6 border-t pt-4" style={{ borderColor: 'var(--rule)' }}>
                                    <p className="italic max-w-2xl" style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.6' }}>
                                        "This is my practice today about <span style={{ color: 'var(--accent)', fontWeight: '600', fontStyle: 'normal' }}>{activeData.title}</span>, cannot wait to improve my Hindi with the next training."
                                    </p>
                                    <p className="mt-3 uppercase font-bold" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--muted)' }}>
                                        — {APP_AUTHOR}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Modal */}
                {showDashboard && (
                    <Dashboard
                        statistics={statistics}
                        progress={progress}
                        currentMonth={currentMonth}
                        allMonthsData={allMonthsData}
                        onClose={() => setShowDashboard(false)}
                    />
                )}

                {/* Flashcards Modal */}
                {showFlashcards && (
                    <Flashcards onClose={() => setShowFlashcards(false)} />
                )}

            </div>
        </>
    );
};

export default ReadingChallenge;