import React, { useState, useEffect } from 'react';
import { X, Type, CheckCircle, RefreshCw, Clipboard } from 'lucide-react';

const TypeToReveal = ({ onClose }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [pastedText, setPastedText] = useState('');
    const [words, setWords] = useState([]);
    const [userInputs, setUserInputs] = useState({});

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleTextPaste = (e) => {
        const text = e.target.value;
        setPastedText(text);

        // Split text into words, removing line breaks and extra spaces
        const cleanedText = text.replace(/\r?\n|\r/g, ' ').trim();
        const wordArray = cleanedText.split(/\s+/).filter(word => word.length > 0);

        setWords(wordArray);

        // Initialize inputs for each word
        const inputs = {};
        wordArray.forEach((word, index) => {
            inputs[index] = '';
        });
        setUserInputs(inputs);
    };

    const handleInputChange = (index, value) => {
        setUserInputs(prev => ({
            ...prev,
            [index]: value
        }));
    };

    const normalizeText = (text) => {
        // Normalize text for comparison (case-insensitive)
        return text.toLowerCase().trim();
    };

    const isCorrect = (index) => {
        if (!userInputs[index]) return false;
        // For now, we're just checking if something is typed
        // In a real implementation, you would compare against actual transliterations
        return userInputs[index].trim().length > 0;
    };

    const handleReset = () => {
        setPastedText('');
        setWords([]);
        setUserInputs({});
    };

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const cleanedText = text.replace(/\r?\n|\r/g, ' ').trim();
            const wordArray = cleanedText.split(/\s+/).filter(word => word.length > 0);

            setPastedText(text);
            setWords(wordArray);

            const inputs = {};
            wordArray.forEach((word, index) => {
                inputs[index] = '';
            });
            setUserInputs(inputs);
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/50 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                onClick={handleClose}
            />
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full pointer-events-auto overflow-hidden max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10 rounded-t-2xl flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <Type className="text-[#880000]" size={24} />
                            <h2 className="text-xl font-bold text-slate-800">Type to Reveal</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {words.length === 0 ? (
                            <div className="space-y-4">
                                <div className="text-center py-8">
                                    <Type className="mx-auto text-[#880000] mb-4" size={64} />
                                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Paste Your Hindi Text</h3>
                                    <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                                        Paste Hindi text below and practice typing the transliteration.
                                        Line breaks will be automatically removed.
                                    </p>
                                </div>

                                <div className="max-w-2xl mx-auto">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Hindi Text
                                    </label>
                                    <textarea
                                        value={pastedText}
                                        onChange={handleTextPaste}
                                        placeholder="Paste your Hindi paragraph here...&#10;&#10;Example:&#10;समझना&#10;सुनना&#10;बोलना"
                                        className="w-full h-48 p-4 border-2 border-slate-200 rounded-xl focus:border-[#880000] focus:ring-2 focus:ring-[#880000]/20 outline-none transition-all text-lg font-sans resize-none"
                                    />

                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={handlePasteFromClipboard}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-semibold text-sm"
                                        >
                                            <Clipboard size={16} />
                                            Paste from Clipboard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="text-green-500" size={20} />
                                        <span className="text-sm font-semibold text-slate-700">
                                            {Object.values(userInputs).filter(v => v.trim().length > 0).length} / {words.length} typed
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-semibold text-sm"
                                    >
                                        <RefreshCw size={16} />
                                        Reset
                                    </button>
                                </div>

                                {/* Word Cards Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {words.map((word, index) => {
                                        const hasInput = userInputs[index]?.trim().length > 0;

                                        return (
                                            <div
                                                key={index}
                                                className={`rounded-xl border-2 transition-all duration-300 ${hasInput
                                                        ? 'border-[#880000] bg-[#880000]/5 shadow-md'
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className="p-4 space-y-3">
                                                    {/* Hindi Word */}
                                                    <div className="text-center">
                                                        <p className={`text-3xl font-bold transition-colors duration-300 ${hasInput ? 'text-[#880000]' : 'text-slate-400'
                                                            }`}>
                                                            {word}
                                                        </p>
                                                    </div>

                                                    {/* Input Field */}
                                                    <div>
                                                        <input
                                                            type="text"
                                                            value={userInputs[index] || ''}
                                                            onChange={(e) => handleInputChange(index, e.target.value)}
                                                            placeholder="Type transliteration..."
                                                            className={`w-full px-3 py-2 border-2 rounded-lg outline-none transition-all text-center font-medium ${hasInput
                                                                    ? 'border-[#880000] bg-white text-[#880000] font-semibold'
                                                                    : 'border-slate-200 focus:border-[#880000] text-slate-700'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default TypeToReveal;
