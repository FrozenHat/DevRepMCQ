-- Initial schema for MyCityQuest
-- Applied by: npm run db:migrate

-- -------------------------------------------------------------------------
-- Users
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'player'
                      CHECK (role IN ('player', 'admin')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- Quests
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS quests (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        VARCHAR(100) UNIQUE NOT NULL,
    title       VARCHAR(255) NOT NULL,
    created_by  UUID        NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- Quest versions
-- Stores every draft and published snapshot of a quest graph.
-- The quest graph itself is stored as JSONB in 'data'.
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS quest_versions (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id       UUID        NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    version_number INTEGER     NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'published', 'archived')),
    data           JSONB       NOT NULL,
    created_by     UUID        NOT NULL REFERENCES users(id),
    published_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (quest_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_quest_versions_quest_status
    ON quest_versions (quest_id, status);

-- -------------------------------------------------------------------------
-- Player progress
-- Stores each player's current position in a quest and their context.
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS player_progress (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id        UUID        NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    quest_version   INTEGER     NOT NULL,
    current_node_id VARCHAR(100) NOT NULL,
    context         JSONB       NOT NULL DEFAULT '{}',
    status          VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, quest_id)
);

CREATE INDEX IF NOT EXISTS idx_player_progress_user
    ON player_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_player_progress_quest
    ON player_progress (quest_id);

-- -------------------------------------------------------------------------
-- Scenes
-- Stores location configuration (background paths, zones, spawn points).
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS scenes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    key        VARCHAR(100) UNIQUE NOT NULL,
    title      VARCHAR(255) NOT NULL,
    data       JSONB        NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
