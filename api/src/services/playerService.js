import { db } from '../db/index.js';

/**
 * Returns the player's progress for a given quest, or null if none.
 *
 * @param {string} userId
 * @param {string} questId
 * @returns {Promise<Object|null>}
 */
export async function getProgress(userId, questId) {
    const result = await db.query(
        `SELECT
            quest_id    AS "questId",
            quest_version AS "questVersion",
            current_node_id AS "currentNodeId",
            context,
            status,
            started_at  AS "startedAt",
            updated_at  AS "updatedAt"
         FROM player_progress
         WHERE user_id = $1 AND quest_id = $2`,
        [userId, questId]
    );

    return result.rows[0] ?? null;
}

/**
 * Upserts player progress.
 * If no row exists, creates one. If it exists, updates it.
 *
 * @param {string} userId
 * @param {string} questId
 * @param {string} currentNodeId
 * @param {Object} context
 * @param {string} status   'in_progress' | 'completed' | 'abandoned'
 * @returns {Promise<Object>}
 */
export async function saveProgress(userId, questId, currentNodeId, context, status) {
    // Fetch the latest published version number for this quest
    const versionResult = await db.query(
        `SELECT version_number
         FROM quest_versions
         WHERE quest_id = $1 AND status = 'published'
         ORDER BY version_number DESC
         LIMIT 1`,
        [questId]
    );

    const questVersion = versionResult.rows[0]?.version_number ?? 1;

    const result = await db.query(
        `INSERT INTO player_progress
            (user_id, quest_id, quest_version, current_node_id, context, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, quest_id) DO UPDATE SET
            current_node_id = EXCLUDED.current_node_id,
            context         = EXCLUDED.context,
            status          = EXCLUDED.status,
            updated_at      = NOW()
         RETURNING
            quest_id        AS "questId",
            quest_version   AS "questVersion",
            current_node_id AS "currentNodeId",
            context,
            status,
            updated_at      AS "updatedAt"`,
        [userId, questId, questVersion, currentNodeId, JSON.stringify(context), status]
    );

    return result.rows[0];
}
