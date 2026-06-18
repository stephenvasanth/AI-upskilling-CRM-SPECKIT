CREATE TABLE IF NOT EXISTS deals (
    id                  VARCHAR(36)    PRIMARY KEY,
    title               VARCHAR(255)   NOT NULL,
    value               NUMERIC(15, 2) DEFAULT 0,
    stage               VARCHAR(20)    NOT NULL DEFAULT 'LEAD',
    expected_close_date DATE,
    contact_id          VARCHAR(36)    REFERENCES contacts(id) ON DELETE SET NULL,
    owner_id            VARCHAR(36)    REFERENCES users(id)    ON DELETE SET NULL,
    notes               TEXT,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deals_stage   ON deals (stage);
CREATE INDEX IF NOT EXISTS idx_deals_owner   ON deals (owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals (contact_id);
