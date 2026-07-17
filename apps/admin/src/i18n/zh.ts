export type Dict = Record<string, string>;

/**
 * Single source of truth for UI strings in the admin app.
 * No i18n framework - locale is hard-coded to zh-CN for this project.
 */
export const zh: Dict = {
  // nav
  "nav.overview": "概览",
  "nav.sources":  "数据源",
  "nav.snapshots": "事实快照",
  "nav.runs":     "运行日志",
  "nav.screens":  "数据大屏",
  "nav.superset": "BI · Superset",
  "nav.settings": "设置",
  // overview
  "overview.title": "概览",
  "card.sources":   "数据源",
  "card.accounts":  "账号数",
  "card.facts":     "事实快照",
  "card.lastCapture": "最近捕获",
  "table.sources":  "数据源状态",
  "table.runs":     "最近运行日志",
  // sources
  "sources.title":  "数据源",
  "btn.reseed":     "重种 mock 数据",
  "btn.runNow":     "立即执行",
  "btn.dropFixture": "投放示例",
  "btn.edit":       "编辑",
  "btn.cancel":     "取消",
  "btn.save":       "保存",
  // snapshots
  "snap.title":     "事实快照 (account_snapshots)",
  // runs
  "runs.title":     "运行日志 (ingestion_runs)",
  // settings
  "settings.title": "设置",
  "settings.accountInfo": "账号信息",
  "settings.changePw":    "修改密码",
  "settings.sysInfo":     "系统信息",
  // login
  "login.title":          "data-tw · 管理后台",
  "login.subtitle.new":   "首次启动 — 创建超级管理员",
  "login.subtitle.exist": "请登录",
  "login.placeholder.email": "邮箱",
  "login.placeholder.password": "密码 (≥8 位)",
  // alerts
  "alerts.title":       "告警规则",
  "alerts.kind.dead_count_ge":    "停播账号数 ≥",
  "alerts.kind.warn_count_ge":    "预警账号数 ≥",
  "alerts.kind.rate_avg_lt":      "平均完播率 <",
  "alerts.kind.fans_inc_total_lt":"新增粉丝 <",
  // screens
  "screens.title":  "数据大屏预览",
  "screens.supersetNote": "或 Superset · TV fallback",
  // common
  "common.enabled":  "启用",
  "common.disabled": "禁用",
  "common.unknown":  "—",
  "common.yes":      "是",
  "common.no":       "否",
  "common.role":     "角色",
};

export function t(key: string, fallback?: string): string {
  return zh[key] ?? fallback ?? key;
}
