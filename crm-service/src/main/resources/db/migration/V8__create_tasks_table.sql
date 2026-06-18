CREATE TABLE IF NOT EXISTS tasks (
    id           VARCHAR(36)  PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    due_date     DATE         NOT NULL,
    status       VARCHAR(10)  NOT NULL DEFAULT 'PENDING',
    assignee_id  VARCHAR(36)  REFERENCES users(id)    ON DELETE SET NULL,
    contact_id   VARCHAR(36)  REFERENCES contacts(id) ON DELETE SET NULL,
    deal_id      VARCHAR(36)  REFERENCES deals(id)    ON DELETE SET NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks (assignee_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_contact  ON tasks (contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deal     ON tasks (deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks (status, due_date);
