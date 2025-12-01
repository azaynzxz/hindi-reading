import React, { useState, useEffect } from 'react';
import { X, RotateCw, ChevronLeft, ChevronRight, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { getStorage, StorageKeys } from '../utils/storage';

const Flashcards = ({ onClose }) => {
    const [savedWords, setSavedWords] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showDefinition, setShowDefinition] = useState(false);
    const [studyMode, setStudyMode] = useState('all'); // 'all', 'hard', 'medium', 'easy'
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    useEffect(() => {
        const words = getStorage(StorageKeys.VOCABULARY, []);
        setSavedWords(words);
    }, []);

    const filteredWords = savedWords.filter(word => {
        if (studyMode === 'all') return true;
        return word.difficulty === studyMode;
    });

    const currentWord = filteredWords[currentIndex];

    const handleNext = () => {
        setShowDefinition(false);
        setCurrentIndex((prev) => (prev + 1) % filteredWords.length);
    };

    const handlePrev = () => {
        setShowDefinition(false);
        setCurrentIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
    };

    const removeWord = (word) => {
        const updated = savedWords.filter(w => w.word !== word);
        setSavedWords(updated);
        const storage = getStorage(StorageKeys.VOCABULARY, []);
        const updatedStorage = storage.filter(w => w.word !== word);
        localStorage.setItem(StorageKeys.VOCABULARY, JSON.stringify(updatedStorage));
        
        if (currentIndex >= filteredWords.length - 1) {
            setCurrentIndex(0);
        }
    };

    if (filteredWords.length === 0) {
        return (
            <>
                <div 
                    className={`fixed inset-0 bg-black/50 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                    onClick={handleClose}
                />
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800">Flashcards</h2>
                            <button
                                onClick={handleClose}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="text-center py-8">
                            <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-600 mb-2">No words in your dictionary yet!</p>
                            <p className="text-sm text-slate-500">
                                Click on difficult words while reading to add them to your vocabulary.
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

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
                            <h2 className="text-xl font-bold text-slate-800">Flashcards</h2>
                            <select
                                value={studyMode}
                                onChange={(e) => {
                                    setStudyMode(e.target.value);
                                    setCurrentIndex(0);
                                    setShowDefinition(false);
                                }}
                                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                            >
                                <option value="all">All Words</option>
                                <option value="hard">Hard</option>
                                <option value="medium">Medium</option>
                                <option value="easy">Easy</option>
                            </select>
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
                            {currentIndex + 1} of {filteredWords.length}
                        </span>
                    </div>

                    <div
                        className="bg-gradient-to-br from-[#880000] to-[#660000] rounded-2xl p-12 min-h-[300px] flex flex-col items-center justify-center cursor-pointer transform transition-transform hover:scale-[1.02]"
                        onClick={() => setShowDefinition(!showDefinition)}
                    >
                        {!showDefinition ? (
                            <div className="text-center">
                                <h3 className="text-4xl font-bold text-white mb-4 capitalize">
                                    {currentWord.word}
                                </h3>
                                <p className="text-white/80 text-sm">Click to reveal definition</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-white/90 text-lg mb-4">
                                    {currentWord.definition?.meanings?.[0]?.definitions?.[0]?.definition || 
                                     currentWord.definition?.meanings?.[0]?.definitions?.[0]?.definition || 
                                     'Definition not available'}
                                </p>
                                {currentWord.definition?.phonetic && (
                                    <p className="text-white/70 text-sm italic">{currentWord.definition.phonetic}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        <button
                            onClick={handlePrev}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={20} />
                            Previous
                        </button>

                        <button
                            onClick={() => {
                                setShowDefinition(false);
                                setCurrentIndex(Math.floor(Math.random() * filteredWords.length));
                            }}
                            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Shuffle"
                        >
                            <RotateCw size={20} />
                        </button>

                        <button
                            onClick={() => removeWord(currentWord.word)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                        >
                            <XCircle size={20} />
                            Remove
                        </button>

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-4 py-2 bg-[#880000] hover:bg-[#770000] text-white rounded-lg transition-colors"
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

export default Flashcards;

