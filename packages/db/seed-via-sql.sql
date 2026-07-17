-- seed sources
INSERT INTO sources (id, kind, display_name, enabled, cron_expr, config) VALUES
  ('feigua','feigua','飞瓜（抖音）',true,'0 */1 * * *','{}'::jsonb),
  ('excel:finance','excel','财务 Excel（手工）',false,'0 */15 * * *','{}'::jsonb),
  ('sap:s4','sap','SAP S/4HANA（半年后启用）',false,'0 0 * * *','{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- generate 30 mock accounts with metrics
DO $$
DECLARE
  i int;
  acct text;
  dept text;
  person text;
  status text;
  plays int;
  fans int;
  fans_inc int;
  works int;
  rate numeric;
  capture_t timestamptz := now() - interval '4 hours';
BEGIN
  FOR i IN 1..30 LOOP
    acct := '抖音号' || lpad(i::text, 2, '0');
    dept := (ARRAY['总部','华南','华东','华北','西南','海外'])[1 + (i % 6)];
    person := '运营' || lpad(i::text, 2, '0');
    status := (ARRAY['live','warn','dead'])[1 + (i % 3)];
    plays := 5000 + (i * 137) % 90000;
    fans := 10000 + (i * 89) % 800000;
    fans_inc := -50 + (i * 13) % 800;
    works := 10 + (i * 7) % 200;
    rate := 0.10 + ((i % 50)::numeric / 100);
    INSERT INTO account_snapshots (source_id, captured_at, entity_kind, entity_id, metric_name, metric_value, dims)
    VALUES
      ('feigua', capture_t, 'douyin_account', acct, 'plays_inc',   plays,   jsonb_build_object('dept',dept,'person',person,'douyin_name',acct,'status',status)),
      ('feigua', capture_t, 'douyin_account', acct, 'like_count',  plays/4, jsonb_build_object('dept',dept,'person',person,'douyin_name',acct,'status',status)),
      ('feigua', capture_t, 'douyin_account', acct, 'fans_total',  fans,    jsonb_build_object('dept',dept,'person',person,'douyin_name',acct,'status',status)),
      ('feigua', capture_t, 'douyin_account', acct, 'fans_inc',    fans_inc,jsonb_build_object('dept',dept,'person',person,'douyin_name',acct,'status',status)),
      ('feigua', capture_t, 'douyin_account', acct, 'works_total', works,   jsonb_build_object('dept',dept,'person',person,'douyin_name',acct,'status',status)),
      ('feigua', capture_t, 'douyin_account', acct, 'rate',        rate,    jsonb_build_object('dept',dept,'person',person,'douyin_name',acct,'status',status));
  END LOOP;
END $$;

SELECT count(*) AS total FROM account_snapshots;
SELECT count(*) AS distinct_accts FROM (SELECT DISTINCT entity_id FROM account_snapshots WHERE entity_kind='douyin_account') t;