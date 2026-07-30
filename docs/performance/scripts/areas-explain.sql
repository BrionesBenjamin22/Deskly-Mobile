EXPLAIN (ANALYZE, BUFFERS)
SELECT d.id, d.code, d.name, d.area_id, r.start_time, r.end_time
FROM desks d
JOIN work_areas a ON a.id = d.area_id AND a.active
JOIN localities l ON l.id = a.locality_id AND l.active
LEFT JOIN reservations r
  ON r.desk_id = d.id
 AND r.date = DATE '2026-08-01'
 AND r.status IN ('PENDING_PAYMENT', 'RESERVED', 'ACTIVE')
WHERE d.enabled AND d.deleted_at IS NULL
ORDER BY d.code, r.start_time;

EXPLAIN (ANALYZE, BUFFERS)
SELECT
  a.id,
  count(*) AS total_desk_count,
  count(*) FILTER (
    WHERE NOT EXISTS (
      SELECT 1
      FROM reservations r
      WHERE r.desk_id = d.id
        AND r.date = DATE '2026-08-01'
        AND r.status IN ('PENDING_PAYMENT', 'RESERVED', 'ACTIVE')
        AND r.start_time < TIME '09:30'
        AND r.end_time > TIME '08:30'
    )
  ) AS available_desk_count
FROM desks d
JOIN work_areas a ON a.id = d.area_id AND a.active
JOIN localities l ON l.id = a.locality_id AND l.active
WHERE d.enabled AND d.deleted_at IS NULL
GROUP BY a.id
ORDER BY a.id;
