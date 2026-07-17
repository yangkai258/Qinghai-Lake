# Superset 接入

## 1. 一次性建只读角色（用 postgres 账号）
```
psql -U postgres -d dashboard -f packages/db/setup-superset.sql
```
会建 `superset` 用户，密码 `superset_readonly_2026`，`SELECT` 权限。

## 2. Docker compose 起 superset
```
docker compose up -d superset
```
默认 bootstrap：
- Database URI: `postgres://superset:superset_readonly_2026@postgres:5432/dashboard`
- 默认 admin/admin

## 3. 在 Superset 里手动建 dataset
- Settings → Database Connections → + DATABASE
  - URI: `postgres://superset:superset_readonly_2026@postgres:5432/dashboard`
- Datasets → + DATASET
  - Database: 刚建的
  - Schema: public
  - Table: `account_snapshots` 或 `v_douyin_account_latest`（推荐用视图）

## 4. 加一张示例 dashboard
Charts → + CHART → Pick Dataset → Bar chart
- Dimensions: dept
- Metrics: SUM(metric_value) where metric_name in (plays_inc, fans_total, …)
- 命名 "部门播放/粉丝汇总"，存。
- 然后把它加到一个新 Dashboard "抖音运营" 里。

## 5. 通过 admin 后台访问
直接进 admin (/superset)，iframe 嵌 Superset。如果 admin 与 dashboard 不同主机，确保 superset 的 ALLOWED_HOST 已加入 admin 域，或用反向代理。

## 修改默认账号
docker-compose.yml 改 ADMIN_USERNAME / ADMIN_PASSWORD，再起。