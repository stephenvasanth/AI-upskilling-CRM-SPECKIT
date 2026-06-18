CREATE TABLE IF NOT EXISTS contact_tags (
    contact_id VARCHAR(36) NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id     VARCHAR(36) NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
    PRIMARY KEY (contact_id, tag_id)
);
