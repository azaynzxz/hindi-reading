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
                const response = await fetch('/basic-practice.csv');
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
                    className={`fixed inset-0 bg-black/50 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                    onClick={handleClose}
                />
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 pointer-events-auto">
                        <div className="text-center py-8">
                            <p className="text-slate-600">Loading flashcards...</p>
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
                    className={`fixed inset-0 bg-black/50 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                    onClick={handleClose}
                />
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800">Hindi Flashcards</h2>
                            <button
                                onClick={handleClose}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="text-center py-8">
                            <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-600 mb-2">No flashcards found!</p>
                            <p className="text-sm text-slate-500">
                                Make sure the basic-practice.csv file exists.
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
                className={`fixed inset-0 bg-black/50 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                onClick={handleClose}
            />
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full pointer-events-auto overflow-hidden">
                    <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10 rounded-t-2xl">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-slate-800">Hindi Flashcards</h2>
                            <span className="text-xs bg-[#880000]/10 text-[#880000] px-3 py-1 rounded-full font-semibold">
                                {currentWord.source}
                            </span>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="mb-4 text-center">
                            <span className="text-sm text-slate-500">
                                {currentIndex + 1} of {words.length}
                            </span>
                        </div>

                        <div
                            className="bg-gradient-to-br from-[#880000] to-[#660000] rounded-2xl p-12 min-h-[320px] flex flex-col items-center justify-center cursor-pointer transform transition-transform hover:scale-[1.02] shadow-2xl"
                            onClick={() => setShowAnswer(!showAnswer)}
                        >
                            {!showAnswer ? (
                                <div className="text-center">
                                    <h3 className="text-6xl font-bold text-white mb-6">
                                        {currentWord.hindi}
                                    </h3>
                                    <p className="text-white/80 text-sm uppercase tracking-wider">Click to reveal answer</p>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <h3 className="text-5xl font-bold text-white mb-2">
                                        {currentWord.hindi}
                                    </h3>
                                    <div className="w-20 h-1 bg-white/30 mx-auto rounded-full"></div>
                                    <p className="text-white/90 text-3xl font-semibold italic">
                                        {currentWord.transliteration}
                                    </p>
                                    <p className="text-white/80 text-xl mt-4">
                                        {currentWord.meaning}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={handlePrev}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-semibold text-slate-700"
                            >
                                <ChevronLeft size={20} />
                                Previous
                            </button>

                            <button
                                onClick={handleShuffle}
                                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                title="Shuffle"
                            >
                                <RotateCw size={20} />
                            </button>

                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-4 py-2 bg-[#880000] hover:bg-[#770000] text-white rounded-lg transition-colors font-semibold"
                            >
                                Next
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HindiFlashcards;
