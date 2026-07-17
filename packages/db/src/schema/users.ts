import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

// 管理员账号。env 启动时 bootstrap admin@local / $ADMIN_BOOTSTRAP_PASSWORD.
// 只有 superadmin 可改其它账号；普通 admin 只能改自己的密码。
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"), // "superadmin" | "admin"
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});
