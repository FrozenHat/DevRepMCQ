import { db } from '../db/index.js';

/**
 * Returns the latest published version of a quest by slug.
 * Returned object shape: { id, version, start_node, nodes }
 *
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export async function getPublishedQuest(slug) {
    const result = await db.query(
        `SELECT qv.data
         FROM quest_versions qv
         JOIN quests q ON q.id = qv.quest_id
         WHERE q.slug = $1
           AND qv.status = 'published'
         ORDER BY qv.version_number DESC
         LIMIT 1`,
        [slug]
    );

    if (!result.rows.length) return null;

    // data is the full quest graph stored in JSONB
    return result.rows[0].data;
}

/**
 * Lists all quests with slug, title, and their latest version status.
 *
 * @returns {Promise<Array>}
 */
export async function listQuests() {
    const result = await db.query(
        `SELECT
            q.id,
            q.slug,
            q.title,
            q.created_at,
            (
                SELECT json_build_object(
                    'versionNumber', version_number,
                    'status', status,
                    'publishedAt', published_at
                )
                FROM quest_versions
                WHERE quest_id = q.id
                ORDER BY version_number DESC
                LIMIT 1
            ) AS latest_version
         FROM quests q
         ORDER BY q.created_at DESC`
    );

    return result.rows;
}

/**
 * Creates a new quest with version 1 as draft.
 *
 * @param {string} userId
 * @param {string} title
 * @param {string} slug
 * @returns {Promise<Object>}
 */
export async function createQuest(userId, title, slug) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const questResult = await client.query(
            `INSERT INTO quests (slug, title, created_by)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [slug, title, userId]
        );
        const quest = questResult.rows[0];

        // Create empty draft version 1
        const emptyGraph = {
            id: slug,
            version: 1,
            start_node: null,
            nodes: {},
        };

        await client.query(
            `INSERT INTO quest_versions (quest_id, version_number, status, data, created_by)
             VALUES ($1, 1, 'draft', $2, $3)`,
            [quest.id, JSON.stringify(emptyGraph), userId]
        );

        await client.query('COMMIT');
        return quest;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Returns all versions of a quest ordered by version_number DESC.
 *
 * @param {string} questId
 * @returns {Promise<Array>}
 */
export async function getQuestVersions(questId) {
    const result = await db.query(
        `SELECT id, version_number, status, published_at, created_at
         FROM quest_versions
         WHERE quest_id = $1
         ORDER BY version_number DESC`,
        [questId]
    );

    return result.rows;
}

/**
 * Saves draft data. If no draft exists, creates a new version.
 * If a draft exists, updates its data in place.
 *
 * @param {string} questId
 * @param {string} userId
 * @param {Object} data   Quest graph JSON
 * @returns {Promise<Object>}
 */
export async function saveDraft(questId, userId, data) {
    const existing = await db.query(
        `SELECT id FROM quest_versions
         WHERE quest_id = $1 AND status = 'draft'
         ORDER BY version_number DESC
         LIMIT 1`,
        [questId]
    );

    if (existing.rows.length > 0) {
        const result = await db.query(
            `UPDATE quest_versions SET data = $1
             WHERE id = $2
             RETURNING *`,
            [JSON.stringify(data), existing.rows[0].id]
        );
        return result.rows[0];
    }

    // No current draft — create a new version number
    const maxVersion = await db.query(
        `SELECT COALESCE(MAX(version_number), 0) AS max
         FROM quest_versions WHERE quest_id = $1`,
        [questId]
    );
    const nextVersion = maxVersion.rows[0].max + 1;

    const result = await db.query(
        `INSERT INTO quest_versions (quest_id, version_number, status, data, created_by)
         VALUES ($1, $2, 'draft', $3, $4)
         RETURNING *`,
        [questId, nextVersion, JSON.stringify(data), userId]
    );

    return result.rows[0];
}

/**
 * Publishes a specific version.
 * Archives the current published version (if any) first.
 * Operation is atomic.
 *
 * @param {string} questId
 * @param {string} versionId  UUID of the quest_versions row to publish.
 * @returns {Promise<Object>}
 */
export async function publishVersion(questId, versionId) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Archive existing published version
        await client.query(
            `UPDATE quest_versions
             SET status = 'archived'
             WHERE quest_id = $1 AND status = 'published'`,
            [questId]
        );

        // Publish the target version
        const result = await client.query(
            `UPDATE quest_versions
             SET status = 'published', published_at = NOW()
             WHERE id = $1 AND quest_id = $2
             RETURNING *`,
            [versionId, questId]
        );

        if (!result.rows.length) {
            await client.query('ROLLBACK');
            throw Object.assign(new Error('Version not found'), { status: 404 });
        }

        await client.query('COMMIT');
        return result.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}
