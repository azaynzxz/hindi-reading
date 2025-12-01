import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, ChevronLeft, ChevronRight, BookOpen, Languages, Type } from 'lucide-react';

const HindiPracticePage = () => {
    const navigate = useNavigate();
    const [words, setWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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

    const currentWord = words[currentIndex];

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
                            <Languages className="text-[#880000]" size={24} />
                            <span className="font-bold tracking-wider text-sm md:text-base uppercase">Hindi Flashcards</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('/type-to-reveal')}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[#880000] hover:bg-[#880000]/10 rounded-lg transition-colors text-sm font-semibold"
                                title="Type to Reveal"
                            >
                                <Type size={18} />
                                <span className="hidden md:inline">Type Practice</span>
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[#880000] hover:bg-[#880000]/10 rounded-lg transition-colors text-sm font-semibold"
                                title="Reading Practice"
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
                {isLoading ? (
                    <div className="text-center py-8">
                        <p className="text-slate-600">Loading flashcards...</p>
                    </div>
                ) : words.length === 0 ? (
                    <div className="text-center py-16 max-w-md">
                        <BookOpen className="mx-auto text-slate-300 mb-4" size={64} />
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">No Flashcards Found</h3>
                        <p className="text-slate-600">
                            Make sure the basic-practice.csv file exists in the public folder.
                        </p>
                    </div>
                ) : (
                    <div className="w-full max-w-4xl flex flex-col items-center">
                        {/* Header Info */}
                        <div className="w-full mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xs bg-[#880000]/10 text-[#880000] px-3 py-1.5 rounded-full font-semibold">
                                    {currentWord?.source}
                                </span>
                            </div>
                            <span className="text-sm text-slate-500 font-medium">
                                {currentIndex + 1} of {words.length}
                            </span>
                        </div>

                        {/* Flashcard */}
                        <div
                            className="w-full bg-gradient-to-br from-[#880000] to-[#660000] rounded-3xl p-12 md:p-16 min-h-[400px] flex flex-col items-center justify-center cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-xl"
                            onClick={() => setShowAnswer(!showAnswer)}
                        >
                            {!showAnswer ? (
                                <div className="text-center">
                                    <h3 className="text-6xl md:text-7xl font-bold text-white mb-6">
                                        {currentWord?.hindi}
                                    </h3>
                                    <p className="text-white/80 text-sm uppercase tracking-wider">Click to reveal answer</p>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <h3 className="text-5xl md:text-6xl font-bold text-white mb-2">
                                        {currentWord?.hindi}
                                    </h3>
                                    <div className="w-20 h-1 bg-white/30 mx-auto rounded-full"></div>
                                    <p className="text-white/90 text-3xl md:text-4xl font-semibold italic">
                                        {currentWord?.transliteration}
                                    </p>
                                    <p className="text-white/80 text-xl md:text-2xl mt-4">
                                        {currentWord?.meaning}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="w-full flex items-center justify-between mt-8">
                            <button
                                onClick={handlePrev}
                                className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-200 hover:border-[#880000] hover:bg-[#880000]/5 rounded-xl transition-all font-semibold text-slate-700 hover:text-[#880000] shadow-sm"
                            >
                                <ChevronLeft size={20} />
                                <span className="hidden sm:inline">Previous</span>
                            </button>

                            <button
                                onClick={handleShuffle}
                                className="p-3 bg-white border-2 border-slate-200 hover:border-[#880000] hover:bg-[#880000]/5 rounded-xl transition-all shadow-sm"
                                title="Shuffle"
                            >
                                <RotateCw size={20} className="text-slate-700 hover:text-[#880000]" />
                            </button>

                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-5 py-3 bg-[#880000] hover:bg-[#770000] text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HindiPracticePage;
