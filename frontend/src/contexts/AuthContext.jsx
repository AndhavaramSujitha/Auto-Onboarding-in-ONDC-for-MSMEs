import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(authService.getToken());
    const [user, setUser] = useState(authService.getCurrentUser());
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const storedToken = authService.getToken();
        const storedUser = authService.getCurrentUser();
        setToken(storedToken);
        setUser(storedUser);
        setIsLoading(false);
    }, []);
    const login = async (data) => {
        const res = await authService.login(data);
        setToken(res.accessToken);
        setUser(authService.getCurrentUser());
    };
    const register = async (data) => {
        const res = await authService.register(data);
        setToken(res.accessToken);
        setUser(authService.getCurrentUser());
    };
    const logout = () => {
        authService.logout();
        setToken(null);
        setUser(null);
    };
    return (_jsx(AuthContext.Provider, { value: {
            user,
            token,
            isAuthenticated: !!token,
            isLoading,
            login,
            register,
            logout,
        }, children: children }));
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
