import React, { createContext, useState, useEffect, useCallback } from 'react';
import { MEMBER_LOGIN_URL, MEMBER_PROFILE_API_URL } from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [member, setMember] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Removed automatic auth check on mount - users must explicitly log in
    // This prevents auto-login from persistent Django sessions
    useEffect(() => {
        setIsLoading(false);
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
