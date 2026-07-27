# 六屏 -> Superset 切片对照

> 给同事:你拉下本仓库,起 Superset(`docker compose up -d superset`),
> 然后照本章把六屏的口径在 Superset 里**复刻**,业务用户去 BI 里自助
> 探索。本章不动代码,只描述"在 Superset 里怎么建 chart / dashboard"。

## 0. 思路先讲清楚

```text
六屏: Next.js 渲染, 16:9 锁定,  0 交互,        KPI 6 tiles 总是 6 个
BI  : Superset, 任意尺寸,    任意交互,        Chart 数随心而定

六屏的口径 = Sum / Avg / Count by 维度 + 排序
这两件事 Superset 都能做, 本章给你"哪个 metric 用哪个 chart / 哪种
聚合 / 排什么维度"的具体配方。
```

### 0.1 用哪个 dataset

推荐**只用**一个 dataset:`public.v_douyin_account_latest`。

```text
理由
- 这是 6 屏的同一份数据源(apps/dashboard/src/lib/adapter.ts 里
  全部走 v_douyin_account_latest)。
- 已按 entity_id + dims GROUP BY, 一行 = 一个账号的最新值。
- EAV 原始表 `account_snapshots` 也建个 dataset 备用, 但默认 6 屏
  不用。
```

```sql
-- v_douyin_account_latest 的形状(每个账号一行)
account_name       text
douyin_name        text
dept               text
person             text
status             text        -- 'live' | 'warn' | 'dead'
plays_inc          numeric
like_count         numeric
fans_total         numeric
fans_inc           numeric
works_total        numeric
rate               numeric     -- 0..1
captured_at        timestamptz
```

Superset 里:

```text
Settings -> Database Connections -> + DATABASE
  URI: postgresql://superset:superset_readonly_2026@postgres:5432/dashboard
Datasets -> + DATASET
  Database: 同上
  Schema:   public
  Table:    v_douyin_account_latest
  勾选 "Is temporal" 走 time-series chart 可用 captured_at 做时间过滤
```

### 0.2 通用 metric / dimension 配置

```text
Metrics (Superset SUM/AVG/MAX):
  plays_inc_sum      = SUM(plays_inc)
  like_count_sum     = SUM(like_count)
  fans_total_max     = MAX(fans_total)        -- 已经聚合到 latest, 等价 SUM
  fans_inc_sum       = SUM(fans_inc)
  works_total_max    = MAX(works_total)
  fans_total_sum     = SUM(fans_total)
  rate_avg           = AVG(rate) * 100        -- 用 Saved Expression 转成百分比
  live_count         = COUNT(*) FILTER (WHERE status = ''live'')
  warn_count         = COUNT(*) FILTER (WHERE status = ''warn'')
  dead_count         = COUNT(*) FILTER (WHERE status = ''dead'')
  total_count        = COUNT(*)

Dimensions:
  account_name, douyin_name, dept, person, status, captured_at(time)
```

> 备注:`fans_total` / `works_total` 是"当前总量",不是增量,所以用
> `MAX` 等价于 `SUM` per 账号,但不会因聚合重复计数。同事用哪个都行,
> 内部一致性靠前端同样口径。

## 1. 屏 1 高层概览 (`/screen/exec`)

代码:`apps/dashboard/src/app/screen/exec/page.tsx`
调:`getScreen1`(无排序,原顺序), KPI = `fillOpsKpi`
组件:`Sparkline(取 TOP 12 的 playsInc)`, `RankList`, `KpiStrip(6)`

| 用途            | 元素        | Superset 配置                                                     |
|-----------------|-------------|-------------------------------------------------------------------|
| 6 tile KPI       | KPI Strip   | Big Number Total × 6,见 1.1                                         |
| 本周 spark trend | 折线 spark | Time-series Line,见 1.2                                            |
| TOP 12 排行      | 表格 + spark | Table 或 Pivot Table,见 1.3                                       |

### 1.1 Big Number 6 件套

```text
Chart 1   Big Number Total     COUNT(*) FILTER status=''live''         label "在播账号"
Chart 2   Big Number Total     COUNT(*) FILTER status=''warn''         label "预警账号"
Chart 3   Big Number Total     COUNT(*) FILTER status=''dead''         label "停播账号"
Chart 4   Big Number Total     SUM(plays_inc)                          label "今日总播放"
Chart 5   Big Number Total     SUM(fans_inc)                           label "今日新增粉丝"
Chart 6   Big Number Total     TOP 1 (account_name) ORDER BY plays_inc label "TOP 账号"
```

KPI strip 上排成一行 6 个,带单位 / 颜色 tone。

### 1.2 本周 spark / line

```text
Time-series Line Chart
  Dataset:        v_douyin_account_latest
  Time column:    captured_at   (用 Last N days = 7)
  Metric:         plays_inc_sum
  Group by:       dept
  Style:          仅线条,无点,无图例 -> 体现 "spark" 视觉
```

> 备注:由于 6 屏共享同一个 view 是「最新一次抓取」的快照,严格意义的
> "本周 7 天曲线" 需要换 `account_snapshots` 原始 EAV 表 + 时间维度。
> 这就是 0.1 提到的"备用 dataset"用法。本章先用 latest 复刻
> 视觉,口径细节另开 issue 跟踪。

### 1.3 TOP 12 plays 表

```text
Table Chart
  Dataset:    v_douyin_account_latest
  Columns:
    account_name
    dept
    person
    plays_inc_sum     format "千/K" 或 "万"
    like_count_sum
    fans_total_max
  Sort:       plays_inc DESC
  Page size:  12
```

加一个 `limit 12 + Sparkline cell` 的可视化来还原 spark 列;不强制。

## 2. 屏 2 运营总览 (`/screen/ops`)

代码:`apps/dashboard/src/app/screen/ops/page.tsx`
调:`getScreen2`(`playsInc DESC`),KPI = `fillOpsKpi`
形态:6 tile + 两条 TOP 5 列表(playsInc / fansInc)

| 元素                  | Superset 配置                              |
|-----------------------|--------------------------------------------|
| 顶部 KPI 6 件套       | 同 1.1 (`fillOpsKpi` 口径一致)             |
| 播放增量 TOP 5        | Table,Sort plays_inc DESC,Page 5           |
| 粉丝增量 TOP 5        | Table,Sort fans_inc DESC,Page 5            |
| 三个状态占比         | Pie / Funnel,见 2.1                         |

### 2.1 状态分布饼图(可选,大屏里其实是数字)

```text
Pie Chart
  Dataset:   v_douyin_account_latest
  Dimension: status   (live / warn / dead)
  Metric:    COUNT(*)
  Color:     good / warn / bad 三色
```


## 3. 屏 3 内容运营 (`/screen/content`)

代码:`apps/dashboard/src/app/screen/content/page.tsx`
调:`getScreen3`(`worksTotal DESC`),KPI = `fillContentKpi`
形态:6 tile + 作品数 TOP 10 横条

| 元素                | Superset 配置                                 |
|---------------------|----------------------------------------------|
| 顶部 KPI 6 件套     | 见 3.1                                       |
| 作品数 TOP 10 横条  | Bar EChart,按 account_name 排序             |

### 3.1 KPI 口径(`fillContentKpi`)

```text
Tile 1   作品总数      = SUM(works_total)
Tile 2   本周播放      = SUM(plays_inc)
Tile 3   平均完播率    = AVG(rate) * 100  (%)
Tile 4   活跃账号      = COUNT(*)
Tile 5   头部账号      = TOP 1 ORDER BY works_total DESC  (account_name)
Tile 6   新增粉丝      = SUM(fans_inc)
```

### 3.2 作品 TOP 10 横条

```text
Horizontal Bar Chart
  Dataset:     v_douyin_account_latest
  Dimension:   account_name
  Metric:      works_total_sum (or MAX)
  Sort:        Desc
  Limit:       10
  Style:       lolipop 或 horizontal bar
```


## 4. 屏 4 全域账号 (`/screen/full`)

代码:`apps/dashboard/src/app/screen/full/page.tsx`
调:`getScreen4`(`fansTotal DESC`),KPI = `fillFullKpi`
形态:6 tile + 「粉丝总量 TOP 5」,带进度条;下方再排「全量账号」表

| 元素              | Superset 配置                                       |
|-------------------|----------------------------------------------------|
| 顶部 KPI 6 件套   | 见 4.1                                              |
| 粉丝总量 TOP 5     | Bar EChart,见 4.2                                  |
| 全量账号表        | Table,Sort fans_total DESC,见 4.3                  |

### 4.1 KPI 口径(`fillFullKpi`)

```text
Tile 1   账号总数      = COUNT(*)
Tile 2   粉丝总数      = SUM(fans_total)
Tile 3   本周播放      = SUM(plays_inc)
Tile 4   作品总数      = SUM(works_total)
Tile 5   新增粉丝      = SUM(fans_inc)
Tile 6   平均完播率    = AVG(rate) * 100  (%)
```

### 4.2 粉丝 TOP 5 进度条

```text
Bar EChart
  Dataset:    v_douyin_account_latest
  Dimension:  account_name
  Metric:     fans_total_sum
  Sort:       Desc
  Limit:      5
  Style:      horizontal bar with rounded ends + value suffix
```

### 4.3 全量账号表

```text
Table Chart
  Columns:
    account_name
    dept
    person
    status
    fans_total_max
    plays_inc_sum
    like_count_sum
    works_total_max
    fans_inc_sum
    rate_avg     (% format)
  Sort:        fans_total DESC
  Page size:   30
```


## 5. 屏 5 趋势分析 (`/screen/trend`)

代码:`apps/dashboard/src/app/screen/trend/page.tsx`
调:`getScreen5`(`rate DESC`),KPI = `fillTrendKpi`
形态:6 tile + 按部门聚合列表

| 元素              | Superset 配置                                         |
|-------------------|------------------------------------------------------|
| 顶部 KPI 6 件套   | 见 5.1                                                |
| 部门聚合列表      | Table 按 `dept` Group by,见 5.2                      |

### 5.1 KPI 口径(`fillTrendKpi`)

```text
Tile 1   覆盖部门        = COUNT(DISTINCT dept)
Tile 2   部门总播放      = SUM(plays_inc)
Tile 3   头部部门        = TOP 1 dept ORDER BY SUM(plays_inc) DESC
Tile 4   头部部门占比    = top_plays / SUM(plays_inc) * 100  (%)
Tile 5   平均完播        = avg(per-dept AVG(rate)) * 100 (%)
Tile 6   近 7 日活跃账号 = COUNT(*) FILTER WHERE status != ''dead''
```

### 5.2 部门聚合列表(本页是核心)

```text
Pivot Table
  Rows:           dept
  Metrics:
    plays_sum   = SUM(plays_inc)
    works_sum   = SUM(works_total)
    cnt         = COUNT(*)
    rate_avg    = AVG(rate) * 100  (%)
  Sort:           rate_avg DESC
  Page size:      全部展示
```

如果 Superset 版本没有 Pivot Table,用 Table + Group by 聚合也能完成。


## 6. 屏 6 区域分布 (`/screen/geo`)

代码:`apps/dashboard/src/app/screen/geo/page.tsx`
调:`getScreen6`(`fansInc DESC`),KPI = `fillGeoKpi`
形态:6 tile + 「部门粉丝增量排行」+ 「区域播放 TOP 5」

重要前提:`geo` 屏**当前没有地理坐标系**,而是把 `dept` 当作 "区域"。
同事如果想加真地图,可以加 `dims -> ''province''` / `''city''` 的字段,
再到 Superset 用 Mapbox plugin 或 deck.gl 渲染。

| 元素              | Superset 配置                                       |
|-------------------|------------------------------------------------------|
| 顶部 KPI 6 件套   | 见 6.1                                              |
| 部门粉丝增量排行  | Table,见 6.2                                        |
| 区域播放 TOP 5    | Table,见 6.3                                        |
| (后续) 真实地图    | Mapbox plugin (未启用,可加)                        |

### 6.1 KPI 口径(`fillGeoKpi`)

```text
Tile 1   覆盖区域    = COUNT(DISTINCT dept)   -- 历史待迁到 真地理
Tile 2   账号总数    = COUNT(*)
Tile 3   粉丝总数    = SUM(fans_total)
Tile 4   本周播放    = SUM(plays_inc)
Tile 5   在播率      = COUNT_IF(status=''live'') / COUNT(*)  * 100 (%)
Tile 6   停播        = COUNT_IF(status=''dead'')
```

### 6.2 部门粉丝增量

```text
Table Chart
  Rows:         dept
  Metric:       SUM(fans_inc)
  Sort:         Desc
  Columns:      dept, dept_fans_inc, dept_count
                (dept_count 用 COUNT(*) 展示该部门账号数)
```

### 6.3 区域播放 TOP 5

```text
Table Chart
  Rows:         dept
  Metric:       SUM(plays_inc)
  Sort:         Desc
  Limit:        5
```

## 7. 大屏通用元素 -> Superset 复刻

大屏上有一些跨屏通用元素,Superset 里没直接对照,但有必要一一映射:

### 7.1 KPI strip(每屏顶部 6 tile)

```text
6 tile 由 fill* Kpi 函数填充(每屏一个版本)。

Superset 怎么复刻:
- 一个 Row,内含 6 个 Big Number Total chart。
- 或一个 Markdown 块手动排版 + 6 个 chart 引用。
- 大屏屏风总是 6 件,Superset 端别加 / 减。
```

### 7.2 顶部 alert 红丸(`alertCount`)

```text
大屏: TvScreen 拿 getOpenAlerts() -> 红丸 + n,
      数据源 SELECT COUNT(*) FROM dashboard.alerts WHERE NOT resolved
      (注意 schema 是 dashboard."public"? 实际是 default, 见 apps/admin/ingest 那块)

Superset 复刻:
- 跑一个数字 KPI: COUNT(*) FROM alerts WHERE resolved = false
- 用 Conditional formatting 把 > 0 染红
- 把它固定在 dashboard 顶部
```

### 7.3 顶部 meta 行(`ScreenMeta`)

```text
大屏 meta 行: totalAccounts / live / warn / dead / capturedAt

Superset 复刻:
- 4 个 Big Number + 1 个 Time (latest captured_at)
- 数据同 v_douyin_account_latest
```

### 7.4 自动轮播

```text
大屏: HomeRotator(<6 个子屏路径>, interval=N ms) 客户端轮播。
Superset: 没原生轮播。建议:
  - 选项 A:浏览器侧写一个简易 HTML(每 30s iframe src 切 URL)
  - 选项 B:TV 端仍跑 Next.js 大屏,Superset dashboard 单独给业务用户看
```

## 8. 不要在 Superset 里做

- 不要直接 DDL — 它只有只读账号。
- 不要让 Superset 替代电视屏 — 16:9 锁定 + 0 交互 + 自动轮播
  Superset 都做不到。
- 不要在 Superset 上配 "CRUD 新增 source" — 这是 admin 后台职责。
- 不要把"实时性"当 Superset 卖点。它对应"30 分钟级别"的指标刷新率。

## 9. 一键验收 checklist

```text
[ ] Superset 进了 Database URI,Test Connection 成功
[ ] v_douyin_account_latest 这个 Dataset 建出来,字段对得上 0.1
[ ] 上面这份对照里 6 屏的 KPI 6 件套每个都建了 chart
[ ] 6 屏主图(Table / Bar / Pie)按对照表建出
[ ] alerts Dataset 也建出来,顶部红丸 chart 落地
[ ] 整套 dashboard 排成 1 屏的高度,顶部 = KPI strip,中部 = 主图
[ ] 跟 Next.js 大屏肉眼对比:数字能对得上(SUM 一致)
[ ] 颜色:live=good / warn=warn / dead=bad 三色映射与前端一致
```

## 10. 提交到 GitHub 之前

```bash
scripts/superset-bootstrap.py    (仓库根,如有)
scripts/superset-bootstrap.py export --out /tmp/six-screens.zip
```

将所有 chart + dashboard 打包给同事一份。这样 Superset 端"导入即可用",
不用同事手动一个个点。本仓库暂时没这份脚本,等业务稳定后补。

## 11. 改这里之前

本对照表随 6 屏的业务口径更新,改本文件**必须**同步更新
`apps/dashboard/src/app/screen/*/page.tsx` 或
`apps/dashboard/src/lib/fillKpi.ts`。两边的 `SUM` / `COUNT` 数字永远应该对得上。