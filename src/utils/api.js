/**
 * Determines the API base URL based on the environment.
 * 
 * Priority:
 * 1. VITE_API_BASE_URL environment variable (if set)
 * 2. Current origin + /api (if running in a browser environment)
 * 3. http://localhost:3001/api (fallback for local development)
 */
export const getApiBaseUrl = () => {
    // 1. Check environment variable first
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }

    // 2. Use current origin in browser environment (production/preview)
    if (typeof window !== 'undefined' && window.location) {
        // If we are on localhost, we might still want to point to port 3001
        // unless we are proxying via Vite config.
        // Assuming standard Vite setup where frontend is 5173 and backend is 3001:
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3001/api';
        }

        // In production (Vercel, etc.), assume API is relative or proxied
        return `${window.location.origin}/api`;
    }

    // 3. Fallback
    return 'http://localhost:3001/api';
};

export const API_BASE_URL = getApiBaseUrl();
