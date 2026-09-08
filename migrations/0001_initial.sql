-- Run once through the Sites D1 maintenance workflow. Re-runnable, non-destructive.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT OR IGNORE INTO app_meta(key,value) VALUES('schema_version','1');
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  identity_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS journeys (
  player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  schema_version INTEGER NOT NULL CHECK(schema_version=1),
  revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0),
  state_json TEXT NOT NULL CHECK(json_valid(state_json)),
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS command_receipts (
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  request_id TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  expected_revision INTEGER NOT NULL,
  outcome_json TEXT NOT NULL CHECK(json_valid(outcome_json)),
  created_at TEXT NOT NULL,
  PRIMARY KEY(player_id,request_id)
);
CREATE INDEX IF NOT EXISTS receipts_by_time ON command_receipts(player_id,created_at);
CREATE TABLE IF NOT EXISTS transaction_guards (player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,valid INTEGER NOT NULL CHECK(valid=1));
CREATE TABLE IF NOT EXISTS checkpoints (
  player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  state_json TEXT NOT NULL CHECK(json_valid(state_json)),
  saved_at TEXT NOT NULL
);
