# zhuobao 部署 (Ubuntu 26.04,裸机,bare systemd)

> 适用机器:`zhuobao` (zhuobao 用户,无密码免 sudo)。这台机器**只跑**中台
> + 数据库 + 本地 LLM,不采集。

## 0. 前置:显示迁到核显

BIOS:
- Primary Display = Integrated Graphics (IGD)
- Internal Graphics = Enabled
- iGPU Multi-Monitor = Enabled (如存在)

显示器接主板 HDMI / DP。重启后:

```bash
lspci | grep -Ei "vga|display|3d"
nvidia-smi
```

预期:**两张 3090 都不再承担显示输出**。`Xorg` / `gnome-shell` 应只挂在核显。

## 1. 创建工作目录

```bash
sudo -n true 2>/dev/null || echo "no nopasswd sudo, will prompt"
sudo install -d -o zhuobao -g zhuobao /opt/data-tw
sudo install -d -o zhuobao -g zhuobao /var/lib/data-tw/{pgdata,llm-models,backups}
```

## 2. 拉代码

```bash
sudo -u zhuobao git clone https://github.com/yangkai258/Qinghai-Lake /opt/data-tw
cd /opt/data-tw
corepack enable && corepack prepare pnpm@11.7.0 --activate
pnpm install --prod
```

## 3. PostgreSQL

```bash
sudo apt-get install -y postgresql-17
sudo -u postgres psql -c "CREATE DATABASE dashboard;"
sudo -u postgres psql -d dashboard -f packages/db/migrations/0000_initial/migration.sql
sudo -u postgres psql -d dashboard -f packages/db/migrations/0001_alert_rules_and_users/migration.sql
sudo -u postgres psql -d dashboard -f packages/db/migrations/0002_external_ingest_token/migration.sql
sudo -u postgres psql -d dashboard -f packages/db/setup-superset.sql   # 可选,Superset 才需要
```

绑定只听本机:

```ini
# /etc/postgresql/17/main/postgresql.conf
listen_addresses = "'127.0.0.1'"
```

## 4. 启动 admin / dashboard / Superset

```bash
sudo install -m 0644 deploy/zhuobao/systemd/data-tw-admin.service       /etc/systemd/system/
sudo install -m 0644 deploy/zhuobao/systemd/data-tw-dashboard.service   /etc/systemd/system/
sudo install -m 0644 deploy/zhuobao/systemd/data-tw-superset.service     /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now data-tw-admin data-tw-dashboard data-tw-superset
```

## 5. 双 3090 + LLM

装 vLLM 或 ollama。 vLLM 在单进程里 tensor-parallel=2:

```bash
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen2.5-Coder-32B-Instruct-AWQ \
  --tensor-parallel-size 2 \
  --gpu-memory-utilization 0.9 \
  --host 127.0.0.1 --port 7000
```

脱机运行(模型权重已下到 `/var/lib/data-tw/llm-models`):

```bash
sudo install -m 0644 deploy/zhuobao/systemd/data-tw-vllm.service /etc/systemd/system/
sudo systemctl enable --now data-tw-vllm
```

LLM gateway (FastAPI,转 vLLM 为内部契约 + NL2SQL + 告警摘要):

```bash
sudo install -m 0644 deploy/zhuobao/systemd/data-tw-llm-gateway.service /etc/systemd/system/
sudo systemctl enable --now data-tw-llm-gateway
```

## 6. 数据采集:不要这台机

采集机另写。 `apps/feigua-worker` 在任意机器跑,**不要在 zhuobao 上拉
feigua cookie**(这台机不与飞瓜业务网络交互)。

## 7. 备份

每晚 03:30 跑 `pg_dump`,保留 14 天。

```bash
sudo install -m 0755 deploy/zhuobao/scripts/pgdump-nightly.sh /usr/local/bin/
sudo install -m 0644 deploy/zhuobao/systemd/data-tw-pgdump.timer /etc/systemd/system/
sudo install -m 0644 deploy/zhuobao/systemd/data-tw-pgdump.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now data-tw-pgdump.timer
```

校验:

```bash
systemctl list-timers data-tw-*
ls -lh /var/lib/data-tw/backups/
```

## 8. 验收

```bash
curl -sf http://127.0.0.1:3004/api/debug-auth -o /dev/null && echo "admin up"
curl -sf http://127.0.0.1:3003/                 -o /dev/null && echo "dashboard up"
curl -sf http://127.0.0.1:8088/health          && echo "superset up"
curl -sf http://127.0.0.1:7000/v1/models       && echo "vllm up"
```

## 9. 不需要做的事

- 不装 Docker / Podman。
- 不暴露 PostgreSQL 端口。
- 不在 zhuobao 跑 `apps/feigua-worker`。
- 不开公网入口;外网用 VPN 或 Cloudflare Tunnel。