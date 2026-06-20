import React, { useState, useEffect } from 'react';
import { X, RotateCw, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

const HindiFlashcards = ({ onClose }) => {
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    useEffect(() => {
        // Load and parse CSV file
        const loadCSV = async () => {
            try {
                const response = await fetch('/hindi-practice.csv');
                const text = await response.text();

                // Parse CSV
                const lines = text.split('\n').filter(line => line.trim());
                const headers = lines[0].split(',');

                const parsedWords = lines.slice(1).map(line => {
                    // Handle CSV with potential commas in content
                    const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
                    const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());

                    return {
                        source: cleanValues[0],
                        hindi: cleanValues[1],
                        transliteration: cleanValues[2],
                        meaning: cleanValues[3]
                    };
                }).filter(word => word.hindi && word.transliteration);

                setWords(parsedWords);
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading CSV:', error);
                setIsLoading(false);
            }
        };

        loadCSV();
    }, []);

    const handleNext = () => {
        setShowAnswer(false);
        setCurrentIndex((prev) => (prev + 1) % words.length);
    };

    const handlePrev = () => {
        setShowAnswer(false);
        setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
    };

    const handleShuffle = () => {
        setShowAnswer(false);
        setCurrentIndex(Math.floor(Math.random() * words.length));
    };

    if (isLoading) {
        return (
            <>
                <div
                    className={`fixed inset-0 bg-black/25 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                    onClick={handleClose}
                />
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                    <div className="bg-white border p-8 pointer-events-auto w-full max-w-md flex flex-col" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                        <div className="text-center py-8">
                            <p style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '500' }}>Loading flashcards...</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (words.length === 0) {
        return (
            <>
                <div
                    className={`fixed inset-0 bg-black/25 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                    onClick={handleClose}
                />
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                    <div className="bg-white border max-w-md w-full p-6 pointer-events-auto flex flex-col" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                        <div className="flex items-center justify-between mb-4 border-b pb-2" style={{ borderColor: 'var(--rule)' }}>
                            <h2 className="uppercase font-bold tracking-widest text-xs" style={{ color: 'var(--fg)' }}>Hindi Flashcards</h2>
                            <button
                                onClick={handleClose}
                                className="p-1 text-slate-400 hover:text-slate-600 transition-opacity"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="text-center py-8">
                            <BookOpen className="mx-auto text-slate-300 mb-4" size={40} />
                            <p className="font-bold mb-1" style={{ fontSize: '15px' }}>No flashcards found!</p>
                            <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
                                Make sure the hindi-practice.csv file exists.
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const currentWord = words[currentIndex];

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/25 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                onClick={handleClose}
            />
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                <div className="bg-white border max-w-2xl w-full pointer-events-auto flex flex-col" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                    <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10" style={{ borderColor: 'var(--rule)' }}>
                        <div className="flex items-center gap-4">
                            <h2 className="uppercase font-bold tracking-widest text-xs" style={{ color: 'var(--fg)' }}>Hindi Flashcards</h2>
                            <span 
                                className="text-[10px] border px-2 py-0.5 font-bold uppercase tracking-wider" 
                                style={{ borderColor: 'var(--accent)', color: 'var(--accent)', borderRadius: 0 }}
                            >
                                {currentWord.source}
                            </span>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-opacity"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="mb-4 text-center">
                            <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
                                {currentIndex + 1} of {words.length}
                            </span>
                        </div>

                        {/* Flat Swiss-design card panel */}
                        <div
                            className="border p-12 min-h-[300px] flex flex-col items-center justify-center cursor-pointer transition-colors"
                            style={{
                                borderColor: 'var(--rule)',
                                background: 'var(--bg)',
                                borderRadius: 0
                            }}
                            onClick={() => setShowAnswer(!showAnswer)}
                        >
                            {!showAnswer ? (
                                <div className="text-center">
                                    <h3 className="text-5xl font-bold mb-4" style={{ color: 'var(--fg)' }}>
                                        {currentWord.hindi}
                                    </h3>
                                    <p className="uppercase tracking-wider font-bold" style={{ fontSize: '10px', color: 'var(--muted)' }}>Click to reveal answer</p>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <h3 className="text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>
                                        {currentWord.hindi}
                                    </h3>
                                    <div className="w-12 h-0.5 mx-auto" style={{ background: 'var(--rule)' }}></div>
                                    <p className="font-mono text-2xl font-bold italic" style={{ color: 'var(--fg)' }}>
                                        {currentWord.transliteration}
                                    </p>
                                    <p className="text-lg" style={{ color: 'var(--muted)' }}>
                                        {currentWord.meaning}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Flat Swiss-design controls */}
                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={handlePrev}
                                className="flex items-center gap-1.5 px-3 py-2 border font-bold uppercase transition-opacity hover:opacity-75"
                                style={{ 
                                    borderColor: 'var(--rule)', 
                                    background: 'white', 
                                    color: 'var(--fg)', 
                                    borderRadius: 0, 
                                    fontSize: '11px', 
                                    letterSpacing: '0.06em' 
                                }}
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>

                            <button
                                onClick={handleShuffle}
                                className="p-2 border transition-opacity hover:opacity-75"
                                style={{ 
                                    borderColor: 'var(--rule)', 
                                    background: 'white', 
                                    color: 'var(--fg)', 
                                    borderRadius: 0 
                                }}
                                title="Shuffle"
                            >
                                <RotateCw size={16} />
                            </button>

                            <button
                                onClick={handleNext}
                                className="flex items-center gap-1.5 px-3 py-2 border font-bold uppercase transition-opacity hover:opacity-75 text-white"
                                style={{ 
                                    borderColor: 'var(--accent)', 
                                    background: 'var(--accent)', 
                                    borderRadius: 0, 
                                    fontSize: '11px', 
                                    letterSpacing: '0.06em' 
                                }}
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HindiFlashcards;
