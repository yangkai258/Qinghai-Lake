# 运维一页通

> 这一篇给运维同事:端口、文件路径、备份恢复、轮转 token、装新 source。

## 端口(在 zhuobao 上)

| 服务                 | 端口 | 进程 / 路径                                |
|----------------------|-----:|--------------------------------------------|
| admin (Next.js)      | 3004 | `/opt/data-tw/apps/admin`                  |
| dashboard (Next.js)  | 3003 | `/opt/data-tw/apps/dashboard`              |
| PostgreSQL           | 5432 | 只听 `127.0.0.1`,**不暴露内网**          |
| Superset             | 8088 | gunicorn                                   |
| vLLM                 | 7000 | 双卡张量并行                                |
| LLM gateway          | 7010 | FastAPI / 内部契约                          |

## 日志

```bash
journalctl -u data-tw-admin      --since "1 hour ago"
journalctl -u data-tw-dashboard  --since "1 hour ago"
journalctl -u data-tw-vllm       --since "1 hour ago"
journalctl -u data-tw-pgdump     --since "30 days ago"
```

## 备份恢复

```bash
# 备份
ls /var/lib/data-tw/backups/

# 恢复(在另一台机做,绝对不要在生产直接重灌)
zcat /var/lib/data-tw/backups/dashboard_YYYYMMDD_HHMMSS.sql.gz \
  | sudo -u postgres psql -d dashboard
```

备份策略:每天 03:30 本地一次,`PGDUMP_KEEP_DAYS=14` 天内。每天由备份脚本
自动清理超期文件。

## 给采集端发 token

`POST /api/sources/[id]` 需要 admin cookie 登录态。返回的 `token`
是明文,只此一次。再查也只能看到 hash。

```bash
curl -b cookies.txt -X POST http://172.16.120.120:3004/api/sources/feigua
```

## 新加一个 source(例如新的 Excel 流水线)

1. 在 admin 后台 Sources 表加一行:
   - id: `excel:q3_weekly`
   - kind: `excel`(目前 demo 走 inbox 文件),或 `collector`(走 HTTP)。
2. 走 HTTP 的,立刻点 Rotate token,把明文 token 通过线下渠道告诉同事。
3. 同事按 `docs/COLLECTOR_NEIGHBOR.md` 第 3 步配 `.env`,跑。

## 来源不再需要时

- 不要删 source 行 — 历史 run 还在引用它。
- 改 `enabled = false`。前端列表里会自动隐藏。

## 写新 connector / collector

- 内部采集:加 `packages/connectors/src/connectors/<kind>/index.ts`,
  继承 `BaseConnector`,由 `apps/ingestion` 跑,**仍然放数据库所在机器**。
- 外部采集:用 `@data-tw/collector-sdk` 的 `push()`,不必编进 monorepo。