import React, { useState } from 'react';
import { X, Trophy, TrendingUp, Clock, MapPin, BookOpen, Calendar, Award } from 'lucide-react';
import { getStorage, StorageKeys } from '../utils/storage';

const Dashboard = ({ statistics, progress, onClose, currentMonth, allMonthsData }) => {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };
    const savedWords = getStorage(StorageKeys.VOCABULARY, []);
    
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const getTopCountries = () => {
        if (!statistics?.countries) return [];
        return Object.entries(statistics.countries)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    };

    const getMonthProgress = () => {
        if (!progress?.monthProgress) return 0;
        const monthKey = `month-${currentMonth}`;
        const monthData = progress.monthProgress[monthKey];
        if (!monthData) return 0;
        return Math.round((monthData.completed.length / 30) * 100);
    };

    const getBadgeName = (badge) => {
        const badges = {
            '7-day-streak': '7 Day Streak',
            '30-day-streak': '30 Day Streak',
            'perfect-pronunciation': 'Perfect Pronunciation'
        };
        return badges[badge] || badge;
    };

    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/50 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                onClick={handleClose}
            />
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col">
                    <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10 rounded-t-2xl flex-shrink-0">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="text-[#880000]" size={28} />
                            Your Progress Dashboard
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1 rounded-b-2xl">
                    {/* Statistics Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <BookOpen className="text-blue-600" size={24} />
                                <h3 className="text-sm font-semibold text-slate-600 uppercase">Words Read</h3>
                            </div>
                            <p className="text-3xl font-bold text-blue-900">
                                {statistics?.totalWordsRead?.toLocaleString() || 0}
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="text-green-600" size={24} />
                                <h3 className="text-sm font-semibold text-slate-600 uppercase">Time Practiced</h3>
                            </div>
                            <p className="text-3xl font-bold text-green-900">
                                {formatTime(statistics?.totalTimePracticed || 0)}
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Trophy className="text-purple-600" size={24} />
                                <h3 className="text-sm font-semibold text-slate-600 uppercase">Sessions</h3>
                            </div>
                            <p className="text-3xl font-bold text-purple-900">
                                {statistics?.practiceSessions || 0}
                            </p>
                        </div>
                    </div>

                    {/* Streak & Badges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Calendar className="text-[#880000]" size={20} />
                                Streak
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-slate-600 mb-1">Current Streak</p>
                                    <p className="text-4xl font-bold text-[#880000]">
                                        {progress?.currentStreak || 0} days
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600 mb-1">Longest Streak</p>
                                    <p className="text-2xl font-semibold text-slate-700">
                                        {progress?.longestStreak || 0} days
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Award className="text-[#880000]" size={20} />
                                Badges
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {progress?.badges && progress.badges.length > 0 ? (
                                    progress.badges.map((badge, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1.5 bg-[#880000] text-white rounded-full text-sm font-semibold"
                                        >
                                            {getBadgeName(badge)}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-slate-500 text-sm">No badges yet. Keep practicing!</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Month Progress */}
                    <div className="bg-slate-50 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="text-[#880000]" size={20} />
                            Month {currentMonth} Progress
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Completion</span>
                                <span className="text-lg font-bold text-[#880000]">{getMonthProgress()}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-4">
                                <div
                                    className="bg-[#880000] h-4 rounded-full transition-all duration-500"
                                    style={{ width: `${getMonthProgress()}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                {progress?.monthProgress?.[`month-${currentMonth}`]?.completed?.length || 0} of 30 days completed
                            </p>
                        </div>
                    </div>

                    {/* Top Countries */}
                    {getTopCountries().length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <MapPin className="text-[#880000]" size={20} />
                                Most Practiced Countries
                            </h3>
                            <div className="space-y-2">
                                {getTopCountries().map(([country, count], idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className="text-slate-700 font-medium">{country}</span>
                                        <span className="text-slate-600">{count} {count === 1 ? 'time' : 'times'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Vocabulary Stats */}
                    <div className="bg-slate-50 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <BookOpen className="text-[#880000]" size={20} />
                            Vocabulary
                        </h3>
                        <p className="text-2xl font-bold text-[#880000]">
                            {savedWords.length} words saved
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                            Keep clicking on difficult words to build your vocabulary!
                        </p>
                    </div>
                </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;

