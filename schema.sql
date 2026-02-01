-- Schema for abandon.ai D1 Database

-- Viruses table
CREATE TABLE IF NOT EXISTS viruses (
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
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

-- Vaccines table
CREATE TABLE IF NOT EXISTS vaccines (
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  target TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  nonce INTEGER NOT NULL,
  success INTEGER NOT NULL DEFAULT 0,
  virus_id TEXT
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_viruses_status ON viruses(status);
CREATE INDEX IF NOT EXISTS idx_viruses_created_at ON viruses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vaccines_created_at ON vaccines(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vaccines_target ON vaccines(target);
