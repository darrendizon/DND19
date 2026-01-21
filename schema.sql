-- Schema for "Infinite Horizon" D&D Adventure

CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,          -- UUID for the session/player
    world_seed INTEGER,           -- The distinct seed for this player's universe
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    wins INTEGER DEFAULT 0,       -- Tracks successful encounters for Adaptive Difficulty
    difficulty_modifier REAL DEFAULT 1.0 -- Calculated based on wins
);

CREATE TABLE IF NOT EXISTS gamestate (
    player_id TEXT PRIMARY KEY,
    current_hp INTEGER,
    max_hp INTEGER,
    ac INTEGER,
    spell_slots INTEGER,
    max_spell_slots INTEGER,
    current_biome TEXT,           -- To ensure continuity if we want sticky biomes
    current_room_id INTEGER,      -- Increments as player moves
    inventory TEXT,               -- JSON string of items
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES players(id)
);
