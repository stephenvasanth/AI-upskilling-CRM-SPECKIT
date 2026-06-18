CREATE TABLE IF NOT EXISTS contacts (
    id           VARCHAR(36)  PRIMARY KEY,
    first_name   VARCHAR(100) NOT NULL,
    last_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(255),
    phone        VARCHAR(50),
    job_title    VARCHAR(100),
    company_id   VARCHAR(36)  REFERENCES companies(id) ON DELETE SET NULL,
    owner_id     VARCHAR(36)  REFERENCES users(id)     ON DELETE SET NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contacts_email     ON contacts (email);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name ON contacts (last_name);
CREATE INDEX IF NOT EXISTS idx_contacts_owner     ON contacts (owner_id);
