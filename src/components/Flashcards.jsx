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
                    className={`fixed inset-0 bg-black/40 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                    onClick={handleClose}
                />
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                    <div className="bg-white border max-w-md w-full p-6 pointer-events-auto overflow-hidden" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="uppercase font-bold tracking-widest" style={{ fontSize: '14px', color: 'var(--fg)' }}>Flashcards</h2>
                            <button
                                onClick={handleClose}
                                className="p-1 text-slate-400 hover:text-slate-600 transition-opacity hover:opacity-70"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="text-center py-8">
                            <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-800 font-bold mb-2 text-sm uppercase tracking-wider">No words in dictionary</p>
                            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
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
                className={`fixed inset-0 bg-black/40 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                onClick={handleClose}
            />
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                <div className="bg-white border max-w-2xl w-full pointer-events-auto overflow-hidden flex flex-col" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                    <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10" style={{ borderColor: 'var(--rule)' }}>
                        <div className="flex items-center gap-4">
                            <h2 className="uppercase font-bold tracking-widest" style={{ fontSize: '14px', color: 'var(--fg)' }}>Flashcards</h2>
                            <select
                                value={studyMode}
                                onChange={(e) => {
                                    setStudyMode(e.target.value);
                                    setCurrentIndex(0);
                                    setShowDefinition(false);
                                }}
                                className="px-3 py-1.5 border outline-none font-medium uppercase text-xs"
                                style={{ borderColor: 'var(--rule)', borderRadius: 0, letterSpacing: '0.05em' }}
                            >
                                <option value="all">All Words</option>
                                <option value="hard">Hard</option>
                                <option value="medium">Medium</option>
                                <option value="easy">Easy</option>
                            </select>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-opacity hover:opacity-70"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="mb-4 text-center">
                            <span className="uppercase font-bold tracking-wider text-[11px]" style={{ color: 'var(--muted)' }}>
                                {currentIndex + 1} of {filteredWords.length}
                            </span>
                        </div>

                        <div
                            className="perspective-1000 w-full cursor-pointer"
                            style={{ height: '300px' }}
                            onClick={() => setShowDefinition(!showDefinition)}
                        >
                            <div className={`relative w-full h-full transform-style-3d transition-all duration-500 ${showDefinition ? 'rotate-y-180' : ''}`}>
                                {/* Front */}
                                <div className="absolute inset-0 backface-hidden bg-white border flex flex-col items-center justify-center p-8"
                                    style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                                    <span className="absolute top-5 left-6 uppercase font-medium" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--muted)' }}>
                                        Word
                                    </span>
                                    <h3 className="font-bold text-center capitalize" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', color: 'var(--fg)' }}>
                                        {currentWord.word}
                                    </h3>
                                    <p className="absolute bottom-5 flex items-center gap-2 uppercase" style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'var(--muted)' }}>
                                        <RotateCw size={11} className="text-slate-400" /> Tap to flip
                                    </p>
                                </div>

                                {/* Back */}
                                <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8"
                                    style={{ background: 'var(--fg)', borderRadius: 0 }}>
                                    <span className="absolute top-5 left-6 uppercase font-medium" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)' }}>
                                        Definition
                                    </span>
                                    <div className="text-center space-y-4 max-w-md px-4">
                                        <p className="font-medium" style={{ fontSize: 'clamp(1rem, 3.5vw, 1.3rem)', color: 'white', lineHeight: '1.5' }}>
                                            {currentWord.definition?.meanings?.[0]?.definitions?.[0]?.definition || 
                                             'Definition not available'}
                                        </p>
                                        {currentWord.definition?.phonetic && (
                                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                                                [{currentWord.definition.phonetic}]
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={handlePrev}
                                className="flex items-center gap-1.5 px-4 py-2.5 transition-opacity hover:opacity-75 font-semibold uppercase text-xs"
                                style={{ border: '1px solid var(--rule)', color: 'var(--fg)', background: 'transparent', borderRadius: 0, letterSpacing: '0.06em' }}
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>

                            <button
                                onClick={() => {
                                    setShowDefinition(false);
                                    setCurrentIndex(Math.floor(Math.random() * filteredWords.length));
                                }}
                                className="p-2.5 transition-opacity hover:opacity-75"
                                style={{ border: '1px solid var(--rule)', color: 'var(--muted)', background: 'transparent', borderRadius: 0 }}
                                title="Shuffle"
                            >
                                <RotateCw size={16} />
                            </button>

                            <button
                                onClick={() => removeWord(currentWord.word)}
                                className="flex items-center gap-1.5 px-4 py-2.5 transition-opacity hover:opacity-75 font-semibold uppercase text-xs"
                                style={{ border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', borderRadius: 0, letterSpacing: '0.06em' }}
                            >
                                <XCircle size={16} />
                                Remove
                            </button>

                            <button
                                onClick={handleNext}
                                className="flex items-center gap-1.5 px-4 py-2.5 transition-opacity hover:opacity-85 font-semibold uppercase text-xs"
                                style={{ background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 0, letterSpacing: '0.06em' }}
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

export default Flashcards;

