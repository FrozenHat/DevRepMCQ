/**
 * questApi.js
 * Token-aware API client for quest management endpoints.
 * В режиме DEV (npm run dev) использует localStorage вместо реального API.
 */
import useAuthStore from '../store/authStore.js';

const DEV = import.meta.env.DEV;
const DEV_KEY = 'mcq_dev_quests';

// ---------------------------------------------------------------------------
// localStorage mock (только для разработки без PostgreSQL)
// ---------------------------------------------------------------------------

function devLoad() {
    return JSON.parse(localStorage.getItem(DEV_KEY) ?? '[]');
}
function devSave(quests) {
    localStorage.setItem(DEV_KEY, JSON.stringify(quests));
}

// ---------------------------------------------------------------------------
// Real API helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function listQuests() {
    if (DEV) return devLoad();
    const res = await fetch('/api/quests', { headers: headers() });
    return handleResponse(res);
}

export async function createQuest(title, slug) {
    if (DEV) {
        const quests = devLoad();
        const quest = { id: `dev_${Date.now()}`, title, slug, createdAt: new Date().toISOString() };
        devSave([quest, ...quests]);
        return quest;
    }
    const res = await fetch('/api/quests', {
        method:  'POST',
        headers: headers(),
        body:    JSON.stringify({ title, slug }),
    });
    return handleResponse(res);
}

export async function getVersions(questId) {
    if (DEV) {
        const quest = devLoad().find(q => q.id === questId);
        return quest?.versions ?? [];
    }
    const res = await fetch(`/api/quests/${questId}/versions`, { headers: headers() });
    return handleResponse(res);
}

export async function saveDraft(questId, questGraph) {
    if (DEV) {
        const quests = devLoad();
        const quest  = quests.find(q => q.id === questId);
        const version = { id: `ver_${Date.now()}`, version_number: 1, status: 'draft', data: questGraph };
        if (quest) { quest.versions = [version]; devSave(quests); }
        return version;
    }
    const res = await fetch(`/api/quests/${questId}/draft`, {
        method:  'PUT',
        headers: headers(),
        body:    JSON.stringify({ data: questGraph }),
    });
    return handleResponse(res);
}

export async function publishVersion(questId, versionId) {
    if (DEV) {
        const quests = devLoad();
        const quest  = quests.find(q => q.id === questId);
        if (quest?.versions?.[0]) { quest.versions[0].status = 'published'; devSave(quests); return quest.versions[0]; }
        return { id: versionId, status: 'published' };
    }
    const res = await fetch(`/api/quests/${questId}/publish`, {
        method:  'POST',
        headers: headers(),
        body:    JSON.stringify({ versionId }),
    });
    return handleResponse(res);
}
