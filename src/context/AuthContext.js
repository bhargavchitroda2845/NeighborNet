import React, { createContext, useState, useEffect, useCallback } from 'react';
import { MEMBER_LOGIN_URL, MEMBER_PROFILE_API_URL } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [member, setMember] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user was logged in ONLY if sessionStorage indicates they were
    // This allows refresh to keep login, but closing tab clears it
    useEffect(() => {
        const checkAuthStatus = async () => {
            // Only check auth if user was previously logged in this session
            const wasLoggedIn = sessionStorage.getItem('memberSessionActive');

            console.log('=== AuthContext checkAuthStatus called ===');
            console.log('wasLoggedIn from sessionStorage:', wasLoggedIn);

            if (!wasLoggedIn) {
                console.log('No session found, skipping profile fetch');
                setIsLoading(false);
                return;
            }

            try {
                console.log('Fetching profile from:', MEMBER_PROFILE_API_URL);
                const response = await fetch(MEMBER_PROFILE_API_URL, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                console.log('Profile API response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('Profile API data received:', data);
                    console.log('Member property:', data.member);
                    setMember(data);
                    console.log('Member state set to:', data);
                    setError(null);
                } else {
                    console.error('Profile API failed with status:', response.status);
                    const errorText = await response.text();
                    console.error('Error response:', errorText);
                    setMember(null);
                    sessionStorage.removeItem('memberSessionActive');
                }
            } catch (err) {
                console.error('Auth check error:', err);
                setMember(null);
                sessionStorage.removeItem('memberSessionActive');
            } finally {
                setIsLoading(false);
                console.log('=== AuthContext checkAuthStatus finished ===');
            }
        };

        checkAuthStatus();
    }, []);

    const login = useCallback(async (username, password) => {
        setIsLoading(true);
        setError(null);

        try {
            // Step 1: Login with form data
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const loginResponse = await fetch(MEMBER_LOGIN_URL, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            // Read raw response and try to parse JSON (fail-safe)
            let loginData = null;
            let rawText = null;
            try {
                rawText = await loginResponse.text();
                console.log('Login raw response text:', rawText);
                loginData = rawText ? JSON.parse(rawText) : {};
            } catch (parseErr) {
                console.error('Failed to parse login response as JSON', parseErr);
                // fallback: build a minimal object so caller can see status/message
                loginData = { status: loginResponse.ok ? 'success' : 'error', message: rawText || loginResponse.statusText };
            }
            console.log('Login response (parsed):', loginData);

            if (loginData.status === 'success') {
                // Use profile data from login response directly (no need for second API call)
                console.log('Login successful, using profile from login response:', loginData);
                setMember(loginData);
                // Mark session as active so refresh keeps user logged in
                sessionStorage.setItem('memberSessionActive', 'true');
                return { success: true, data: loginData, message: loginData.message || 'Logged in' };
            } else {
                setError(loginData.message || 'Login failed');
                return { success: false, message: loginData.message || 'Login failed' };
            }
        } catch (err) {
            const errorMessage = err.message || 'An error occurred during login';
            console.error('Login error:', err);
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await fetch(MEMBER_LOGIN_URL.replace('/member/login/', '/member/logout/'), {
                method: 'POST',
                credentials: 'include',
            });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setMember(null);
            // Clear session flag when user logs out
            sessionStorage.removeItem('memberSessionActive');
            setIsLoading(false);
        }
    }, []);

    const value = {
        member,
        isLoading,
        error,
        login,
        logout,
        isAuthenticated: !!member,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
