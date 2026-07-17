# data-tw

卓宝数据中台 · pnpm monorepo · 4 个进程 + 1 个 DB.

## 进程表

| 进程              | 端口 | 角色                                           |
|-------------------|------|------------------------------------------------|
| `apps/admin`      | 3004 | 后台：登录 / 数据源 / 事实点 / 预览 / Superset iframe |
| `apps/dashboard`  | 3003 | 6 屏 + 轮播首页 (1920x1080 锁屏)              |
| `apps/ingestion`  | —    | 长驻 cron runner，从飞瓜 inbox 抓数据         |
| Superset          | 8088 | BI 报表 (apache/superset:4.1.0)               |
| PostgreSQL 17     | 5432 | 数据存储                                       |

## 状态 (2026-07-14)

全链路跑通：
- PG schema + 视图 v_douyin_account_latest 已就绪
- 30 个 mock 账号 + 180 个事实点
- 后台、Dashboard、Ingestion、Superset 都能从 PG 读
- Superset 用只读账号 `superset` (无 INSERT/UPDATE/DELETE 权限)

## 文件分布

- `apps/admin`     24 文件 (含 7 个 tab + 6 个 api 路由)
- `apps/dashboard` 38 文件 (5 屏 + 轮播 + 9 个 react-bits + map)
- `apps/ingestion`  2 文件 (runner 薄壳)
- `packages/db`     9 文件 (schema + push.sql + reseed-mock.sql + setup-superset.sql)
- `packages/connectors` 12 文件 (feigua/excel/sap + registry)
- `scripts/`        5 个 .cmd (start-db/dashboard/admin/ingestion/all + stop-all)
- `docs/SUPERSET.md` 接入文档
- `docker-compose.yml` 4 容器 + Dockerfile.{admin,dashboard}

## 已知的简化 (ponytail 留的注释)

- MapLibre region: 用 `dept` 当地域. SAP 上线后换 `dims.region`.
- `accounts` 表 status: SAP 上线后扩 entity_kind.
- seed-mock: 30 个抖音号是生成出来的，不来自真飞瓜.

## 不要再做的事

- 不要碰 `C:\Users\YKing\Documents\数据大屏\` (原 Flask 项目，独立保留)
- 不要在 `.env` 提交真实 cookie / password