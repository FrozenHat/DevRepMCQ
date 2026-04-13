/**
 * sceneApi.js
 * Scene Editor → API bridge.
 * When VITE_USE_API=true, persists scene data to the database.
 */
import useAuthStore from '../store/authStore.js';

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

/**
 * Upsert a scene. key is derived from the scene name slug.
 * data is the Scene Editor export format { scene, navMesh, markers }.
 */
export async function upsertScene(key, title, data) {
    return handleResponse(await fetch(`/api/scenes/${key}`, {
        method:  'PUT',
        headers: headers(),
        body:    JSON.stringify({ title, data }),
    }));
}

export async function getScene(key) {
    const res = await fetch(`/api/scenes/${key}`, { headers: headers() });
    if (res.status === 404) return null;
    return handleResponse(res);
}

export async function listScenes() {
    return handleResponse(await fetch('/api/scenes', { headers: headers() }));
}

/**
 * Upload a background image for a scene.
 * Returns { url } — a path like /uploads/scenes/key_timestamp.jpg
 */
export async function uploadSceneImage(key, file) {
    const token = useAuthStore.getState().token;
    const form  = new FormData();
    form.append('image', file);
    const res = await fetch(`/api/scenes/${key}/image`, {
        method:  'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    form,
    });
    return handleResponse(res);
}
