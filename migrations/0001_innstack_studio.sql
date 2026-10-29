CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  csrf_token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  original_slug TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  article_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  repository_sha TEXT,
  publish_id TEXT,
  deployment_state TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS article_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  article_json TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS article_revisions_article_id ON article_revisions(article_id, revision DESC);

CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL,
  window_started_at TEXT NOT NULL
);
