-- Initial schema for abandon.ai game state

-- Viruses table
CREATE TABLE IF NOT EXISTS viruses (
  id TEXT PRIMARY KEY,
  hash TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  nonce INTEGER NOT NULL,
  difficulty INTEGER NOT NULL,
  memo TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  eliminated_by TEXT,
  eliminated_at INTEGER
);

CREATE INDEX idx_viruses_status ON viruses(status);
CREATE INDEX idx_viruses_created_at ON viruses(created_at DESC);
CREATE INDEX idx_viruses_created_by ON viruses(created_by);

-- Vaccines table
CREATE TABLE IF NOT EXISTS vaccines (
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  target TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  nonce INTEGER NOT NULL,
  success INTEGER NOT NULL DEFAULT 1,
  virus_id TEXT,
  FOREIGN KEY (target) REFERENCES viruses(hash)
);

CREATE INDEX idx_vaccines_created_at ON vaccines(created_at DESC);
CREATE INDEX idx_vaccines_target ON vaccines(target);
CREATE INDEX idx_vaccines_created_by ON vaccines(created_by);
