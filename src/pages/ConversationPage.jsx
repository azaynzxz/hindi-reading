import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, User, HelpCircle, Check, AlertTriangle, ArrowRight, RefreshCw, Send, Play, Volume2, Menu, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import { API_BASE_URL } from '../utils/api';

const normalizeText = (text) => text.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

const ConversationPage = () => {
    const navigate = useNavigate();
    const [allConversations, setAllConversations] = useState({});
    const [topics, setTopics] = useState([]);
    const [activeTopic, setActiveTopic] = useState(null);
    const [turns, setTurns] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    
    // Role selection
    const [availableRoles, setAvailableRoles] = useState([]);
    const [userRole, setUserRole] = useState(null); // String name in English or null if choosing
    
    // Practice modes
    const [inputMode, setInputMode] = useState('choice'); // 'choice' | 'type'
    const [userInput, setUserInput] = useState('');
    const [choices, setChoices] = useState([]);
    const [selectedChoiceIdx, setSelectedChoiceIdx] = useState(null);
    const [feedback, setFeedback] = useState(null); // { success: boolean, correctText: string }
    const [isTyping, setIsTyping] = useState(false);
    
    const messageEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, isTyping]);

    // Load JSON data
    useEffect(() => {
        const loadJSON = async () => {
            try {
                const response = await fetch('/conversations.json');
                const data = await response.json();

                const grouped = {};
                Object.keys(data).forEach(slug => {
                    const item = data[slug];
                    const topicName = item.theme.replace('Daily Conversation - ', '');
                    
                    grouped[topicName] = item.turns.map(turn => ({
                        hindiSpeaker: turn.speaker_hi,
                        hindiText: turn.hindi,
                        englishSpeaker: turn.speaker_en,
                        translitText: turn.transliteration,
                        meaningText: turn.meaning
                    }));
                });

                setAllConversations(grouped);
                setTopics(Object.keys(grouped));
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading JSON:', error);
                setIsLoading(false);
            }
        };

        loadJSON();
    }, []);

    // Set up conversation once topic is selected
    const handleTopicSelect = (topic) => {
        const selectedTurns = allConversations[topic] || [];
        setTurns(selectedTurns);
        setActiveTopic(topic);
        
        // Extract unique roles from English speakers
        const roles = [...new Set(selectedTurns.map(t => t.englishSpeaker))];
        setAvailableRoles(roles);
        
        // Reset states
        setUserRole(null);
        setChatHistory([]);
        setCurrentIndex(0);
        setFeedback(null);
        setUserInput('');
    };

    // Begin conversation after role selection
    const handleStartConversation = (role) => {
        setUserRole(role);
        setChatHistory([]);
        setCurrentIndex(0);
        setFeedback(null);
        setUserInput('');
        
        // If user is NOT the first speaker, run the computer turn
        const firstTurn = turns[0];
        if (firstTurn) {
            if (role !== 'read' && firstTurn.englishSpeaker !== role) {
                triggerComputerTurn(0, []);
            } else {
                generateChoices(0);
            }
        }
    };

    // Helper to trigger computer speaker turn with simulated typing delay
    const triggerComputerTurn = (index, currentHistory = chatHistory) => {
        if (index >= turns.length) return;
        
        setIsTyping(true);
        const turn = turns[index];
        
        // Delay based on sentence length (min 1s)
        const delay = Math.max(1000, turn.hindiText.length * 60);
        
        setTimeout(() => {
            setIsTyping(false);
            const updatedHistory = [...currentHistory, { ...turn, isUser: false }];
            setChatHistory(updatedHistory);
            
            const nextIdx = index + 1;
            setCurrentIndex(nextIdx);
            
            if (nextIdx < turns.length) {
                const nextTurn = turns[nextIdx];
                // If next turn belongs to computer too, chain it
                if (userRole !== 'read' && nextTurn.englishSpeaker !== userRole) {
                    triggerComputerTurn(nextIdx, updatedHistory);
                } else {
                    generateChoices(nextIdx);
                }
            }
        }, delay);
    };

    // Generate multiple choice options for user turn
    const generateChoices = (index) => {
        if (index >= turns.length) return;
        const correctTurn = turns[index];
        
        // Collect distractors from other turns in this conversation or other conversations
        const allPossibleTurns = Object.values(allConversations).flat();
        const distractors = allPossibleTurns
            .filter(t => t.hindiText !== correctTurn.hindiText && t.hindiSpeaker === correctTurn.hindiSpeaker)
            .map(t => t.hindiText);
            
        // Fallback distractors if not enough matching speakers
        while (distractors.length < 2) {
            const randomTurn = allPossibleTurns[Math.floor(Math.random() * allPossibleTurns.length)];
            if (randomTurn && randomTurn.hindiText !== correctTurn.hindiText) {
                distractors.push(randomTurn.hindiText);
            }
        }
        
        // Shuffle correct answer and 2 random distractors
        const shuffled = [correctTurn.hindiText, distractors[0], distractors[1]];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        setChoices(shuffled);
        setSelectedChoiceIdx(null);
    };

    // Validate user answer in Multiple Choice
    const handleChoiceSubmit = (choiceText, choiceIdx) => {
        if (feedback) return; // Wait for next turn
        
        setSelectedChoiceIdx(choiceIdx);
        const correctTurn = turns[currentIndex];
        
        const isCorrect = choiceText === correctTurn.hindiText;
        setFeedback({
            success: isCorrect,
            correctText: correctTurn.hindiText,
            correctTranslit: correctTurn.translitText,
            correctMeaning: correctTurn.meaningText
        });
    };

    // Validate user answer in Free Text typing (check against transliteration)
    const handleTextSubmit = (e) => {
        e.preventDefault();
        if (feedback || !userInput.trim()) return;
        
        const correctTurn = turns[currentIndex];
        const normalizedInput = normalizeText(userInput);
        const normalizedTarget = normalizeText(correctTurn.translitText);
        
        const isCorrect = normalizedInput === normalizedTarget;
        
        setFeedback({
            success: isCorrect,
            correctText: correctTurn.hindiText,
            correctTranslit: correctTurn.translitText,
            correctMeaning: correctTurn.meaningText
        });
    };

    // Proceed to next turn after user validation
    const handleNextTurn = () => {
        const correctTurn = turns[currentIndex];
        
        // Append user's choice/reply to chat history
        const updatedHistory = [...chatHistory, { ...correctTurn, isUser: true }];
        setChatHistory(updatedHistory);
        setFeedback(null);
        setUserInput('');
        
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        
        if (nextIdx < turns.length) {
            const nextTurn = turns[nextIdx];
            if (userRole !== 'read' && nextTurn.englishSpeaker !== userRole) {
                triggerComputerTurn(nextIdx, updatedHistory);
            } else {
                generateChoices(nextIdx);
            }
        }
    };

    // Step forward in Read Mode (just auto-advances turns)
    const handleReadModeStep = () => {
        if (currentIndex >= turns.length) return;
        const turn = turns[currentIndex];
        
        setChatHistory(prev => [...prev, { ...turn, isUser: currentIndex % 2 === 0 }]);
        setCurrentIndex(prev => prev + 1);
    };

    // Reset current conversation
    const handleRestart = () => {
        handleStartConversation(userRole);
    };

    // ─── RENDER ────────────────────────────────────────────────────────────
    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F9F8F6]" style={{ color: 'var(--fg)', fontFamily: "'DM Sans', sans-serif" }}>
            
            {/* Navbar */}
            <Navbar
                customMobileToggle={
                    activeTopic ? (
                        <button
                            onClick={() => setActiveTopic(null)}
                            className="transition-opacity hover:opacity-60 flex items-center justify-center p-1.5 bg-stone-100 hover:bg-stone-200 border"
                            style={{ color: 'var(--fg)', borderRadius: 0, borderColor: 'var(--rule)' }}
                            title="Back to Topics"
                        >
                            <ChevronLeft size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-wider ml-1">Topics</span>
                        </button>
                    ) : null
                }
            />

            {/* Main Area */}
            <div className="w-full flex-1 flex flex-col items-center justify-center pt-16 md:pt-20 pb-4 px-4 md:px-6 lg:px-8 min-h-0 overflow-hidden">
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0 max-h-full relative">
                    
                    {/* Left Panel: Topics selection */}
                    <aside className={`
                        absolute lg:static inset-y-0 left-0 z-10 w-72 lg:w-full lg:h-full lg:min-h-0 bg-white flex flex-col lg:col-span-3
                        border transition-transform duration-300 ease-in-out
                        ${activeTopic ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
                    `} style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                        <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: 'var(--rule)' }}>
                            <p className="uppercase font-medium mb-1" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--muted)' }}>
                                Dialogues
                            </p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center p-8">
                                    <RefreshCw className="animate-spin" size={18} style={{ color: 'var(--accent)' }} />
                                </div>
                            ) : (
                                topics.map(topic => (
                                    <button
                                        key={topic}
                                        onClick={() => handleTopicSelect(topic)}
                                        className="w-full text-left flex flex-col px-5 py-3 transition-colors border-b"
                                        style={{
                                            borderColor: 'var(--rule)',
                                            background: activeTopic === topic ? 'rgba(136,0,0,0.04)' : 'transparent',
                                            borderLeft: activeTopic === topic ? '2px solid var(--accent)' : '2px solid transparent',
                                        }}
                                    >
                                        <span className="font-bold truncate" style={{
                                            fontSize: '13px',
                                            color: activeTopic === topic ? 'var(--accent)' : 'var(--fg)'
                                        }}>
                                            {topic}
                                        </span>
                                        <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                                            {allConversations[topic]?.length || 0} turns
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </aside>

                    {/* Right Panel: Chat viewport */}
                    <main className="lg:col-span-9 flex flex-col min-h-0 bg-white border" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                        {!activeTopic ? (
                            // Welcome/Select screen
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-stone-50">
                                <MessageSquare size={48} className="mb-4" style={{ color: 'var(--rule)' }} />
                                <h3 className="font-bold uppercase tracking-wide mb-2" style={{ fontSize: '16px' }}>Select a Conversation</h3>
                                <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '320px' }}>
                                    Choose a topic from the sidebar to practice dialogues in a realistic chat interface.
                                </p>
                            </div>
                        ) : !userRole ? (
                            // Role selection screen
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-stone-50">
                                <User size={40} className="mb-4" style={{ color: 'var(--rule)' }} />
                                <h3 className="font-bold uppercase tracking-wide mb-1" style={{ fontSize: '15px' }}>Choose Your Practice Role</h3>
                                <p className="mb-6" style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                    Select which character you want to play in this conversation.
                                </p>
                                
                                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center">
                                    {availableRoles.map(role => (
                                        <button
                                            key={role}
                                            onClick={() => handleStartConversation(role)}
                                            className="flex-1 py-3 px-4 border font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
                                            style={{
                                                fontSize: '12px',
                                                borderColor: 'var(--rule)',
                                                background: 'white',
                                                color: 'var(--fg)',
                                                borderRadius: 0
                                            }}
                                        >
                                            Practice as {role}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handleStartConversation('read')}
                                        className="flex-1 py-3 px-4 border font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
                                        style={{
                                            fontSize: '12px',
                                            borderColor: 'var(--accent)',
                                            background: 'rgba(136,0,0,0.05)',
                                            color: 'var(--accent)',
                                            borderRadius: 0
                                        }}
                                    >
                                        Study Mode
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Active Practice Interface
                            <div className="flex-1 flex flex-col min-h-0 bg-stone-50">
                                
                                {/* Info Banner */}
                                <div className="px-5 py-2 border-b bg-white flex items-center justify-between" style={{ borderColor: 'var(--rule)' }}>
                                    <div className="flex items-center gap-4">
                                        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                                            Role: <strong style={{ color: 'var(--fg)' }}>{userRole === 'read' ? 'Study Mode' : userRole}</strong>
                                        </span>
                                        <span className="w-px h-3" style={{ background: 'var(--rule)' }} />
                                        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                                            Progress: <strong style={{ color: 'var(--fg)' }}>{currentIndex} / {turns.length}</strong>
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleRestart}
                                        className="text-xs uppercase font-bold underline transition-opacity hover:opacity-60"
                                        style={{ color: 'var(--accent)' }}
                                    >
                                        Restart
                                    </button>
                                </div>

                                {/* Chat Logs */}
                                <div 
                                    ref={chatContainerRef}
                                    className="flex-1 overflow-y-auto p-5 space-y-4"
                                >
                                    {chatHistory.map((item, idx) => {
                                        const alignRight = item.isUser;
                                        return (
                                            <div 
                                                key={idx}
                                                className={`flex flex-col ${alignRight ? 'items-end' : 'items-start'} space-y-1`}
                                            >
                                                {/* Speaker Name label */}
                                                <span 
                                                    className="uppercase tracking-wider font-semibold" 
                                                    style={{ fontSize: '9px', color: 'var(--muted)' }}
                                                >
                                                    {alignRight ? item.englishSpeaker : `${item.hindiSpeaker} (${item.englishSpeaker})`}
                                                </span>
                                                
                                                {/* Chat Bubble Card (Swiss Style) */}
                                                <div 
                                                    className="p-3.5 border max-w-md w-full"
                                                    style={{
                                                        borderRadius: 0,
                                                        borderColor: alignRight ? 'var(--accent)' : 'var(--rule)',
                                                        background: alignRight ? 'rgba(136,0,0,0.03)' : 'white',
                                                    }}
                                                >
                                                    {/* Hindi Text */}
                                                    <p className="font-bold leading-relaxed" style={{ fontSize: '17px', color: 'var(--fg)' }}>
                                                        {item.hindiText}
                                                    </p>
                                                    
                                                    {/* Transliteration */}
                                                    <p className="font-mono mt-1" style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                                        {item.translitText}
                                                    </p>
                                                    
                                                    {/* Divider */}
                                                    <div className="h-px w-full my-2" style={{ background: 'var(--rule)' }} />
                                                    
                                                    {/* Meaning */}
                                                    <p style={{ fontSize: '13px', color: 'var(--fg)' }}>
                                                        {item.meaningText}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Typing Simulator indicator */}
                                    {isTyping && (
                                        <div className="flex flex-col items-start space-y-1">
                                            <span className="uppercase tracking-wider font-semibold" style={{ fontSize: '9px', color: 'var(--muted)' }}>
                                                Typing...
                                            </span>
                                            <div className="py-2.5 px-4 border bg-white flex items-center gap-1.5" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messageEndRef} />
                                </div>

                                {/* Pinned Control Panel */}
                                <div className="border-t bg-white p-5 flex-shrink-0" style={{ borderColor: 'var(--rule)' }}>
                                    {currentIndex >= turns.length ? (
                                        // End of conversation
                                        <div className="text-center py-3">
                                            <p className="font-bold text-[#4A7C59] mb-2" style={{ fontSize: '15px' }}>✓ Conversation Complete!</p>
                                            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>You've successfully finished practicing this dialogue thread.</p>
                                            <button
                                                onClick={handleRestart}
                                                className="py-2.5 px-6 border font-bold uppercase tracking-wider transition-opacity hover:opacity-85"
                                                style={{ fontSize: '11px', borderColor: 'var(--accent)', background: 'var(--accent)', color: 'white', borderRadius: 0 }}
                                            >
                                                Practice Again
                                            </button>
                                        </div>
                                    ) : userRole === 'read' ? (
                                        // Read Mode panel
                                        <div className="flex items-center justify-between">
                                            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                                Read dialogue card: <strong style={{ color: 'var(--fg)' }}>{turns[currentIndex]?.englishSpeaker}</strong>
                                            </p>
                                            <button
                                                onClick={handleReadModeStep}
                                                className="py-2.5 px-5 font-bold uppercase tracking-wider flex items-center gap-1.5 transition-opacity hover:opacity-80"
                                                style={{ fontSize: '11px', background: 'var(--fg)', color: 'white', border: 'none', borderRadius: 0 }}
                                            >
                                                <span>Next Turn</span>
                                                <ArrowRight size={13} />
                                            </button>
                                        </div>
                                    ) : turns[currentIndex]?.englishSpeaker !== userRole ? (
                                        // Computer's turn in progress
                                        <div className="flex items-center justify-between text-stone-500" style={{ fontSize: '13px' }}>
                                            <p>Waiting for {turns[currentIndex]?.englishSpeaker} to respond...</p>
                                            <RefreshCw className="animate-spin" size={14} />
                                        </div>
                                    ) : (
                                        // User's turn practice panel
                                        <div className="space-y-4">
                                            
                                            {/* Turn Prompt */}
                                            <div className="bg-stone-50 border-l-2 p-3" style={{ borderColor: 'var(--accent)' }}>
                                                <span className="uppercase tracking-wider font-semibold" style={{ fontSize: '9px', color: 'var(--muted)' }}>
                                                    Your Prompt ({userRole})
                                                </span>
                                                <p className="font-medium mt-0.5" style={{ fontSize: '14px', color: 'var(--fg)' }}>
                                                    Translate: "{turns[currentIndex]?.meaningText}"
                                                </p>
                                            </div>

                                            {/* Choice Mode vs Type Mode Toggle */}
                                            <div className="flex items-center gap-4 border-b pb-2" style={{ borderColor: 'var(--rule)' }}>
                                                <button
                                                    onClick={() => { setInputMode('choice'); setFeedback(null); }}
                                                    className="transition-colors"
                                                    style={{
                                                        fontSize: '11px',
                                                        fontWeight: inputMode === 'choice' ? '700' : '400',
                                                        color: inputMode === 'choice' ? 'var(--accent)' : 'var(--muted)',
                                                        letterSpacing: '0.04em'
                                                    }}
                                                >
                                                    MULTIPLE CHOICE
                                                </button>
                                                <button
                                                    onClick={() => { setInputMode('type'); setFeedback(null); }}
                                                    className="transition-colors"
                                                    style={{
                                                        fontSize: '11px',
                                                        fontWeight: inputMode === 'type' ? '700' : '400',
                                                        color: inputMode === 'type' ? 'var(--accent)' : 'var(--muted)',
                                                        letterSpacing: '0.04em'
                                                    }}
                                                >
                                                    TYPE TRANSLITERATION
                                                </button>
                                            </div>

                                            {!feedback ? (
                                                inputMode === 'choice' ? (
                                                    // Multiple choice options list
                                                    <div className="flex flex-col gap-2">
                                                        {choices.map((choice, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => handleChoiceSubmit(choice, idx)}
                                                                className="w-full text-left py-3 px-4 border transition-colors hover:bg-stone-50"
                                                                style={{
                                                                    fontSize: '14px',
                                                                    borderColor: 'var(--rule)',
                                                                    background: 'white',
                                                                    color: 'var(--fg)',
                                                                    borderRadius: 0
                                                                }}
                                                            >
                                                                {choice}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    // Active recalling / text typing
                                                    <form onSubmit={handleTextSubmit} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={userInput}
                                                            onChange={(e) => setUserInput(e.target.value)}
                                                            placeholder="Type English transliteration..."
                                                            className="flex-1 px-4 py-3 border outline-none font-mono"
                                                            style={{
                                                                fontSize: '14px',
                                                                borderColor: 'var(--rule)',
                                                                borderRadius: 0,
                                                                background: 'white'
                                                            }}
                                                            autoFocus
                                                        />
                                                        <button
                                                            type="submit"
                                                            className="px-6 py-3 font-bold uppercase tracking-wider transition-opacity hover:opacity-85 flex items-center justify-center"
                                                            style={{ fontSize: '11px', background: 'var(--fg)', color: 'white', border: 'none', borderRadius: 0 }}
                                                        >
                                                            <Send size={14} />
                                                        </button>
                                                    </form>
                                                )
                                            ) : (
                                                // Answer Validation Panel
                                                <div className="space-y-3">
                                                    <div 
                                                        className="border-l-2 p-3 flex items-start gap-3"
                                                        style={{
                                                            borderColor: feedback.success ? '#4A7C59' : 'var(--accent)',
                                                            background: feedback.success ? '#F0FAF3' : 'rgba(136,0,0,0.02)'
                                                        }}
                                                    >
                                                        <div className="pt-0.5">
                                                            {feedback.success ? (
                                                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#4A7C59] text-white">
                                                                    <Check size={12} />
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#880000] text-white">
                                                                    <AlertTriangle size={12} />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold" style={{ fontSize: '13px', color: feedback.success ? '#2D5E40' : 'var(--accent)' }}>
                                                                {feedback.success ? '✓ Correct Answer' : '✗ Incorrect Reply'}
                                                            </p>
                                                            
                                                            <div className="mt-2 space-y-1">
                                                                <p className="font-bold" style={{ fontSize: '15px' }}>{feedback.correctText}</p>
                                                                <p className="font-mono" style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                                                    Translit: {feedback.correctTranslit}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <button
                                                        onClick={handleNextTurn}
                                                        className="w-full py-3 font-bold uppercase tracking-widest transition-opacity hover:opacity-80 flex items-center justify-center gap-1.5"
                                                        style={{ fontSize: '11px', background: 'var(--fg)', color: 'white', border: 'none', borderRadius: 0 }}
                                                    >
                                                        <span>Send Response</span>
                                                        <ArrowRight size={13} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ConversationPage;
