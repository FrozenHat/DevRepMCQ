import { create } from 'zustand';

const TOKEN_KEY = 'mcq_admin_token';
const ROLE_KEY  = 'mcq_admin_role';

// DEV BYPASS — auto-login без API/БД в режиме npm run dev
const DEV = import.meta.env.DEV;

const useAuthStore = create((set) => ({
    token:      DEV ? 'dev-token' : (localStorage.getItem(TOKEN_KEY) ?? null),
    role:       DEV ? 'admin'     : (localStorage.getItem(ROLE_KEY)  ?? null),
    isLoggedIn: DEV ? true        : (localStorage.getItem(TOKEN_KEY) !== null),

    login(accessToken, role) {
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(ROLE_KEY,  role);
        set({ token: accessToken, role, isLoggedIn: true });
    },

    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ROLE_KEY);
        set({ token: null, role: null, isLoggedIn: false });
    },
}));

export default useAuthStore;
