/**
 * ApiClient
 *
 * Thin HTTP wrapper for all game-client → backend communication.
 * No auth layer: JWT handling is out of scope for the game client layer.
 *
 * All methods fall back to locally bundled JSON when:
 *   - API base URL is not configured (development).
 *   - Fetch fails (network error, 404, etc.).
 *
 * Local fallback files live in src/data/ and are imported statically
 * so the bundler includes them without a separate fetch.
 */

import hubSceneData from '../data/scenes/hub.json';
import taxiQuestData from '../data/quests/taxi-quest.json';

const LOCAL_SCENE_CONFIGS = {
    hub: hubSceneData,
};

const LOCAL_QUEST_GRAPHS = {
    'taxi-quest': taxiQuestData,
};

export default class ApiClient {
    /**
     * @param {string|null} baseUrl  API root, e.g. '/api'. Pass null to force local fallback.
     */
    constructor(baseUrl = null) {
        this.baseUrl = baseUrl;
    }

    // -------------------------------------------------------------------------
    // Scene configuration
    // -------------------------------------------------------------------------

    /**
     * Returns scene configuration object for a given scene key.
     * Shape: { key, assets, spawn, perspective, occluder, zones }
     *
     * @param {string} sceneKey
     * @returns {Promise<Object>}
     */
    async getSceneConfig(sceneKey) {
        if (this.baseUrl) {
            try {
                const res = await fetch(`${this.baseUrl}/scenes/${sceneKey}`);
                if (res.ok) return res.json();
            } catch (_) {
                // fall through to local
            }
        }

        const local = LOCAL_SCENE_CONFIGS[sceneKey];
        if (!local) throw new Error(`ApiClient: no local config for scene "${sceneKey}"`);
        return local;
    }

    // -------------------------------------------------------------------------
    // Quest data
    // -------------------------------------------------------------------------

    /**
     * Returns the published quest graph for a given slug.
     * Shape: { id, version, start_node, nodes: { [nodeId]: NodeObject } }
     *
     * @param {string} slug
     * @returns {Promise<Object>}
     */
    async getPublishedQuest(slug) {
        if (this.baseUrl) {
            try {
                const res = await fetch(`${this.baseUrl}/quests/${slug}/published`);
                if (res.ok) return res.json();
            } catch (_) {
                // fall through to local
            }
        }

        const local = LOCAL_QUEST_GRAPHS[slug];
        if (!local) throw new Error(`ApiClient: no local quest graph for slug "${slug}"`);
        return local;
    }

    // -------------------------------------------------------------------------
    // Player progress
    // -------------------------------------------------------------------------

    /**
     * Returns saved progress for the current player + quest.
     * Shape: { questId, currentNodeId, context, status }
     * Returns null if no progress found.
     *
     * @param {string} questId
     * @returns {Promise<Object|null>}
     */
    async getPlayerProgress(questId) {
        if (!this.baseUrl) return null;
        try {
            const res = await fetch(`${this.baseUrl}/player/progress/${questId}`);
            if (res.status === 404) return null;
            if (res.ok) return res.json();
        } catch (_) {
            // network failure — no saved progress available
        }
        return null;
    }

    /**
     * Persists player progress after a meaningful state change.
     *
     * @param {string}  questId
     * @param {string}  currentNodeId
     * @param {Object}  context
     * @param {string}  status  — 'in_progress' | 'completed' | 'abandoned'
     * @returns {Promise<void>}
     */
    async savePlayerProgress(questId, currentNodeId, context, status = 'in_progress') {
        if (!this.baseUrl) return;
        try {
            await fetch(`${this.baseUrl}/player/progress/${questId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentNodeId, context, status }),
            });
        } catch (_) {
            // progress save is best-effort; do not interrupt gameplay on failure
        }
    }
}
