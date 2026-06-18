CREATE TABLE IF NOT EXISTS activities (
    id            VARCHAR(36)  PRIMARY KEY,
    type          VARCHAR(10)  NOT NULL,
    subject       VARCHAR(255) NOT NULL,
    notes         TEXT,
    activity_date TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    author_id     VARCHAR(36)  REFERENCES users(id)    ON DELETE SET NULL,
    contact_id    VARCHAR(36)  REFERENCES contacts(id) ON DELETE CASCADE,
    deal_id       VARCHAR(36)  REFERENCES deals(id)    ON DELETE SET NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activities_contact    ON activities (contact_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_deal       ON activities (deal_id,    activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities (created_at DESC);
