# 给采集机同事的上手指南

> 你只需要做三件事:复制一个 token,装 Node 18+,跑一个脚本。其余全在中台侧。

## 1. 你要拿到的两样东西

- **中台地址**:形如 `http://172.16.120.120:3004`。
- **ingest token**:形如 `dtw_ingest_…`(24 字节随机 base64url)。

由中台管理员在 admin 后台 / Sources 页点 `Rotate token` 给你,**只发一次**。
请把 token 存到机器上的 `.env`,不要发群,不要写 git。

## 2. 一台新机器的开机步骤

```bash
# 安装 Node 20+ (Ubuntu 可用 fnm/nvm/mise;任意一种皆可)
node --version  # 应 >= 20

# clone 项目,把仓库裁剪到只装 collector 所需依赖
git clone https://github.com/yangkai258/Qinghai-Lake.git
cd Qinghai-Lake
corepack enable && corepack prepare pnpm@11.7.0 --activate
pnpm install --filter @data-tw/feigua-worker...
```

## 3. 写一份 `.env`

把 token 和中台地址写进 `apps/feigua-worker/.env`:

```env
DATA_TW_ADMIN_URL=http://172.16.120.120:3004
DATA_TW_SOURCE_ID=feigua
DATA_TW_INGEST_TOKEN=dtw_ingest_…你的…
INGEST_CRON_FEIGUA=0 */1 * * *
FEIGUA_COOKIE=…从飞瓜 web 控制台拿…
FEIGUA_BASE_URL=…(留空 = 走 synthetic / mock 数据)…
LOG_LEVEL=info
COLLECTOR_NAME=$(hostname)
```

## 4. 跑一次冒烟测试

```bash
pnpm --filter @data-tw/feigua-worker dev
```

第一次会自动 tick 一次并往中台推。看到日志里有:

```text
{"level":20,"runId":42,"rows":1234,"accounts":30,"msg":"feigua push ok"}
```

就说明通了。每小时跑一次(默认 cron)。

## 5. Windows 上更省事的玩法

`apps/feigua-worker` 是纯 Node.js,不依赖 Chromium。把它包成
`pm2` / `nssm` / Windows Task Scheduler 都行,不需要 Docker。

## 6. 出问题怎么排查

- `missing token` / `invalid token` → token 没填好或被 rotate 过,
  找管理员重发。
- `invalid JSON` / `bad row` → 字段不合格,详见
  `apps/admin/src/app/api/ingest-external/[id]/route.ts` 的 `coerceRow`
  规则。
- `too many rows (max 5000)` → 把 `batchSize` 调小到 500 一档,见
  `packages/collector-sdk/src/index.ts`。
- 中台返回 `source disabled` → 该 source 在中台后台被关,等管理员开。

## 7. 不要做的事

- 不要把 token 写进代码仓库。
- 不要多台机器共用同一把 token(找管理员开新 source)。
- 不要直连 `172.16.120.120:5432` — 那是个内网黑洞,只听 127.0.0.1。
- 不要在采集机后台跑把数据先存 sqlite 再上传的中间件 — 当前契约就是
  直接 POST,落库在中台。