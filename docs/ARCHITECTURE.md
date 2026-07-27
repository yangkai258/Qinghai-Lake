# data-tw 架构与职责边界

> 目标:让**数据中台只服务稳定的事**,把不断变化的部分(采集、Excel、未来的
> SAP、飞瓜 Cookie 等)隔离在边界外。同事接手时,从这一篇开始读。

## 总体拓扑

```text
            ┌──────────────────────────┐
            │  采集端机器 (任意数量)    │
            │  - 飞瓜采集器            │
            │  - Excel 导入器          │
            │  - 未来 SAP / 第三方     │
            └─────────────┬────────────┘
                          │  HTTPS / 内网 HTTP
                          │  POST /api/ingest-external/<id>
                          │  Authorization: Bearer dtw_ingest_xxx
                          ▼
┌──────────────────────────────────────────────────────────┐
│          中台服务器 (例如 zhuobao)                       │
│                                                          │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │
│   │ admin       │  │ PostgreSQL   │  │ Superset     │    │
│   │ (Next.js)   │  │              │  │ (BI / 报表)  │    │
│   │ :3004       │  │ :5432        │  │ :8088        │    │
│   └──────┬──────┘  └──────┬───────┘  └──────┬───────┘    │
│          │                │                  │           │
│          └────────────────┴──────────────────┘           │
│                          │                               │
│                  ┌───────┴───────┐                       │
│                  │  account_     │                       │
│                  │  snapshots    │                       │
│                  │  EAV + 视图   │                       │
│                  └───────────────┘                       │
│                                                          │
│   ┌────────────────────────────────────────────────┐     │
│   │              本地 LLM 服务 (双 3090)            │     │
│   │   vLLM / Ollama,  Tensor Parallel = 2           │     │
│   │   /v1/chat, /v1/embeddings, /agents/nl2sql     │     │
│   └────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
                          ▲
                          │  内网 HTTP
                          │
            ┌─────────────┴────────────┐
            │  展示 / 业务机器          │
            │  - 电视大屏 (Chrome)     │
            │  - 管理后台浏览器         │
            └──────────────────────────┘
```

## 关键约束

1. **采集端永远不直连 PostgreSQL**。它们只调 HTTP。这意味着:
   - 数据库账号不用下发,集中在中台内部。
   - 任何采集器故障都不会污染数据库。
   - 采集器可以换电脑、换人、换实现,接口保持不变。

2. **数据中台数据库对外不开端口**。`postgres` 只监听 `127.0.0.1`,
   由同一台机器上的 `admin` 提供唯一外部接口。

3. **每一个 source 一把独立的 token**。 token 的 hash 存在
   `sources.ingest_token_hash`;令牌外泄可以单独 rotate,不影响其它源。

4. **数据契约固定为 EAV 行**,存进 `account_snapshots`。半年前不会
   写 SAP,但半年后接入 SAP 不需要 ALTER 视图 — 同一张表就行。

5. **采集端是普通 Node.js / Python / 单文件脚本**。 npm install 在哪台
   机都能跑,只要能访问 admin URL。

## 组件清单

| 组件               | 位置                    | 资源                      |
|--------------------|-------------------------|---------------------------|
| admin (Next.js)    | 中台机器                 | CPU / 内存                |
| PostgreSQL         | 中台机器,只听 127.0.0.1 | CPU / 内存 / NVMe        |
| Superset           | 中台机器                 | CPU / 内存                |
| 本地 LLM           | 中台机器                 | 双 RTX 3090 (TP=2)        |
| 飞瓜采集器         | 任意机器                 | 浏览器侧 (cookie)         |
| Excel 导入器       | 任意办公机器             | 用户行为                   |
| 大屏前端           | 展示机器或电视侧         | 只读访问 admin / dashboard |

## 不应出现的做法

- ❌ 让采集脚本里 `psql -c "INSERT …"`。
- ❌ 把 PostgreSQL 端口暴露到内网。
- ❌ 多台机器共享同一个 `ingest_token`。
- ❌ 在采集器端缓存 eav 行”以备离线”,除非另有明确诉求 — 当前不需要。

## 文件指针

- 写入入口:`apps/admin/src/app/api/ingest-external/[id]/route.ts`
- Token 工具:`apps/admin/src/lib/ingestToken.ts`
- Token 轮转:`POST /api/sources/[id]` (admin cookie 鉴权)
- Collector SDK:`packages/collector-sdk/src/index.ts`
- 飞瓜采集示例:`apps/feigua-worker/src/runner.ts`
- 中台机器部署:见 `deploy/zhuobao/SYSTEMD.md`
- 采集机上手手册:见 `docs/COLLECTOR_NEIGHBOR.md`