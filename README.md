# data-tw · 卓宝数据中台

完整后台 + 数据大屏 + BI + 告警. PostgreSQL 17 + Drizzle + Next.js 15 + Superset + react-bits.

## 全景

```
[feigua-crawler] (cron, hostname only)  → /var/inbox/feigua/*.json
                                              ↓
             [apps/feigua-worker]  (hourly synthetic or real fetch with .env cookie)
                                              ↓
                                       inbox JSON files
                                              ↓
             [apps/ingestion] (node-cron scheduler)
                                              ↓
             loadSnapshots() → PG account_snapshots + ingestion_runs
                                              ↓
                          v_douyin_account_latest (view)
                          ↓           ↓             ↓
        [apps/dashboard]     [apps/admin]     [Superset]
        6 TV screens (16:9)   sources / facts /  6 charts + 1 dashboard
        auto-rotator home     alerts / ingest   auto-bootstrapped by
        map + react-bits      control           scripts/superset-bootstrap.py
                              reseed mock + UI  click to fire ingest
```

## 进程表

| 服务                       | 端口 | 角色                                          |
|----------------------------|------|-----------------------------------------------|
| apps/admin                 | 3004 | 后台 login / sources / facts / alerts / 重灌 mock / Superset iframe |
| apps/dashboard             | 3003 | 6 TV 屏 (1920x1080 lock) + 自动轮播首页              |
| apps/ingestion             | —    | cron runner 调 connectors 写 PG                  |
| apps/feigua-worker         | —    | 每小时拉飞瓜 (cookie 私有) → 写 inbox               |
| Superset                   | 8088 | BI / 报表                                     |
| PostgreSQL 17              | 5432 | 4 张表 + 视图 + superset 只读角色 + alert 引擎      |

## 一次性安装

```bash
pnpm install
psql -U postgres -d dashboard -f packages/db/migrations/0000_initial/migration.sql
psql -U postgres -d dashboard -f packages/db/migrations/0001_alert_rules_and_users/migration.sql
psql -U postgres -d dashboard -f packages/db/seed-via-sql.sql
psql -U postgres -d dashboard -f packages/db/setup-superset.sql
```

## 起开发栈 (一开 4 终端)

```bash
# T1: dashboard (前台 + 大屏)
pnpm dashboard:dev     # → http://localhost:3003

# T2: admin (后台)
pnpm admin:dev         # → http://localhost:3004; 首次 setup wizard

# T3: ingestion
pnpm ingest:start      # cron runner

# T4: feigua-worker
pnpm feigua:start      # 每小时拉飞瓜; cookie 走 .env

# Superset
docker compose up -d superset
python3 scripts/superset-bootstrap.py   # 建 dataset + 6 charts + 1 dashboard
```

## Superset 6 大屏

`scripts/superset-bootstrap.py` 自动建:

- 数据库: `data-tw` (连只读账号)
- Dataset: `v_douyin_account_latest`
- 6 charts:
  - 高层决策屏 (big_number_total)
  - 运营作战屏 (table)
  - 内容生产屏 (bar by dept)
  - 全量账号屏 (table)
  - 部门趋势屏 (stacked bar)
  - 地域分布屏 (pivot_table)
- 1 dashboard: `data-tw-screens` (slug `data-tw-screens`)

admin 后台 → 数据大屏预览 → Superset 大屏主区 + fallback 老 dashboard 7 屏。

## 告警引擎

`packages/connectors/src/alerts/evaluator.ts` 每分钟 cron 评估，命中写 `alerts` 表 (dedupe by rule_id unresolved)。

规则 kind:
- `dead_count_ge`    停播账号数 ≥ threshold
- `warn_count_ge`    预警账号数 ≥ threshold
- `rate_avg_lt`      平均完播率 < threshold
- `fans_inc_total_lt`SUM 新增粉丝 < threshold
- `dead_pct_ge`      停播占比 ≥ threshold (0..1)

后台 → 告警 → 「插入 3 条默认规则」+「立即评估」。Dashboard 顶栏右上红 tag 闪。

## 视觉 (dashboard)

深海军蓝 (`#050b18`) 锁 1920x1080, body cursor:none. react-bits 组件在 `apps/dashboard/src/components/rb/`:
- Aurora        — 全屏径向渐变流光
- Threads       — SVG 粒子线
- MagnetLines   — Panel 装饰对角网格
- CountUp       — KPI 数字滚动
- ElectricBorder/GradientText/ShinyText/BlurText/GlareHover — 备用

## Performance / Cache

`apps/dashboard/src/lib/adapter.ts` 用 Next.js `unstable_cache` 把 PG view 结果缓存 30s, 6 屏共享一次查询。

## 部署 (macmini 全栈)

```bash
docker compose up -d                       # postgres + admin + dashboard + superset + feigua-worker
psql -U postgres -d dashboard -f packages/db/migrations/0000_initial/migration.sql
psql -U postgres -d dashboard -f packages/db/migrations/0001_alert_rules_and_users/migration.sql
python3 scripts/superset-bootstrap.py
```

7 个卷 + 5 个容器 + pgdata 卷持久化. 老 Windows 浏览器访问:
- http://&lt;macmini-ip&gt;:3004  (后台)
- http://&lt;macmini-ip&gt;:3003  (大屏)
- http://&lt;macmini-ip&gt;:8088  (BI)

## 编码坑

- PowerShell `Set-Content -Encoding UTF8` 会把中文变 ?????. 用 `UTF8Encoding($false)` 的 `[IO.File]::WriteAllText`.
- 不要在 5 屏里加搜索/排序/分页 (TV 不能点).
- KPI 永远 6 个 tile, 不够用 — 填充.
- 飞瓜 cookie 只在 .env, 不做 UI.
- sandbox 拦 node 跑; 你本机 `pnpm install` 才能真验证 build.