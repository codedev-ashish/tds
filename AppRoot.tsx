import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TdsProvider, useTds } from './store';
import { PractitionerApp } from './components/PractitionerApp';
import { Landing } from './components/Landing';
import { AdminPanel } from './components/AdminPanel';

function AppContent() {
    const { currentUser, logout } = useTds();

    // Auto-logout on inactivity
    useEffect(() => {
        if (!currentUser) return;

        const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
        let timeoutId: NodeJS.Timeout;

        const handleActivity = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                // Determine if we are already safely logged out to avoid loops
                if (localStorage.getItem('tds_session')) {
                    console.log("User inactive for 15 minutes. Auto-logging out.");
                    logout();
                    alert("Session expired due to inactivity.");
                }
            }, TIMEOUT_MS);
        };

        // Listen for user activity
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, handleActivity));

        // Start initial timer
        handleActivity();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [currentUser, logout]);

    return (
        <Routes>
            <Route
                path="/"
                element={
                    currentUser ? (
                        <Navigate to={currentUser.role === 'admin' ? "/admin" : "/dashboard"} replace />
                    ) : (
                        <Landing />
                    )
                }
            />

            <Route
                path="/admin"
                element={
                    currentUser?.role === 'admin' ? (
                        <AdminPanel onLogout={logout} />
                    ) : (
                        <Navigate to="/" replace />
                    )
                }
            />

            <Route
                path="/dashboard/*"
                element={
                    currentUser && currentUser.role !== 'admin' ? (
                        <PractitionerApp onLogout={logout} user={currentUser} />
                    ) : (
                        <Navigate to="/" replace />
                    )
                }
            />

            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function AppRoot() {
    useEffect(() => {
        const applyTheme = () => {
            const savedAppearance = localStorage.getItem('user_appearance');
            if (savedAppearance) {
                const { theme } = JSON.parse(savedAppearance);
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        };

        // Apply on mount
        applyTheme();

        // Listen for changes
        window.addEventListener('theme-change', applyTheme);
        return () => window.removeEventListener('theme-change', applyTheme);
    }, []);

    return (
        <BrowserRouter>
            <TdsProvider>
                <AppContent />
            </TdsProvider>
        </BrowserRouter>
    );
}
