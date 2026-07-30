-- Dataset sintetico y descartable para PERFORMANCE-01.
-- Ejecutar solo contra la base temporal deskly_performance migrada desde cero.
BEGIN;

INSERT INTO localities (id, name, active, created_at, updated_at)
SELECT ('10000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
       'Perf Locality ' || g, true, now(), now()
FROM generate_series(1, 10) AS g;

INSERT INTO work_areas
  (id, name, description, locality_id, address, active, created_at, updated_at)
SELECT ('20000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
       'Perf Area ' || g, 'Synthetic performance fixture',
       ('10000000-0000-4000-8000-' || lpad((((g - 1) % 10) + 1)::text, 12, '0'))::uuid,
       'Synthetic address ' || g, true, now(), now()
FROM generate_series(1, 100) AS g;

INSERT INTO desks
  (id, code, name, people_capacity, area_id, zone, enabled, created_at, updated_at)
SELECT ('30000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
       'PERF-' || lpad(g::text, 4, '0'), 'Perf Desk ' || g, 1,
       ('20000000-0000-4000-8000-' || lpad((((g - 1) % 100) + 1)::text, 12, '0'))::uuid,
       'A'::"DeskZone", true, now(), now()
FROM generate_series(1, 1000) AS g;

INSERT INTO users
  (id, email, username, password_hash, role, active, token_version, created_at, updated_at)
SELECT ('40000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
       'perf-' || g || '@invalid.test', 'perf-user-' || g,
       '$2b$10$012345678901234567890u012345678901234567890123456789012',
       'MIEMBRO'::"UserRole", true, 0, now(), now()
FROM generate_series(1, 1000) AS g;

INSERT INTO members
  (id, user_id, full_name, dni, phone, active, created_at, updated_at)
SELECT ('50000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
       ('40000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
       'Perf Member ' || g, 70000000 + g, 540000000000 + g, true, now(), now()
FROM generate_series(1, 1000) AS g;

INSERT INTO reservations
  (id, desk_id, member_id, date, start_time, end_time, status, created_at, updated_at)
SELECT ('60000000-0000-4000-8000-' || lpad((((g - 1) * 4) + slot)::text, 12, '0'))::uuid,
       ('30000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
       ('50000000-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
       DATE '2026-08-01',
       make_time(7 + slot, 0, 0),
       make_time(8 + slot, 0, 0),
       'RESERVED'::"ReservationStatus", now(), now()
FROM generate_series(1, 1000) AS g
CROSS JOIN generate_series(1, 4) AS slot;

COMMIT;
ANALYZE;

SELECT
  (SELECT count(*) FROM localities) AS localities,
  (SELECT count(*) FROM work_areas) AS work_areas,
  (SELECT count(*) FROM desks) AS desks,
  (SELECT count(*) FROM users) AS users,
  (SELECT count(*) FROM members) AS members,
  (SELECT count(*) FROM reservations) AS reservations;
