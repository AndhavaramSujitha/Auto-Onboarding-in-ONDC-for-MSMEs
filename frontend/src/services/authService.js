import api from './api';
const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'currentUser';
export const authService = {
    async login(credentials) {
        const response = await api.post('/auth/login', credentials);
        if (response.data.accessToken) {
            localStorage.setItem(TOKEN_KEY, response.data.accessToken);
            if (response.data.refreshToken) {
                localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
            }
            // Store user info from email
            const user = {
                email: credentials.email,
                role: 'SELLER',
            };
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
        return response.data;
    },
    async register(data) {
        const payload = {
            email: data.email,
            password: data.password,
            role: data.role || 'SELLER',
        };
        const response = await api.post('/auth/register', payload);
        if (response.data.accessToken) {
            localStorage.setItem(TOKEN_KEY, response.data.accessToken);
            if (response.data.refreshToken) {
                localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
            }
            const user = {
                email: data.email,
                fullName: data.fullName,
                role: data.role || 'SELLER',
            };
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
        return response.data;
    },
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },
    getCurrentUser() {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    },
    isAuthenticated() {
        return !!localStorage.getItem(TOKEN_KEY);
    },
};
export default authService;
