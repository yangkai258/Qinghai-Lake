-- views 暴露给 dashboard / superset 用的"业务宽表"，不直接碰事实表。
-- 改这里后跑一次 drizzle migration generate 即可。

-- 卓宝全员抖音号 latest (one row per entity, latest capture)
CREATE OR REPLACE VIEW v_douyin_account_latest AS
SELECT
  entity_id                                                    AS account_name,
  (dims ->> 'dept')::text                                      AS dept,
  (dims ->> 'person')::text                                    AS person,
  (dims ->> 'douyin_name')::text                               AS douyin_name,
  (dims ->> 'status')::text                                    AS status,
  MAX(CASE WHEN metric_name = 'plays_inc'   THEN metric_value END) AS plays_inc,
  MAX(CASE WHEN metric_name = 'like_count'  THEN metric_value END) AS like_count,
  MAX(CASE WHEN metric_name = 'fans_total'  THEN metric_value END) AS fans_total,
  MAX(CASE WHEN metric_name = 'fans_inc'    THEN metric_value END) AS fans_inc,
  MAX(CASE WHEN metric_name = 'works_total' THEN metric_value END) AS works_total,
  MAX(CASE WHEN metric_name = 'rate'        THEN metric_value END) AS rate,
  MAX(captured_at)                                              AS captured_at
FROM account_snapshots
WHERE entity_kind = 'douyin_account'
GROUP BY entity_id, dims;
