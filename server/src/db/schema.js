import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  role: text("role")
});

export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  title: text("title"),
  body: text("body")
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => notificationTemplates.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

export const notificationDeliveries = pgTable("notification_deliveries", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id"),
  userId: integer("user_id"),
  status: text("status"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  message: text("message"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
