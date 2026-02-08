import express from "express";
import { db } from "../db/index.js";
import {
  notificationTemplates,
  notifications,
  notificationDeliveries
} from "../db/schema.js";
import { notificationQueue } from "../queue/notificationqueue.js";
import { eq, sql } from "drizzle-orm";

const router = express.Router();

/**
 * TRIGGER NOTIFICATION
 */
router.post("/trigger", async (req, res) => {
  try {
    const { templateId, userIds } = req.body;

    if (!templateId || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const template = await db.query.notificationTemplates.findFirst({
      where: eq(notificationTemplates.id, templateId)
    });

    if (!template) {
      return res.status(400).json({ error: "Template not found" });
    }

    const [notification] = await db
      .insert(notifications)
      .values({ templateId })
      .returning({ id: notifications.id });

    const notificationId = notification.id;

    for (const userId of userIds) {
      await db
        .insert(notificationDeliveries)
        .values({
          notificationId,
          userId,
          status: "QUEUED",
          retryCount: 0
        })
        .onConflictDoNothing();

      await notificationQueue.add(
        "deliver",
        { notificationId, userId },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 }
        }
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Trigger error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * CREATE TEMPLATE
 */
router.post("/templates", async (req, res) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Title and body required" });
    }

    const [template] = await db
      .insert(notificationTemplates)
      .values({ title, body })
      .returning();

    res.json(template);
  } catch (err) {
    console.error("Create template error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * LIST TEMPLATES
 */
router.get("/templates", async (_req, res) => {
  const templates = await db
    .select()
    .from(notificationTemplates)
    .orderBy(notificationTemplates.id);

  res.json(templates);
});

/**
 * DELIVERY METRICS
 */
router.get("/metrics", async (_req, res) => {
  const metrics = await db
    .select({
      status: notificationDeliveries.status,
      count: sql`COUNT(*)`.mapWith(Number)
    })
    .from(notificationDeliveries)
    .groupBy(notificationDeliveries.status);

  res.json(metrics);
});

/**
 * ACTIVITY LOG (PAGINATED) — ✅ FINAL FIX
 */
router.get("/activity", async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 5);
  const offset = (page - 1) * limit;

  const [{ count }] = await db
    .select({ count: sql`COUNT(*)`.mapWith(Number) })
    .from(notificationDeliveries);

  const totalPages = Math.ceil(count / limit);

  const result = await db.execute(sql`
    SELECT
      d.id,
      d.user_id,
      d.status,
      d.created_at AT TIME ZONE 'UTC' AS created_at,
      COALESCE(t.title, 'Unknown Template') AS template_title
    FROM notification_deliveries d
    LEFT JOIN notifications n ON d.notification_id = n.id
    LEFT JOIN notification_templates t ON n.template_id = t.id
    ORDER BY d.created_at DESC NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  `);

  // 🔥 DRIZZLE-SAFE ROW EXTRACTION
  const rows = Array.isArray(result)
    ? result
    : result?.rows ?? [];

  res.json({
    data: rows,
    page,
    totalPages
  });
});

export default router;
