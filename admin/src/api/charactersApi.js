/**
 * charactersApi.js
 * CRUD for NPC/character entities.
 * DEV mode uses localStorage; production calls REST API.
 */
import useAuthStore from '../store/authStore.js';

const DEV     = import.meta.env.DEV;
const DEV_KEY = 'mcq_dev_characters';

function devLoad() { return JSON.parse(localStorage.getItem(DEV_KEY) ?? '[]'); }
function devSave(d) { localStorage.setItem(DEV_KEY, JSON.stringify(d)); }

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

export async function listCharacters() {
    if (DEV) return devLoad();
    return handleResponse(await fetch('/api/characters', { headers: headers() }));
}

export async function createCharacter(data) {
    if (DEV) {
        const list = devLoad();
        const char = { id: `char_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
        devSave([char, ...list]);
        return char;
    }
    return handleResponse(await fetch('/api/characters', { method: 'POST', headers: headers(), body: JSON.stringify(data) }));
}

export async function updateCharacter(id, patch) {
    if (DEV) {
        const list = devLoad().map(c => c.id === id ? { ...c, ...patch } : c);
        devSave(list);
        return list.find(c => c.id === id);
    }
    return handleResponse(await fetch(`/api/characters/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(patch) }));
}

export async function deleteCharacter(id) {
    if (DEV) { devSave(devLoad().filter(c => c.id !== id)); return {}; }
    return handleResponse(await fetch(`/api/characters/${id}`, { method: 'DELETE', headers: headers() }));
}
