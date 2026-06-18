CREATE TABLE IF NOT EXISTS users (
    id            VARCHAR(36)  PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(10)  NOT NULL DEFAULT 'USER',
    status        VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
