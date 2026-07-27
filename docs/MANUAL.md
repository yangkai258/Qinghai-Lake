# data-tw 项目说明书

> 状态:当前可运行版本(`main`)。任何对架构 / 部署的改动请先改本手册再改代码。
> 给谁看:接手开发的同事、给这台机器做运维的人、以及来对接 SAP/上游系统的合作方。

## 1. 项目定位与边界

`data-tw` 是卓宝集团(以及任何想复用这套数据中台的相似业务)的数据中台:

```text
多源采集(飞瓜 / Excel / 未来 SAP) ->
数据中台(PostgreSQL,统一 EAV 事实表 + 视图) ->
两个出口
  -> 6 个电视大屏(Next.js, 16:9, 浏览器内轮播)
  -> BI / 自助探索(Superset, 只读账号接入)
```

### 1.1 解决的问题

- 现场办公室每天从飞瓜抓账号指标,再粘进 Excel,产物散乱,无时间序列、无沉淀。
- Excel 业务月报需要手工拼图。
- 大屏电视需要 16:9 全屏轮播,夜班无人值守,需要"零交互 + 一次到位"。
- 后续半年计划接入 SAP 公有云,需要一套不会因为 SAP schema 改动而推翻的数据底座。

### 1.2 不做的事情

- 不是实时秒级决策系统。最近数据以 30 分钟级别滞后。
- 不是数据仓库(`data warehouse`)或 BI 报表的替代品。Superset 才是那块板的
  主入口,大屏负责"先抬头看全局"。
- 不在数据中台机器上跑飞瓜采集 / Excel 导入 / 任何抓取循环 — 采集端是
  另一台机器,见 `docs/ARCHITECTURE.md` 与 `docs/COLLECTOR_NEIGHBOR.md`。

### 1.3 一句话职责边界

```text
中台 = 稳定的事;             采集 = 不断变化的事;            SAP = 半年后再加。
数据中台只调 DB,任何外部系统只调中台的 HTTP。
```

### 1.4 仓库与运行时

```text
GitHub 仓库 : yangkai258/Qinghai-Lake   (中文别名:卓宝数据中台)
本机开发路径 : C:\Users\YKing\Documents\data-tw   (本仓库)
服务器路径   : /opt/data-tw             (zhuobao, Ubuntu 26.04, 裸机 systemd)
运行模式     : 本地 docker compose;  服务器裸机 systemd
```

## 2. 架构拓扑

### 2.1 总体拓扑图

```text
                ┌────────────────────────────────┐
                │  采集端机器(任意数量)         │
                │  - 飞瓜采集器                 │
                │  - Excel 导入器               │
                │  - 未来 SAP / 上游 HTTP      │
                └─────────────┬──────────────────┘
                              │  HTTPS / 内网 HTTP
                              │  POST /api/ingest-external/[sourceId]
                              │  Authorization: Bearer dtw_ingest_…
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│            中台机器(本机 docker / 远端 zhuobao 裸机)             │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ admin       │  │ dashboard    │  │ PostgreSQL   │  │ Superset │  │
│  │ Next.js     │  │ Next.js      │  │ EAV + view   │  │ BI       │  │
│  │ :3004       │  │ :3003        │  │ :5432 (内网) │  │ :8088    │  │
│  │ 后台 / API │  │ 6 个电视大屏 │  │              │  │          │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘  └────┬─────┘  │
│         │                │                  │              │        │
│         └────────────────┴──────────────────┘              │        │
│                          │                                 │        │
│                          ▼                                 │        │
│                  ┌──────────────┐                          │        │
│                  │ account_     │                          │        │
│                  │ snapshots    │                          │        │
│                  │ + 视图       │                          │        │
│                  └──────┬───────┘                          │        │
│                         │                                  │        │
│                         ▼                                  │        │
│              ┌────────────────────┐                        │        │
│              │ 本地 LLM(可选)     │                        │        │
│              │ vLLM TP=2 双 3090 │◀──────────────────────────┘       │
│              │ /v1/chat          │                                   │
│              │ /v1/embeddings    │                                   │
│              └────────────────────┘                                   │
└──────────────────────────────────────────────────────────────────────┘
                              ▲
                              │  内网 HTTP
                              │
              ┌───────────────┴──────────────────┐
              │  显示 / 业务机器                 │
              │  - 电视 Chrome 全屏 16:9 大屏   │
              │  - 管理后台浏览器                │
              │  - 业务用户浏览器(BI / 报表)    │
              └──────────────────────────────────┘
```

### 2.2 端口与服务

| 服务              | 端口 | 进程 / 技术             | 作用                    |
|-------------------|-----:|-------------------------|-------------------------|
| admin             | 3004 | Next.js (Node 20+)     | 后台 / 鉴权 / API 入口  |
| dashboard         | 3003 | Next.js (Node 20+)     | 6 个电视大屏            |
| PostgreSQL        | 5432 | pg17                   | 事实表 + 视图           |
| Superset          | 8088 | apache/superset:4.1.0  | BI / 自助报表           |
| ingestion         | —    | Node 服务              | 内部 cron + connector  |
| feigua-worker     | —    | Node 服务              | 飞瓜采集(改写后变 HTTP 推送)|
| 本地 LLM(vLLM)   | 7000 | vLLM tensor-parallel=2 | 自建大模型推理(可选)   |
| LLM gateway       | 7010 | FastAPI                | NL2SQL + 告警摘要(可选)|

### 2.3 数据流三层

```text
原始层     raw        account_snapshots  全量记录,EAV
                                ↓
视图层     view       v_douyin_account_latest  每账号一行(最新值)
                                ↓
应用层     mart       由前端 / Superset / LLM 直接查询
```

不存快照(派生)表 — 万一上游口径有变,只改视图,前端不动。
## 3. 仓库目录与模块

### 3.1 顶层

```text
data-tw/                       本仓库
├── apps/                      6 个独立可运行子项目
│   ├── admin/                 Next.js 后台 + API(:3004)
│   ├── dashboard/             Next.js 大屏(:3003)
│   ├── ingestion/             进程内定时任务
│   └── feigua-worker/         飞瓜采集(改写后通过 SDK 推送)
├── packages/                  共享内部包
│   ├── db/                    Drizzle schema + migrations + 视图
│   ├── connectors/            数据源连接器 runtime(feigua / excel / sap)
│   ├── collector-sdk/         给采集端用的零依赖 HTTP 推送 SDK
│   └── feigua-client/         飞瓜 HTTP 抓取封装
├── deploy/                    部署资产
│   └── zhuobao/               服务器裸机 systemd + 备份脚本
├── docs/                      所有文档(本手册在此)
│   ├── MANUAL.md              你正在读这篇
│   ├── ARCHITECTURE.md        拓扑 + 职责边界
│   ├── COLLECTOR_NEIGHBOR.md  采集机同事上手指南
│   ├── OPERATIONS.md          运维一页通
│   ├── SUPERSET.md            Superset 接入操作
│   └── SCREENS_TO_SUPERSET.md 待写:六屏 -> BI 切片对照表
├── scripts/                   开发期脚手架 / 调试脚本
├── docker-compose.yml         本机一键起全套
├── Dockerfile.admin           admin 容器
├── Dockerfile.dashboard       dashboard 容器
├── Dockerfile.feigua-worker   feigua-worker 容器
├── pnpm-workspace.yaml        monorepo 配置
├── package.json               根脚本入口
├── .env                       本机 DB / cookie / secret (不进 git)
└── AGENTS.md                  给模型的工作规则
```

### 3.2 apps/admin 的 API 路由

```text
apps/admin/src/app/api/
├── auth/
│   ├── login/   POST   cookie 登录
│   ├── logout/  POST
│   ├── setup/   POST   首次启动建超级管理员
│   └── password/POST  改密码
├── sources/
│   └── [id]/
│       ├── PATCH  改 enabled / cron / config / displayName
│       └── POST   rotate-token    发一把新的 dtw_ingest_…
├── ingest/
│   └── [id]/
│       ├── POST   内部:跑一次 connector,落 account_snapshots
│       └── fixture/POST  落 mock inbox 文件用于测试
├── ingest-external/
│   └── [id]/
│       ├── POST   外部 collector 推送写入(见 2.3)
│       └── GET    健康检查
├── alerts/
│   ├── bootstrap/POST  建默认告警规则
│   └── tick/    POST    立即跑一次告警评估器
└── debug-auth/   内部:健康检查 + 当前会话
```

### 3.3 apps/dashboard 的路由

```text
apps/dashboard/src/app/
├── /                                  6 屏 + 轮播主页
├── /screen/exec                       屏 1  高层概览
├── /screen/ops                        屏 2  运营总览
├── /screen/content                    屏 3  内容运营
├── /screen/full                       屏 4  全域账号
├── /screen/trend                      屏 5  趋势分析
├── /screen/geo                        屏 6  区域分布(以 dept 为轴)
└── /superset                          iframe 嵌 Superset
```
## 4. 数据模型

> 物理表 + 视图共 8 个对象,全部在 `packages/db/migrations/*`、`packages/db/src/schema/*`、`packages/db/src/schema/views.sql`。
> 连接器只看事实表,前端 / Superset 只看视图。

### 4.1 物理表

```text
users          管理员账号(supperadmin / admin)
sources        数据源注册表(feigua / excel / sap / collector)
ingestion_runs 每次采集一次一行(无论成败)
account_snapshots 事实表(EAV),全量历史
alert_rules    告警规则阈值(declared)
alerts         已触发的告警(可手动 resolve)
```

### 4.2 account_snapshots(EAV 事实表)字段

| 字段           | 类型             | 含义                                        |
|----------------|------------------|---------------------------------------------|
| id             | bigserial        | PK                                          |
| sourceId       | text             | sources.id 的外键                          |
| capturedAt     | timestamptz      | 数据源报告的时间(不是服务器收到的时间)     |
| entityKind     | text             | `douyin_account` / `sap_material` / 等     |
| entityId       | text             | 业务主键(账号名 / 物料号)                  |
| metricName     | text             | `plays_inc` / `fans_total` / 等             |
| metricValue    | numeric(24,6)    | 数值;优先 numeric,字符串值走 valueStr      |
| dims           | jsonb            | dept / person / status / collector …        |

**唯一索引**:`(entityKind, entityId, metricName, capturedAt)` — 同一刻同一指标只能有
一行,重复推送会被 `onConflictDoNothing()` 忽略,天然幂等。

### 4.3 视图 v_douyin_account_latest

```text
字段名           业务含义
─────────────────────────────────────────────────
account_name     业务主键(账号名)
douyin_name      抖音昵称
dept             部门
person           负责人
status           live / warn / dead
plays_inc        本周播放增量
like_count       本周点赞增量
fans_total       粉丝总数
fans_inc         粉丝净增
works_total      累计作品数
rate             转化率 (0..1)
captured_at      最新采集时间
```

### 4.4 sources.ingest_token_hash

`text` 列,只存 SHA-256。原始 token 只在发放时返回一次。

```text
格式   dtw_ingest_<24 bytes base64url>
长度   38 字符
发放   POST /api/sources/[id] (admin cookie 鉴权)
使用   Authorization: Bearer <token>
校验   sha256(token) === sources.ingestTokenHash
轮转   POST /api/sources/[id] 一次,旧 token 立刻失效
```

### 4.5 数据契约(给采集端用)

```json
{
  "capturedAt": "2026-07-21T08:00:00Z",
  "rows": [
    {
      "entityKind": "douyin_account",
      "entityId":   "陶宝华西",
      "entityName": "陶宝华西",
      "metricName": "fans_total",
      "value":      528000,
      "dims":       { "dept": "华北工厂", "person": "李大宝", "status": "live" }
    }
  ]
}
```

- `value` 必须是 `number`,或用 `valueStr`(字符串值)
- `dims` 是自由 jsonb,业务方加额外维度直接放这里,不必改 schema
- 服务端拒收超过 5000 行的 batch;采集端分批,推荐每批 500 行
## 5. 六个电视大屏

### 5.1 屏幕与排序

| 屏    | URL                       | 数据源 `getScreenN`  | 排序主键  | 关键组件                           |
|-------|---------------------------|----------------------|-----------|------------------------------------|
| 1     | `/screen/exec`            | getScreen1           | —         | Sparkline / RankList / KpiStrip    |
| 2     | `/screen/ops`             | getScreen2           | playsInc DESC | TOP 5 列表 / 增量条                  |
| 3     | `/screen/content`         | getScreen3           | worksTotal DESC | 作品数 TOP 10 / 横条                  |
| 4     | `/screen/full`            | getScreen4           | fansTotal DESC | 粉丝总量 / 长排行榜                   |
| 5     | `/screen/trend`           | getScreen5           | rate DESC  | 按部门聚合 / 趋势分布                |
| 6     | `/screen/geo`             | getScreen6           | fansInc DESC  | 按 dept 排序 / 区域汇总              |

六屏**共用一个数据源**:`adapter.getLatest()`,内部用 `next/cache` 的
`unstable_cache` 30 秒 TTL 缓存视图查询结果。

### 5.2 缓存策略

```text
页面                     adapter.getLatest()
                              ↓ 30s TTL 缓存
                         SELECT * FROM v_douyin_account_latest
                              ↓
                 6 个 page.tsx 用同一个 cached result 切片
```

```text
代码位置
apps/dashboard/src/lib/adapter.ts    cache(…, { revalidate: 30, tags: ["douyin"] })
apps/dashboard/src/lib/db.ts          直连 postgres-js 单连接
apps/dashboard/src/lib/fillKpi.ts     每屏按自己的口径组装 KPI
apps/dashboard/src/app/screen/*/      每个屏一个 page.tsx
```

### 5.3 刷新路径

- 默认 30 s 周期自动重渲染。
- 强制刷新:在采集端触发了任何 `ingestion run 成功` 后,后端向 Next.js
  打 `revalidateTag("douyin")`(尚未实现 — 当前靠 30s TTL 兜底)。
- 浏览器手动刷新等同 30s TTL 重计算。

### 5.4 大屏渲染细节

- 所有屏使用同一个 `TvStage` 布局组件,锁 16:9 自适应,无控件、无滚动条。
- `TvScreen` 顶部带告警红丸(`alertCount`),数据来自
  `alerts WHERE resolved = false` 的 `count(*)`。
- KPI 由 `apps/dashboard/src/lib/fillKpi.ts` 按屏组装:
  - `fillOpsKpi`   — 播放/点赞/粉丝净增
  - `fillFullKpi`  — 总量
  - `fillContentKpi` — 作品数
  - `fillTrendKpi` — 转化率
  - `fillGeoKpi`    — 增量
- 中文乱码:页面 `.tsx` 里的标题字符串为 UTF-8,如果 Windows 终端用
  `Get-Content` 看到乱码,以浏览器页面上看到的为准。

### 5.5 大屏不响应交互

大屏没有点击响应。鼠标进入区域,如果误触到 dev tools,刷新 `F5` 回到
当前屏。生产模式:`force-dynamic`,服务器看的是最新结果。
## 6. 后台管理系统 admin

### 6.1 登录与权限

- 默认超级管理员:`admin@local`
- 默认密码:首次启动时通过环境变量 `ADMIN_BOOTSTRAP_PASSWORD` 注入,
  缺省随机生成并打 console 日志。
- 角色:
  - `superadmin` — 管用户、alter password、看所有 source
  - `admin` — 改自己密码、看自己 scope 内 source

- 登录态:cookie `data_tw_session`,HS256 JWT 签,TTL 12h。

```text
代码
apps/admin/src/lib/auth.ts      login/logout/requireSession
apps/admin/src/middleware.ts    matcher 整站保护(/api/auth/* 与 /login 与 static 之外)
```

### 6.2 路由概览

```text
/(admin)/        首页 / 登录后入口
/(admin)/sources source 注册与运行状态
/(admin)/runs    采集 run 历史
/(admin)/alerts  告警规则与历史
/(admin)/        ... 后续会加 snapshot 管理界面、用户管理、SAP 配置
```

### 6.3 鉴权策略

| 入口                       | 鉴权方式                                |
|----------------------------|------------------------------------------|
| 浏览器页面                 | cookie `data_tw_session`                 |
| 内部 `POST /api/ingest/[id]` | cookie(admin)或 cron runner             |
| 外部 `POST /api/ingest-external/[id]` | `Authorization: Bearer <token>`          |
| 其它 `PATCH /api/sources/[id]` | cookie 仅 (rotating token 走 POST)       |

### 6.4 新建 source 后会看到什么

```sql
-- 1) 插入一行
INSERT INTO sources(id, kind, display_name, enabled, config, cron_expr)
VALUES('excel:weekly_q3','excel','本周业绩',true,'{}','0 */15 * * *');

-- 2) 浏览器后台 Sources 页面自动出现,可不点任何按钮

-- 3) 用 cron 走:由 apps/ingestion 启动时遍历 enabled + cron_expr
--    用 HTTP 走:浏览器点 Rotate token,把 token 发给同事
```
## 7. 数据采集:连接器 / 采集端

### 7.1 两套采集侧

| 采集侧            | 谁来调                       | 直连 PG?  | 鉴权           | 推荐场景                       |
|-------------------|------------------------------|-----------|----------------|--------------------------------|
| 内部 connector    | `apps/ingestion`            | 是        | DB 直连        | 在中台机器跑的可靠源           |
| 外部 collector    | 任意机器上的 Node 脚本       | 否        | bearer token   | 不在中台机器 / 跨网络 / 桌面工具|

外部 collector 优先。本节重点在这。

### 7.2 外部 collector 一次性流程

```bash
# 1) 拿 token(管理员在浏览器后台 Sources -> 点 Rotate token, 把返回的明文给你)
#    示例 TOKEN = dtw_ingest_AbCdEf_…

# 2) 任意机器装 Node 20+

# 3) 写 .env
echo 'DATA_TW_ADMIN_URL=http://172.16.120.120:3004'   > .env
echo 'DATA_TW_SOURCE_ID=feigua'                        >> .env
echo 'DATA_TW_INGEST_TOKEN=dtw_ingest_AbCdEf_…'        >> .env
echo 'FEIGUA_COOKIE=…'                                  >> .env
echo 'INGEST_CRON_FEIGUA=0 */1 * * *'                   >> .env

# 4) 跑
pnpm --filter @data-tw/feigua-worker start
```

### 7.3 SDK 用法概要

```ts
import { push } from "@data-tw/collector-sdk";
const r = await push({
  baseUrl:  "http://172.16.120.120:3004",
  token:    "dtw_ingest_…",
  sourceId: "feigua",
  rows: [
    { entityKind: "douyin_account", entityId: "陶宝华北",
      metricName: "fans_total", value: 528000,
      dims: { dept: "华北工厂", person: "李大宝" } },
    /* … 一次最多 5000 行 … */
  ],
});
if (r.ok) console.log(r.rows, r.runId);
else      console.error(r.status, r.error);
```

### 7.4 现有连接器

| 源      | 实现位置                                  | 说明                                 |
|---------|-------------------------------------------|--------------------------------------|
| feigua  | `packages/feigua-client/src` + `apps/feigua-worker/src/runner.ts` | 抓飞瓜 web,EAV 行再 POST SDK |
| excel   | `packages/connectors/src/connectors/excel/index.ts` | inbox 文件 → EAV 行,中台内 cron 跑 |
| sap     | `packages/connectors/src/connectors/sap/index.ts`   | 当前是 stub,半年内完成  |

### 7.5 加新采集源 checklist

1. 注册新 `sources` 行 (`kind` 用已有枚举 / 新加)。
2. 决定采集侧:HTTP 还是 inbox。
3. 选择 `packages/connectors`(中台内)或者 `@data-tw/collector-sdk`(外部)。
4. 将采集结果映射成 EAV 行后写入。
5. 用一个 mock account 跑一次 `/api/ingest-external/<id>` 走完流程。
6. 在 admin Sources 页验证 `lastRunAt` + `lastStatus` 字段更新。

### 7.6 故障自检

```text
401 invalid token    token 没对上,或者被 rotate 过
403 source disabled  管理员在后台关了 source
400 bad row          字段不合格,看 coerceRow 规则
413 too many rows    > 5000 行,SDK 默认分批 500
500 server error     中台进程挂了,看 journalctl
```
## 8. Superset 与 BI

### 8.1 关系

```text
六屏 — Next.js,  16:9 锁定, 电视端,  zero-click
BI   — Superset, 任意尺寸, 任意交互, 业务用户

两者共用一个事实集, 但**不互相调用**。
```

六屏 + Superset 都直接读 `v_douyin_account_latest`,口径一致,数据
一致性自动保证。

### 8.2 启用 Superset

```bash
# 1) 起 postgres 和 admin / dashboard
pnpm dashboard:build
pnpm admin:build
docker compose up -d postgres admin dashboard superset

# 2) 一次性建只读账号
psql -U postgres -d dashboard -f packages/db/setup-superset.sql

# 3) 浏览器进入 Superset
http://localhost:8088                        默认 admin / admin
Database URI: postgresql://superset:superset_readonly_2026@postgres:5432/dashboard
Dataset:     public.account_snapshots     (EAV)
Dataset:     public.v_douyin_account_latest (推荐:业务宽表)
```

### 8.3 把六屏的"口径"在 Superset 里复刻

文档 `docs/SCREENS_TO_SUPERSET.md` 待写。预期内容:每一屏列出
使用到的指标 / 维度 / 排序 / 关键 SQL,同事可一比一在 Superset 里
建 chart 与 dashboard。

### 8.4 不要在 Superset 上做的事

- 不要在 Superset 里直接 DDL — 它只用 `superset` 只读账号。
- 不要让六屏离开 `apps/dashboard` 单独跑在 Superset — 视觉风格、动画、
  16:9 锁定、自动轮播行为做不到。

### 8.5 iframe 内嵌 Superset

dashboard 后台 `/superset` 路由 iframe 直接嵌 Superset 主页(前提:
`NEXT_PUBLIC_SUPERSET_BASE` 已设,且 Superset 的 `ALLOWED_HOST` 加
admin 来源)。
## 9. 告警引擎

```text
代码位置
packages/connectors/src/alerts/evaluator.ts   评估器
packages/connectors/src/cli/alert-tick.ts     可手动 tick 的 cli
apps/admin/src/app/api/alerts/tick/route.ts   POST /api/alerts/tick
apps/admin/src/app/api/alerts/bootstrap/route.ts 默认规则 bootstrap
```

### 9.1 规则表(alert_rules)

```text
kind 取值                       threshold 含义
dead_count_ge                   dead 账号数阈值
warn_count_ge                   warn 账号数阈值
fans_inc_total_lt               总粉丝增量下限
rate_avg_lt                     平均转化率下限
… 后续可新增,见 evaluator.ts
```

字段:

| 字段        | 含义                                          |
|-------------|-----------------------------------------------|
| id          | 规则 ID                                        |
| name        | 给人看的名字                                   |
| enabled     | `true` / `false`,文本形式                    |
| kind        | 见上表                                         |
| threshold   | 数值                                           |
| severity    | `info` / `warn` / `bad`                      |
| scope       | `all` / `<dept_name>`                         |
| created_at  | 建表时间                                       |

### 9.2 触发流程

```text
POST /api/alerts/tick
   ↓
evaluator 遍历所有 enabled 规则
   ↓
对每条规则跑对应计算
   ↓
超过阈值  → INSERT INTO alerts(...)
   ↓
大屏 TvScreen 顶部 alertCount 红旗 → 30s TTL 自动更新
   ↓
admin 后台 /alerts 手动 resolve
```

### 9.3 如何加一类规则

1. `evaluator.ts` 加一个 `case` 分支。
2. `packages/db/scripts/setup.ts` 已经把表建好,不用改 schema。
3. 用 `POST /api/alerts/bootstrap` 落一批默认规则。
4. 触发一次 `POST /api/alerts/tick` 验证。
## 10. 部署与运行

### 10.1 本机开发(Windows)

```bash
git clone https://github.com/yangkai258/Qinghai-Lake
cd Qinghai-Lake
corepack enable && corepack prepare pnpm@11.7.0 --activate
pnpm install
docker compose up -d postgres
pnpm db:setup                          # 应用所有 migrations 0000..0002
pnpm db:seed                           # 30 个 mock 账号
docker compose up -d admin dashboard superset
```

入口:

```text
http://localhost:3004    后台       默认 admin@local
http://localhost:3003    大屏       /screen/exec, /screen/ops, ...
http://localhost:8088    Superset  admin/admin
```

### 10.2 中台机器:zhuobao(裸机)

| 步骤                     | 文件 / 命令                                                                                          |
|--------------------------|-------------------------------------------------------------------------------------------------------|
| 迁显示器到核显            | BIOS Primary Display = Integrated Graphics                                                          |
| 克隆并装依赖              | `git clone … /opt/data-tw && pnpm install --prod`                                                    |
| 建数据库 / 灌 schema      | `psql -f packages/db/migrations/0000_…/migration.sql` 三次 + `setup-superset.sql`                   |
| postgres 监听本机         | `listen_addresses = '127.0.0.1'`                                                                    |
| 装 systemd                | `install -m 0644 deploy/zhuobao/systemd/*.service /etc/systemd/system/`                              |
| 启服务                    | `systemctl enable --now data-tw-{admin,dashboard,superset,vllm,llm-gateway,pgdump.timer}`           |
| 验                        | `curl -sf http://127.0.0.1:3004/api/debug-auth && echo admin up`                                  |

详细文档:`deploy/zhuobao/SYSTEMD.md`。

### 10.3 systemd 单元清单

```text
data-tw-admin.service           Next.js 后台  :3004
data-tw-dashboard.service       Next.js 大屏  :3003
data-tw-superset.service        Superset      :8088
data-tw-vllm.service            vLLM TP=2     :7000  (需要 GPU)
data-tw-llm-gateway.service     FastAPI       :7010  (可选)
data-tw-pgdump.service          oneshot
data-tw-pgdump.timer            每日 03:30 Asia/Shanghai
```

### 10.4 环境变量

```text
DATABASE_URL                         postgres://postgres:postgres@127.0.0.1:5432/dashboard
ADMIN_JWT_SECRET                     必填,32 字节随机
ADMIN_BOOTSTRAP_PASSWORD             仅首次启动生效
FEIGUA_COOKIE                         飞瓜 web 的会话 cookie
FEIGUA_BASE_URL                       默认 https://www.feigua.cn
FEIGUA_INBOX                          本地落盘目录(已弃用, 保留兼容)
INGEST_CRON_FEIGUA                    默认 0 */1 * * *
INGEST_CRON_EXCEL                     默认 0 */15 * * *
EXCEL_WATCH_DIR                       Excel 自动扫描目录
LOG_LEVEL                             info / debug
NEXT_PUBLIC_DASHBOARD_BASE            http://localhost:3003
NEXT_PUBLIC_SUPERSET_BASE             http://localhost:8088
SAP_BASE_URL / SAP_USER / SAP_PASSWORD 后续接入
CUDA_VISIBLE_DEVICES                   "0,1"
VLLM_CACHE_ROOT                       /var/lib/data-tw/llm-models
```

### 10.5 验收 checklist(任何部署之后必跑)

```text
[ ] admin   能登录,改自己密码 OK
[ ] 后台 /sources 看到默认 source 行 (feigua, excel)
[ ] /sources 里点 Rotate token 拿到 dtw_ingest_ 前缀的 token
[ ] 大屏 /screen/exec 渲染非空
[ ] 6 屏都能看到(无白屏)
[ ] 浏览器 console 无报错
[ ] curl /api/alerts/tick 收到 200 且 alerts 表里多一行(至少默认规则触发一次)
[ ] curl postgres 直连在外部 IP 失败(只听 127.0.0.1)
[ ] curl https://api/superset/health 正常
```

### 10.6 不要做的事

- 不要把 postgres 端口暴露到 0.0.0.0。
- 不要在 zhuobao 上跑 `apps/feigua-worker`(它的环境是飞瓜 cookie,
  不要污染中台)。
- 不要在 zhuobao 上跑任何 docker / podman。
- 不要在生产用 `ADMIN_JWT_SECRET` 默认值。
## 11. 备份与恢复

### 11.1 备份策略

```text
触发器:  data-tw-pgdump.timer        每日 03:30 Asia/Shanghai
脚本:    /usr/local/bin/pgdump-nightly.sh
输出:    /var/lib/data-tw/backups/dashboard_YYYYMMDD_HHMMSS.sql.gz
保留:    14 天
内容:    pg_dump 全文, --no-owner --no-privileges
```

### 11.2 手动备份

```bash
pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip -9 \
  > /var/lib/data-tw/backups/manual_$(date +%Y%m%d_%H%M%S).sql.gz
ls -lh /var/lib/data-tw/backups/
```

### 11.3 恢复

```bash
# 中台机器本机
zcat /var/lib/data-tw/backups/dashboard_20260727_033000.sql.gz \
  | sudo -u postgres psql -d dashboard

# 远程另一台机做演练
zcat dashboard_20260727_033000.sql.gz \
  | psql "postgres://postgres@127.0.0.1:5432/dashboard_restore"
```

### 11.4 不要把备份当审计

- 备份只防物理机磁盘故障
- 不防"管理员误删行" — 这种场景用 pg_audit / wal 归档,有需要再加
- 不防泄露 — 备份文件权限 0600,与服务器登录态等价

## 12. 常见问题与释放

### 12.1 启动报错

```text
no module 'pg_dump'                apt install postgresql-client-17
listen_addresses already in use    改 /etc/postgresql/17/main/postgresql.conf
admin 401                          检查 middleware.ts 没被改名
dashboard 白屏                     多半是数据库里 v_douyin_account_latest 还没建
```

### 12.2 采集侧报错

```text
401 missing token                  Authorization 头忘记打
401 invalid token                   token 被 rotate 过,找管理员重发
400 rows[] is required              body 形状不对
413 too many rows                   调小 SDK batchSize
413 source disabled                 管理员关了 source
500 source not found                sourceId 拼写错
```

### 12.3 大屏渲染异常

```text
白屏                看 view 是否有数据(admin /sources 查 lastRunAt)
KPI 全 0            数据没进来,看 ingestion_runs.status
view not found      pnpm db:setup 全部 migrations 都跑了
console error       清浏览器缓存再开
```

### 12.4 Superset 连不上

```text
FATAL: role "superset" does not exist      没跑 packages/db/setup-superset.sql
unable to access 8088 from browser         firewall / 只听 127.0.0.1
```

### 12.5 同事最常问的三个问题(贴答案)

```text
Q: 我应该改哪个文件 ?
A: 一句话 — 后台行为到 apps/admin,大屏视觉到 apps/dashboard,
   数据库加列先加 migration 后改 schema,文档同步改 docs/。

Q: 我加一类指标怎么走 ?
A: 加 metricName(string)就行,不用改 schema。dims 里装其它维度。
   新加 status / entityKind 之外的业务场景前,先讨论 schema 改动。

Q: 我怎么加一个 source ?
A: INSERT 一行 sources(id, kind, display_name, enabled, config, cron_expr)。
   内部由 apps/ingestion 收;外部走 Rotate token。
```

---

## 13. 文档索引

| 文件                                            | 主题                                            |
|-------------------------------------------------|-------------------------------------------------|
| `docs/MANUAL.md`(本文)                          | 完整说明书                                      |
| `docs/ARCHITECTURE.md`                          | 拓扑 + 职责边界                                 |
| `docs/COLLECTOR_NEIGHBOR.md`                    | 采集机同事上手                                  |
| `docs/OPERATIONS.md`                            | 运维一页通(端口 / token / 备份)               |
| `docs/SUPERSET.md`                              | Superset 接入操作                              |
| `docs/SCREENS_TO_SUPERSET.md`                  | 六屏 → BI 切片对照                              |
| `deploy/zhuobao/SYSTEMD.md`                     | 服务器装机手册                                  |
| `AGENTS.md`                                     | 给模型的工作规则                                |
| `README.md`                                     | 一句话定位 + 文档索引                           |

## 14. 变更与版本

本手册随仓库一起改。任何可见行为改动,本节追加一条:

```text
yyyy-mm-dd   改了啥 / 影响的文件 / 是否需要重跑 migrations
```