/**
 * locationsApi.js
 * In DEV mode reads the saved scene from Scene Editor (mcq_dev_scene).
 * In production calls REST API.
 */
import useAuthStore from '../store/authStore.js';

const DEV = import.meta.env.DEV;

function headers() {
    const token = useAuthStore.getState().token;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}
async function handleResponse(res) {
    if (res.status === 401) { useAuthStore.getState().logout(); throw new Error('Session expired'); }
    if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
    return res.json();
}

export async function listLocations() {
    if (DEV) {
        const s = JSON.parse(localStorage.getItem('mcq_dev_scene') ?? 'null');
        if (!s?.sceneName) return [];
        return [{ id: s.sceneName.toLowerCase().replace(/\s+/g, '_'), name: s.sceneName }];
    }
    return handleResponse(await fetch('/api/locations', { headers: headers() }));
}
