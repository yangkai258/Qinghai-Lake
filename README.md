# data-tw 路 鍗撳疂鏁版嵁涓彴

瀹屾暣鍚庡彴 + 鏁版嵁澶у睆 + BI + 鍛婅. PostgreSQL 17 + Drizzle + Next.js 15 + Superset + react-bits.

## 鍏ㄦ櫙

```
[feigua-crawler] (cron, hostname only)  鈫?/var/inbox/feigua/*.json
                                              鈫?             [apps/feigua-worker]  (hourly synthetic or real fetch with .env cookie)
                                              鈫?                                       inbox JSON files
                                              鈫?             [apps/ingestion] (node-cron scheduler)
                                              鈫?             loadSnapshots() 鈫?PG account_snapshots + ingestion_runs
                                              鈫?                          v_douyin_account_latest (view)
                          鈫?          鈫?            鈫?        [apps/dashboard]     [apps/admin]     [Superset]
        6 TV screens (16:9)   sources / facts /  6 charts + 1 dashboard
        auto-rotator home     alerts / ingest   auto-bootstrapped by
        map + react-bits      control           scripts/superset-bootstrap.py
                              reseed mock + UI  click to fire ingest
```

## 杩涚▼琛?
| 鏈嶅姟                       | 绔彛 | 瑙掕壊                                          |
|----------------------------|------|-----------------------------------------------|
| apps/admin                 | 3004 | 鍚庡彴 login / sources / facts / alerts / 閲嶇亴 mock / Superset iframe |
| apps/dashboard             | 3003 | 6 TV 灞?(1920x1080 lock) + 鑷姩杞挱棣栭〉              |
| apps/ingestion             | 鈥?   | cron runner 璋?connectors 鍐?PG                  |
| apps/feigua-worker         | 鈥?   | 姣忓皬鏃舵媺椋炵摐 (cookie 绉佹湁) 鈫?鍐?inbox               |
| Superset                   | 8088 | BI / 鎶ヨ〃                                     |
| PostgreSQL 17              | 5432 | 4 寮犺〃 + 瑙嗗浘 + superset 鍙瑙掕壊 + alert 寮曟搸      |

## 涓€娆℃€у畨瑁?
```bash
pnpm install
psql -U postgres -d dashboard -f packages/db/migrations/0000_initial/migration.sql
psql -U postgres -d dashboard -f packages/db/migrations/0001_alert_rules_and_users/migration.sql
psql -U postgres -d dashboard -f packages/db/seed-via-sql.sql
psql -U postgres -d dashboard -f packages/db/setup-superset.sql
```

## 璧峰紑鍙戞爤 (涓€寮€ 4 缁堢)

```bash
# T1: dashboard (鍓嶅彴 + 澶у睆)
pnpm dashboard:dev     # 鈫?http://localhost:3003

# T2: admin (鍚庡彴)
pnpm admin:dev         # 鈫?http://localhost:3004; 棣栨 setup wizard

# T3: ingestion
pnpm ingest:start      # cron runner

# T4: feigua-worker
pnpm feigua:start      # 姣忓皬鏃舵媺椋炵摐; cookie 璧?.env

# Superset
docker compose up -d superset
python3 scripts/superset-bootstrap.py   # 寤?dataset + 6 charts + 1 dashboard
```

## Superset 6 澶у睆

`scripts/superset-bootstrap.py` 鑷姩寤?

- 鏁版嵁搴? `data-tw` (杩炲彧璇昏处鍙?
- Dataset: `v_douyin_account_latest`
- 6 charts:
  - 楂樺眰鍐崇瓥灞?(big_number_total)
  - 杩愯惀浣滄垬灞?(table)
  - 鍐呭鐢熶骇灞?(bar by dept)
  - 鍏ㄩ噺璐﹀彿灞?(table)
  - 閮ㄩ棬瓒嬪娍灞?(stacked bar)
  - 鍦板煙鍒嗗竷灞?(pivot_table)
- 1 dashboard: `data-tw-screens` (slug `data-tw-screens`)

admin 鍚庡彴 鈫?鏁版嵁澶у睆棰勮 鈫?Superset 澶у睆涓诲尯 + fallback 鑰?dashboard 7 灞忋€?
## 鍛婅寮曟搸

`packages/connectors/src/alerts/evaluator.ts` 姣忓垎閽?cron 璇勪及锛屽懡涓啓 `alerts` 琛?(dedupe by rule_id unresolved)銆?
瑙勫垯 kind:
- `dead_count_ge`    鍋滄挱璐﹀彿鏁?鈮?threshold
- `warn_count_ge`    棰勮璐﹀彿鏁?鈮?threshold
- `rate_avg_lt`      骞冲潎瀹屾挱鐜?< threshold
- `fans_inc_total_lt`SUM 鏂板绮変笣 < threshold
- `dead_pct_ge`      鍋滄挱鍗犳瘮 鈮?threshold (0..1)

鍚庡彴 鈫?鍛婅 鈫?銆屾彃鍏?3 鏉￠粯璁よ鍒欍€?銆岀珛鍗宠瘎浼般€嶃€侱ashboard 椤舵爮鍙充笂绾?tag 闂€?
## 瑙嗚 (dashboard)

娣辨捣鍐涜摑 (`#050b18`) 閿?1920x1080, body cursor:none. react-bits 缁勪欢鍦?`apps/dashboard/src/components/rb/`:
- Aurora        鈥?鍏ㄥ睆寰勫悜娓愬彉娴佸厜
- Threads       鈥?SVG 绮掑瓙绾?- MagnetLines   鈥?Panel 瑁呴グ瀵硅缃戞牸
- CountUp       鈥?KPI 鏁板瓧婊氬姩
- ElectricBorder/GradientText/ShinyText/BlurText/GlareHover 鈥?澶囩敤

## Performance / Cache

`apps/dashboard/src/lib/adapter.ts` 鐢?Next.js `unstable_cache` 鎶?PG view 缁撴灉缂撳瓨 30s, 6 灞忓叡浜竴娆℃煡璇€?
## 閮ㄧ讲 (macmini 鍏ㄦ爤)

```bash
docker compose up -d                       # postgres + admin + dashboard + superset + feigua-worker
psql -U postgres -d dashboard -f packages/db/migrations/0000_initial/migration.sql
psql -U postgres -d dashboard -f packages/db/migrations/0001_alert_rules_and_users/migration.sql
python3 scripts/superset-bootstrap.py
```

7 涓嵎 + 5 涓鍣?+ pgdata 鍗锋寔涔呭寲. 鑰?Windows 娴忚鍣ㄨ闂?
- http://&lt;macmini-ip&gt;:3004  (鍚庡彴)
- http://&lt;macmini-ip&gt;:3003  (澶у睆)
- http://&lt;macmini-ip&gt;:8088  (BI)

## 缂栫爜鍧?
- PowerShell `Set-Content -Encoding UTF8` 浼氭妸涓枃鍙??????. 鐢?`UTF8Encoding($false)` 鐨?`[IO.File]::WriteAllText`.
- 涓嶈鍦?5 灞忛噷鍔犳悳绱?鎺掑簭/鍒嗛〉 (TV 涓嶈兘鐐?.
- KPI 姘歌繙 6 涓?tile, 涓嶅鐢?鈥?濉厖.
- 椋炵摐 cookie 鍙湪 .env, 涓嶅仛 UI.
- sandbox 鎷?node 璺? 浣犳湰鏈?`pnpm install` 鎵嶈兘鐪熼獙璇?build.
## 职责边界

- 数据中台 = admin / dashboard / PostgreSQL / Superset / 本地 LLM,放在
  `zhuobao`(裸机,Ubuntu 26.04,双 3090 跑 vLLM)。
- 采集端 = `apps/feigua-worker` / 其它采集脚本,跑在**任意机器**,只通过
  `POST /api/ingest-external/<id>` 写入,从不直连 PostgreSQL。
- 详细请阅读 `docs/ARCHITECTURE.md` 和 `docs/COLLECTOR_NEIGHBOR.md`;
  运维侧看 `docs/OPERATIONS.md`;服务器部署看 `deploy/zhuobao/SYSTEMD.md`。