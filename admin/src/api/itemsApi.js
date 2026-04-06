/**
 * itemsApi.js
 * CRUD for quest items / props.
 * DEV mode uses localStorage; production calls REST API.
 */
import useAuthStore from '../store/authStore.js';

const DEV     = import.meta.env.DEV;
const DEV_KEY = 'mcq_dev_items';

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

export async function listItems() {
    if (DEV) return devLoad();
    return handleResponse(await fetch('/api/items', { headers: headers() }));
}

export async function createItem(data) {
    if (DEV) {
        const list = devLoad();
        const item = { id: `item_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
        devSave([item, ...list]);
        return item;
    }
    return handleResponse(await fetch('/api/items', { method: 'POST', headers: headers(), body: JSON.stringify(data) }));
}

export async function updateItem(id, patch) {
    if (DEV) {
        const list = devLoad().map(i => i.id === id ? { ...i, ...patch } : i);
        devSave(list);
        return list.find(i => i.id === id);
    }
    return handleResponse(await fetch(`/api/items/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(patch) }));
}

export async function deleteItem(id) {
    if (DEV) { devSave(devLoad().filter(i => i.id !== id)); return {}; }
    return handleResponse(await fetch(`/api/items/${id}`, { method: 'DELETE', headers: headers() }));
}
