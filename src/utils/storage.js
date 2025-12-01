// Local storage utilities for persistence

export const StorageKeys = {
    VOCABULARY: 'english_practice_vocabulary',
    STATISTICS: 'english_practice_statistics',
    PROGRESS: 'english_practice_progress',
    PRACTICE_SESSIONS: 'english_practice_sessions',
    PRACTICED_DAYS: 'english_practice_practiced_days',
    HINDI_PRACTICE_STATISTICS: 'hindi_practice_statistics',
    HINDI_PRACTICE_PROGRESS: 'hindi_practice_progress'
};

export const getStorage = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage for key ${key}:`, error);
        return defaultValue;
    }
};

export const setStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage for key ${key}:`, error);
    }
};

export const updateStorage = (key, updater) => {
    const current = getStorage(key, {});
    const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
    setStorage(key, updated);
    return updated;
};

