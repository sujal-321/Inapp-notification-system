import express from "express";
import { db } from "../db/index.js";
import { notificationQueue } from "../queue/notificationqueue.js";

const router = express.Router();

/**
 * TRIGGER NOTIFICATION
 * Creates a notification + delivery records + queues jobs
 */
router.post("/trigger", async (req, res) => {
  try {
    const { templateId, userIds } = req.body;

    // 🔒 Validate payload
    if (!templateId || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // 🔒 Ensure template exists (prevents FK violation)
    const tpl = await db.query(
      "SELECT id FROM notification_templates WHERE id = $1",
      [templateId]
    );

    if (tpl.rowCount === 0) {
      return res.status(400).json({ error: "Template not found" });
    }

    // ✅ Create notification
    const notif = await db.query(
      "INSERT INTO notifications (template_id) VALUES ($1) RETURNING id",
      [templateId]
    );

    const notificationId = notif.rows[0].id;

    // ✅ Create deliveries + queue jobs
    for (const userId of userIds) {
      await db.query(
        `INSERT INTO notification_deliveries
         (notification_id, user_id, status, retry_count)
         VALUES ($1, $2, 'QUEUED', 0)
         ON CONFLICT DO NOTHING`,
        [notificationId, userId]
      );

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

    const result = await db.query(
      "INSERT INTO notification_templates (title, body) VALUES ($1, $2) RETURNING *",
      [title, body]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Create template error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * LIST TEMPLATES
 */
router.get("/templates", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM notification_templates ORDER BY id ASC"
  );
  res.json(result.rows);
});

/**
 * DELIVERY METRICS
 */
router.get("/metrics", async (req, res) => {
  const result = await db.query(
    `SELECT status, COUNT(*)::int AS count
     FROM notification_deliveries
     GROUP BY status`
  );

  res.json(result.rows);
});

/**
 * ACTIVITY LOG
 */
router.get("/activity", async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  // total count
  const countResult = await db.query(
    "SELECT COUNT(*) FROM notification_deliveries"
  );
  const total = Number(countResult.rows[0].count);
  const totalPages = Math.ceil(total / limit);

  // paginated data
  const result = await db.query(
    `
    SELECT
      d.id,
      d.user_id,
      d.status,
      d.created_at,
      t.title AS template_title
    FROM notification_deliveries d
    JOIN notifications n ON d.notification_id = n.id
    JOIN notification_templates t ON n.template_id = t.id
    ORDER BY d.created_at DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  res.json({
    data: result.rows,
    page,
    totalPages
  });
});


export default router;
