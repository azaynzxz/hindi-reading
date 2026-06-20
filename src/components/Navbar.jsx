import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X, Globe } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';

const Navbar = ({
    onShowDashboard,
    onShowFlashcards,
    extraMobileContent,
    customMobileToggle
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false);
    const [apiServerRunning, setApiServerRunning] = useState(false);

    // Check if API server is running (shared status logic)
    useEffect(() => {
        const checkAPIServer = async () => {
            if (document.visibilityState !== 'visible') return;
            try {
                const response = await fetch(`${API_BASE_URL}/health`);
                const data = await response.json();
                if (data.status === 'OK') {
                    setApiServerRunning(true);
                }
            } catch (error) {
                setApiServerRunning(false);
            }
        };

        checkAPIServer();
        const interval = setInterval(checkAPIServer, 5000);
        document.addEventListener('visibilitychange', checkAPIServer);
        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', checkAPIServer);
        };
    }, []);

    const closeMobileMenu = () => {
        setIsMobileMenuClosing(true);
        setTimeout(() => {
            setIsMobileMenuOpen(false);
            setIsMobileMenuClosing(false);
        }, 300);
    };

    const isPathActive = (paths) => {
        return paths.some(path => {
            if (path === '/') {
                return location.pathname === '/' || location.pathname.match(/^\/m\d+-day\d+$/) || location.pathname.match(/^\/\d+-\d+$/) || location.pathname.match(/\/month-\d+-day-\d+/);
            }
            return location.pathname === path;
        });
    };

    const handleDashboardClick = () => {
        closeMobileMenu();
        if (isPathActive(['/'])) {
            if (onShowDashboard) onShowDashboard();
        } else {
            navigate('/?show=dashboard');
        }
    };

    const handleFlashcardsClick = () => {
        closeMobileMenu();
        if (isPathActive(['/'])) {
            if (onShowFlashcards) onShowFlashcards();
        } else {
            navigate('/?show=flashcards');
        }
    };

    const handleNavigation = (path) => {
        closeMobileMenu();
        navigate(path);
    };

    const navItems = [
        { label: 'Reading', path: '/', activePaths: ['/'] },
        { label: 'Vocabulary', path: '/hindi-practice', activePaths: ['/hindi-practice'] },
        { label: 'Type Practice', path: '/type-to-reveal', activePaths: ['/type-to-reveal'] },
        { label: 'Conversation', path: '/hindi-conversation', activePaths: ['/hindi-conversation'] },
    ];

    return (
        <>
            <nav className="w-full bg-white border-b flex-shrink-0 z-20 fixed top-0 left-0 right-0" style={{ borderColor: 'var(--rule)' }}>
                <div className="w-full max-w-6xl mx-auto px-6">
                    <div className="h-12 flex items-center justify-between">
                        {/* Wordmark */}
                        <div 
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80" 
                            style={{ color: 'var(--accent)' }}
                        >
                            <BookOpen size={18} />
                            <span className="font-bold uppercase tracking-widest" style={{ fontSize: '12px', color: 'var(--fg)' }}>HINDI READING DAILY</span>
                        </div>

                        {/* Nav links (Desktop) */}
                        <div className="hidden lg:flex items-center gap-6">
                            {navItems.map(item => (
                                <button
                                    key={item.label}
                                    onClick={() => handleNavigation(item.path)}
                                    className="uppercase font-medium transition-opacity hover:opacity-60"
                                    style={{ 
                                        fontSize: '11px', 
                                        letterSpacing: '0.08em', 
                                        color: isPathActive(item.activePaths) ? 'var(--accent)' : 'var(--muted)',
                                        fontWeight: isPathActive(item.activePaths) ? '700' : '500'
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                            
                            <button
                                onClick={handleDashboardClick}
                                className="uppercase font-medium transition-opacity hover:opacity-60"
                                style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--muted)' }}
                            >
                                Dashboard
                            </button>

                            <button
                                onClick={handleFlashcardsClick}
                                className="uppercase font-medium transition-opacity hover:opacity-60"
                                style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--muted)' }}
                            >
                                Flashcards
                            </button>

                            {/* API status */}
                            <span className="flex items-center gap-1.5 border-l pl-4" style={{ borderColor: 'var(--rule)', fontSize: '11px', letterSpacing: '0.08em', color: apiServerRunning ? '#4A7C59' : 'var(--muted)' }}>
                                <Globe size={11} />
                                <span className="uppercase font-medium">{apiServerRunning ? 'API' : 'DB'}</span>
                            </span>
                        </div>

                        {/* Mobile Controls (Page Specific + Hamburger) */}
                        <div className="flex lg:hidden items-center gap-3">
                            {/* Render custom page specific mobile toggle button if passed */}
                            {customMobileToggle}

                            {/* Hamburger Menu Icon */}
                            <button
                                onClick={() => {
                                    if (isMobileMenuOpen) {
                                        closeMobileMenu();
                                    } else {
                                        setIsMobileMenuOpen(true);
                                    }
                                }}
                                className="transition-opacity hover:opacity-60"
                                style={{ color: 'var(--fg)' }}
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation Drawer / Bottom Sheet */}
            {isMobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className={`fixed inset-0 bg-black z-30 lg:hidden ${isMobileMenuClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
                        onClick={closeMobileMenu}
                    />

                    {/* Mobile Drawer */}
                    <div 
                        className={`fixed bottom-0 left-0 right-0 bg-white border-t z-40 lg:hidden max-h-[85vh] overflow-y-auto ${isMobileMenuClosing ? 'animate-bottom-sheet-out' : 'animate-bottom-sheet-in'}`} 
                        style={{ borderColor: 'var(--rule)', borderRadius: 0 }}
                    >
                        <div className="px-6 py-6">
                            {/* Close Button */}
                            <div className="flex justify-between items-center mb-6 border-b pb-3" style={{ borderColor: 'var(--rule)' }}>
                                <h2 className="uppercase font-bold tracking-widest text-xs" style={{ color: 'var(--fg)' }}>Navigation Menu</h2>
                                <button
                                    onClick={closeMobileMenu}
                                    className="p-1 text-slate-400 hover:text-slate-600 transition-opacity"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Navigation Links */}
                            <div className="grid grid-cols-2 gap-2 mb-6">
                                {navItems.map(item => (
                                    <button
                                        key={item.label}
                                        onClick={() => handleNavigation(item.path)}
                                        className="flex items-center justify-center px-3 py-2.5 font-semibold text-xs uppercase transition-all"
                                        style={{ 
                                            borderRadius: 0, 
                                            letterSpacing: '0.06em',
                                            background: isPathActive(item.activePaths) ? 'var(--accent)' : '#F5F5F5', 
                                            color: isPathActive(item.activePaths) ? 'white' : 'var(--fg)'
                                        }}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                                <button
                                    onClick={handleDashboardClick}
                                    className="flex items-center justify-center px-3 py-2.5 bg-[#F5F5F5] text-slate-800 font-semibold text-xs uppercase transition-all hover:bg-slate-200"
                                    style={{ borderRadius: 0, letterSpacing: '0.06em' }}
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={handleFlashcardsClick}
                                    className="flex items-center justify-center px-3 py-2.5 bg-[#F5F5F5] text-slate-800 font-semibold text-xs uppercase transition-all hover:bg-slate-200"
                                    style={{ borderRadius: 0, letterSpacing: '0.06em' }}
                                >
                                    Flashcards
                                </button>
                            </div>

                            {/* Extra Mobile Content (Day Selector, etc. on Home Page) */}
                            {extraMobileContent && (
                                <div className="border-t pt-4" style={{ borderColor: 'var(--rule)' }}>
                                    {extraMobileContent}
                                </div>
                            )}

                            {/* API / DB status display */}
                            <div className="flex justify-center items-center gap-1.5 mt-6 text-xs text-slate-400">
                                <Globe size={12} />
                                <span>API Status: </span>
                                <span className="font-bold" style={{ color: apiServerRunning ? '#4A7C59' : 'var(--muted)' }}>
                                    {apiServerRunning ? 'ONLINE (TRANS)' : 'LOCAL (DB)'}
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default Navbar;
