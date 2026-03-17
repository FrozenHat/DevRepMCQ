import { create } from 'zustand';

const TOKEN_KEY = 'mcq_admin_token';
const ROLE_KEY  = 'mcq_admin_role';

const useAuthStore = create((set) => ({
    token: localStorage.getItem(TOKEN_KEY) ?? null,
    role:  localStorage.getItem(ROLE_KEY)  ?? null,

    login(accessToken, role) {
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(ROLE_KEY,  role);
        set({ token: accessToken, role });
    },

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ROLE_KEY);
        set({ token: null, role: null });
    },
}));

export default useAuthStore;
