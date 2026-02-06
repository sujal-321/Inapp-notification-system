import express from "express";
import { db } from "../db/index.js";

const router = express.Router();

/**
 * ✅ ADMIN: Get all users (for checklist UI)
 * Uses ONLY columns that exist in your schema
 */
router.get("/all", async (req, res) => {
  const result = await db.query(
    "SELECT id, name, role FROM users ORDER BY name"
  );
  res.json(result.rows);
});

/**
 * ✅ USER: Get notifications for a user
 */
router.get("/notifications/:userId", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM user_notifications WHERE user_id=$1 ORDER BY created_at DESC",
    [req.params.userId]
  );
  res.json(result.rows);
});

/**
 * ✅ USER: Mark notification as read
 */
router.patch("/notifications/:id/read", async (req, res) => {
  await db.query(
    "UPDATE user_notifications SET is_read=true WHERE id=$1",
    [req.params.id]
  );
  res.json({ success: true });
});

export default router;
