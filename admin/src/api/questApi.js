/**
 * questApi.js
 * Token-aware API client for quest management endpoints.
 * Reads the JWT from authStore on every call — no need to pass tokens manually.
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
    if (res.status === 401) {
        useAuthStore.getState().logout();
        throw new Error('Session expired');
    }
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res.json();
}

/** GET /api/quests  — список всех квестов (только для admin) */
export async function listQuests() {
    const res = await fetch('/api/quests', { headers: headers() });
    return handleResponse(res);
}

/** POST /api/quests  — создать новый квест */
export async function createQuest(title, slug) {
    const res = await fetch('/api/quests', {
        method:  'POST',
        headers: headers(),
        body:    JSON.stringify({ title, slug }),
    });
    return handleResponse(res);
}

/** GET /api/quests/:id/versions */
export async function getVersions(questId) {
    const res = await fetch(`/api/quests/${questId}/versions`, { headers: headers() });
    return handleResponse(res);
}

/**
 * PUT /api/quests/:id/draft
 * Сохраняет весь граф квеста как черновик.
 * @param {string} questId
 * @param {Object} questGraph  — десериализованный quest JSON
 */
export async function saveDraft(questId, questGraph) {
    const res = await fetch(`/api/quests/${questId}/draft`, {
        method:  'PUT',
        headers: headers(),
        body:    JSON.stringify({ data: questGraph }),
    });
    return handleResponse(res);
}

/** POST /api/quests/:id/publish */
export async function publishVersion(questId, versionId) {
    const res = await fetch(`/api/quests/${questId}/publish`, {
        method:  'POST',
        headers: headers(),
        body:    JSON.stringify({ versionId }),
    });
    return handleResponse(res);
}
