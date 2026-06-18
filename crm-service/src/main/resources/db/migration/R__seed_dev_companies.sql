-- Repeatable seed: inserts sample companies for dev/test environments.
-- Safe to re-run — uses INSERT ... ON CONFLICT DO NOTHING.

INSERT INTO companies (id, name) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Acme Corp'),
  ('c0000001-0000-0000-0000-000000000002', 'Globex Corporation'),
  ('c0000001-0000-0000-0000-000000000003', 'Initech'),
  ('c0000001-0000-0000-0000-000000000004', 'Umbrella Ltd'),
  ('c0000001-0000-0000-0000-000000000005', 'Stark Industries'),
  ('c0000001-0000-0000-0000-000000000006', 'Wayne Enterprises'),
  ('c0000001-0000-0000-0000-000000000007', 'Oscorp'),
  ('c0000001-0000-0000-0000-000000000008', 'Soylent Corp')
ON CONFLICT (id) DO NOTHING;
