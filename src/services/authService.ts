import axiosInstance from './axiosConfig';

const authService = {
    login: async (username, password) => {
        const response = await axiosInstance.post('/auth/login', { username, password });
        return response.data;
    },

    refreshToken: async (refreshToken) => {
        const response = await axiosInstance.post('/auth/refresh', { refreshToken });
        return response.data;
    },

    getMe: async () => {
        const response = await axiosInstance.get('/auth/me');
        return response.data;
    },

    changePassword: async (currentPassword, newPassword) => {
        const response = await axiosInstance.put('/auth/change-password', {
            currentPassword,
            newPassword,
        });
        return response.data;
    },

    saveUser: (userData, rememberMe = false) => {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(userData));
    },

    logout: () => {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch (_) {
            return null;
        }
    },

    getUserFromStorage: () => {
        return authService.getCurrentUser();
    },

    isAuthenticated: () => {
        return !!authService.getCurrentUser();
    },
};

export default authService;