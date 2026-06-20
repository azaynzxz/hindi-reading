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
                className={`fixed inset-0 bg-black/40 z-50 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                onClick={handleClose}
            />
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
                <div className="bg-white border max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto flex flex-col" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                    <div className="sticky top-0 bg-white border-b p-5 flex items-center justify-between z-10 flex-shrink-0" style={{ borderColor: 'var(--rule)' }}>
                        <h2 className="uppercase font-bold tracking-widest flex items-center gap-2" style={{ fontSize: '14px', color: 'var(--fg)' }}>
                            <TrendingUp className="text-[#880000]" size={18} />
                            Progress Dashboard
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-opacity hover:opacity-70"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        {/* Statistics Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="border p-6 bg-white" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="text-[#880000]" size={16} />
                                    <h3 className="uppercase font-bold tracking-wider" style={{ fontSize: '10px', color: 'var(--muted)' }}>Words Read</h3>
                                </div>
                                <p className="text-3xl font-bold font-mono text-slate-800">
                                    {statistics?.totalWordsRead?.toLocaleString() || 0}
                                </p>
                            </div>

                            <div className="border p-6 bg-white" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="text-[#880000]" size={16} />
                                    <h3 className="uppercase font-bold tracking-wider" style={{ fontSize: '10px', color: 'var(--muted)' }}>Time Practiced</h3>
                                </div>
                                <p className="text-3xl font-bold font-mono text-slate-800">
                                    {formatTime(statistics?.totalTimePracticed || 0)}
                                </p>
                            </div>

                            <div className="border p-6 bg-white" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy className="text-[#880000]" size={16} />
                                    <h3 className="uppercase font-bold tracking-wider" style={{ fontSize: '10px', color: 'var(--muted)' }}>Sessions</h3>
                                </div>
                                <p className="text-3xl font-bold font-mono text-slate-800">
                                    {statistics?.practiceSessions || 0}
                                </p>
                            </div>
                        </div>

                        {/* Streak & Badges */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border p-6 bg-white flex flex-col" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                                <h3 className="uppercase font-bold tracking-wider mb-4 flex items-center gap-2" style={{ fontSize: '11px', color: 'var(--fg)' }}>
                                    <Calendar className="text-[#880000]" size={15} />
                                    Streak
                                </h3>
                                <div className="space-y-4 flex-1">
                                    <div>
                                        <p className="uppercase font-bold tracking-wider mb-1" style={{ fontSize: '9px', color: 'var(--muted)' }}>Current Streak</p>
                                        <p className="text-4xl font-bold font-mono text-[#880000]">
                                            {progress?.currentStreak || 0} <span className="text-xs uppercase font-sans font-normal tracking-wide text-slate-500">days</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="uppercase font-bold tracking-wider mb-1" style={{ fontSize: '9px', color: 'var(--muted)' }}>Longest Streak</p>
                                        <p className="text-xl font-bold font-mono text-slate-700">
                                            {progress?.longestStreak || 0} <span className="text-xs uppercase font-sans font-normal tracking-wide text-slate-500">days</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border p-6 bg-white flex flex-col" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                                <h3 className="uppercase font-bold tracking-wider mb-4 flex items-center gap-2" style={{ fontSize: '11px', color: 'var(--fg)' }}>
                                    <Award className="text-[#880000]" size={15} />
                                    Badges
                                </h3>
                                <div className="flex flex-wrap gap-2 flex-1 items-start content-start">
                                    {progress?.badges && progress.badges.length > 0 ? (
                                        progress.badges.map((badge, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1.5 uppercase font-bold tracking-wider text-[10px]"
                                                style={{ border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent', borderRadius: 0 }}
                                            >
                                                {getBadgeName(badge)}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 text-xs italic">No badges yet. Keep practicing!</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Month Progress */}
                        <div className="border p-6 bg-white" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                            <h3 className="uppercase font-bold tracking-wider mb-4 flex items-center gap-2" style={{ fontSize: '11px', color: 'var(--fg)' }}>
                                <TrendingUp className="text-[#880000]" size={15} />
                                Month {currentMonth} Progress
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="uppercase font-bold tracking-wider" style={{ fontSize: '10px', color: 'var(--muted)' }}>Completion</span>
                                    <span className="text-lg font-bold font-mono text-[#880000]">{getMonthProgress()}%</span>
                                </div>
                                <div className="w-full h-2" style={{ background: 'var(--rule)' }}>
                                    <div
                                        className="h-2 transition-all duration-500"
                                        style={{ width: `${getMonthProgress()}%`, background: 'var(--accent)' }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500" style={{ fontSize: '11px' }}>
                                    {progress?.monthProgress?.[`month-${currentMonth}`]?.completed?.length || 0} of 30 days completed
                                </p>
                            </div>
                        </div>

                        {/* Top Countries */}
                        {getTopCountries().length > 0 && (
                            <div className="border p-6 bg-white" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                                <h3 className="uppercase font-bold tracking-wider mb-4 flex items-center gap-2" style={{ fontSize: '11px', color: 'var(--fg)' }}>
                                    <MapPin className="text-[#880000]" size={15} />
                                    Most Practiced Countries
                                </h3>
                                <div className="divide-y" style={{ borderColor: 'var(--rule)' }}>
                                    {getTopCountries().map(([country, count], idx) => (
                                        <div key={idx} className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0">
                                            <span className="text-slate-700 font-medium">{country}</span>
                                            <span className="text-slate-600 font-mono text-xs">{count} {count === 1 ? 'time' : 'times'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Vocabulary Stats */}
                        <div className="border p-6 bg-white" style={{ borderColor: 'var(--rule)', borderRadius: 0 }}>
                            <h3 className="uppercase font-bold tracking-wider mb-4 flex items-center gap-2" style={{ fontSize: '11px', color: 'var(--fg)' }}>
                                <BookOpen className="text-[#880000]" size={15} />
                                Vocabulary
                            </h3>
                            <p className="text-2xl font-bold font-mono text-[#880000]">
                                {savedWords.length} <span className="text-sm uppercase font-sans font-normal tracking-wide text-slate-500">words saved</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-2" style={{ lineHeight: '1.5' }}>
                                Keep clicking on difficult words while reading to build your personal dictionary.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;

