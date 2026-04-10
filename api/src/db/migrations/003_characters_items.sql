-- Migration 003: characters and items tables
-- Applied by: npm run db:migrate

-- -------------------------------------------------------------------------
-- Characters (NPC / named entities)
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS characters (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    role        VARCHAR(50)  NOT NULL DEFAULT 'npc'
                    CHECK (role IN ('npc', 'merchant', 'enemy', 'companion', 'boss')),
    description TEXT         NOT NULL DEFAULT '',
    sprite      VARCHAR(500) NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- Items (quest objects / props)
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS items (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(50)  NOT NULL DEFAULT 'misc'
                    CHECK (type IN ('quest', 'weapon', 'consumable', 'key', 'misc')),
    description TEXT         NOT NULL DEFAULT '',
    icon        VARCHAR(500) NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
