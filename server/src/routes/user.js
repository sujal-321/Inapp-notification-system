import express from "express";
import { db } from "../db/index.js";
import {
  users,
  userNotifications
} from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

const router = express.Router();

/**
 * ✅ ADMIN: Get all users (for checklist UI)
 */
router.get("/all", async (_req, res) => {
  try {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role
      })
      .from(users)
      .orderBy(users.name);

    res.json(result);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * ✅ USER: Get notifications for a user
 */
router.get("/notifications/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!userId) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const result = await db
      .select()
      .from(userNotifications)
      .where(eq(userNotifications.userId, userId))
      .orderBy(desc(userNotifications.createdAt));

    res.json(result);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * ✅ USER: Mark notification as read
 */
router.patch("/notifications/:id/read", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "Invalid notification id" });
    }

    await db
      .update(userNotifications)
      .set({ isRead: true })
      .where(eq(userNotifications.id, id));

    res.json({ success: true });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
