# data-tw 卓宝数据中台

完整后台 + 数据大屏 + BI + 告警。PostgreSQL 17 + Drizzle + Next.js 15 + Superset + react-bits。

## 全景

```
[feigua-crawler]   ->   /var/inbox/feigua/*.json
                          ->   [apps/feigua-worker]  (hourly, real feigua fetch or synthetic)
                          ->   inbox JSON files
                          ->   [apps/ingestion]     (node-cron scheduler)
                          ->   loadSnapshots() -> PG account_snapshots + ingestion_runs
                          ->   v_douyin_account_latest (view)

                                              ->   [apps/dashboard]    [apps/admin]      [Superset]
                6 TV screens (16:9)        sources / facts /        6 charts + 1 dashboard
                auto-rotator home          alerts / ingest         auto-bootstrapped
                map + react-bits          control                 scripts/superset-bootstrap.py
                                            reseed mock + UI        click to fire ingest
```

## 服务清单

| 服务                  | 端口 | 作用                                                         |
|----------------------|-----:|--------------------------------------------------------------|
| apps/admin           | 3004 | 后台登录 / source 配置 / 采集 run / 告警规则 / Superset iframe |
| apps/dashboard       | 3003 | 6 个电视大屏 (1920x1080 锁屏) + 首页自动轮播                |
| apps/ingestion       |   -- | cron runner:调 connectors,写 PostgreSQL                      |
| apps/feigua-worker   |   -- | 每小时拉飞瓜 (cookie 私有) -> 写 inbox 或 HTTP 推送          |
| Superset             | 8088 | BI / 报表                                                    |
| PostgreSQL 17        | 5432 | 4 张表 + 视图 + Superset 只读账号 + alert 引擎              |

## 一次性安装

```bash
pnpm install
pnpm db:setup                                       # 应用所有 migrations 0000..0002
pnpm db:seed                                        # 灌入 30 个 mock 抖音账号
psql -U postgres -d dashboard -f packages/db/setup-superset.sql
```

## 开发启动 (一开 4 终端)

```bash
# T1: dashboard (前台 + 大屏)
pnpm dashboard:dev    # -> http://localhost:3003

# T2: admin (后台)
pnpm admin:dev        # -> http://localhost:3004 (首次走 setup wizard)

# T3: ingestion
pnpm ingest:start     # cron runner

# T4: feigua-worker
pnpm feigua:start     # 每小时拉飞瓜; cookie 写 .env

# Superset
docker compose up -d superset
python3 scripts/superset-bootstrap.py
```

## Superset 6 大屏

`scripts/superset-bootstrap.py` 自动建:

- 数据库:data-tw (连只读账号)
- Dataset:`v_douyin_account_latest`
- 6 charts:
  - 高层决策屏 (big_number_total)
  - 运营作战屏 (table)
  - 内容生产屏 (bar by dept)
  - 全量账号屏 (table)
  - 部门趋势屏 (stacked bar)
  - 区域分布屏 (pivot_table)
- 1 dashboard:`data-tw-screens`

后台 -> 数据大屏预览 -> Superset 大屏主区 + fallback 到 dashboard 6 屏。

## 告警引擎

`packages/connectors/src/alerts/evaluator.ts` 每分钟 cron 评估,命中的写 `alerts` 表 (dedupe by rule_id unresolved)。

规则 kind:
- `dead_count_ge`     停播账号数 >= threshold
- `warn_count_ge`     预警账号数 >= threshold
- `rate_avg_lt`       平均完播率 < threshold
- `fans_inc_total_lt` SUM 新增粉丝 < threshold
- `dead_pct_ge`       停播占比 >= threshold (0..1)

后台 -> 告警 -> 一次性插入 3 条默认规则。立刻评估。Dashboard 顶栏右上角 tag 闪。

## 视觉 (dashboard)

深邃藏蓝 (`#050b18`) 锁 1920x1080,body cursor:none。react-bits 组件在 `apps/dashboard/src/components/rb/`:
- Aurora          -- 全屏径向渐变流光
- Threads         -- SVG 粒子线
- MagnetLines     -- Panel 装饰对角网格
- CountUp         -- KPI 数字滚动
- ElectricBorder / GradientText / ShinyText / BlurText / GlareHover -- 备用

## Performance / Cache

`apps/dashboard/src/lib/adapter.ts` 用 Next.js `unstable_cache` 把 PG view 结果缓存 30s,6 屏共享一次查询。

## 部署 (macmini 全栈)

```bash
docker compose up -d          # postgres + admin + dashboard + superset + feigua-worker
pnpm db:setup
python3 scripts/superset-bootstrap.py
```

7 个卷 + 5 个容器 + pgdata 卷持久化。给 Windows 浏览器访问:
- http://<macmini-ip>:3004  (后台)
- http://<macmini-ip>:3003  (大屏)
- http://<macmini-ip>:8088  (BI)

## 编码注意

如果用 PowerShell 编辑本仓库里的 `.md` 文件,**不要**用 `Set-Content -Encoding UTF8`,在某些 Windows 版本上会破坏中文。改用:

```powershell
[IO.File]::WriteAllText(
  $path,
  $content,
  [Text.UTF8Encoding]::new($false)
)
```

或者直接用 Visual Studio Code / Notepad++ 等明确支持 UTF-8 无 BOM 的编辑器。

## 职责边界

- 数据中台 = admin / dashboard / PostgreSQL / Superset / 本地 LLM,放在
  `zhuobao`(裸机,Ubuntu 26.04,双 3090 跑 vLLM)。
- 采集端 = `apps/feigua-worker` / 其它采集脚本,跑在**任意机器**,只通过
  `POST /api/ingest-external/<id>` 写入,从不直连 PostgreSQL。
- 详细请阅读 `docs/ARCHITECTURE.md` 和 `docs/COLLECTOR_NEIGHBOR.md`;
  运维侧看 `docs/OPERATIONS.md`;服务器部署看 `deploy/zhuobao/SYSTEMD.md`。

## 完整说明书

新同事请先读 **`docs/MANUAL.md`** —— 包含架构 / 数据模型 / 六屏 / admin / 采集 / Superset / 告警 / 部署 / 备份 / 常见问题 14 章。
本页只放仓库简述和指针。