import React, { createContext, useState, useContext, useEffect } from 'react';
import { getToken, getUser, setAuth as setAuthStorage, logout as logoutStorage } from '../services/auth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getToken();
        const userData = getUser();
        
        if (token && userData) {
            setUser(userData);
        }
        setLoading(false);
    }, []);

    const login = (token, userData) => {
        setAuthStorage(token, userData);
        setUser(userData);
    };

    const logout = () => {
        logoutStorage();
        setUser(null);
        window.location.href = '/login';
    };

    const updateUser = (userData) => {
        const updatedUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};