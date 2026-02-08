import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 Force-load .env (worker runs independently)
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  override: true
});

import { Worker } from "bullmq";
import IORedis from "ioredis";
import { db } from "../db/index.js";
import {
  users,
  notifications,
  notificationTemplates,
  notificationDeliveries,
  userNotifications
} from "../db/schema.js";
import { eq, and } from "drizzle-orm";

// 🔍 Verify Redis config
console.log(
  "Redis:",
  process.env.REDIS_HOST,
  process.env.REDIS_PORT
);

// 🔥 Redis connection (BullMQ requirement)
const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null
});

const worker = new Worker(
  "event-delivery",
  async (job) => {
    console.log("📥 Job received:", job.id, job.data);

    const { notificationId, userId } = job.data;

    // 1️⃣ Fetch delivery record
    const delivery = await db.query.notificationDeliveries.findFirst({
      where: and(
        eq(notificationDeliveries.notificationId, notificationId),
        eq(notificationDeliveries.userId, userId)
      )
    });

    if (!delivery) return;

    // Already processed
    if (delivery.status === "SENT" || delivery.status === "FAILED") return;

    // 2️⃣ Mark as processing
    await db
      .update(notificationDeliveries)
      .set({ status: "PROCESSING" })
      .where(eq(notificationDeliveries.id, delivery.id));

    // Simulate delivery success/failure
    const success = Math.random() > 0.3;

    if (success) {
      // 3️⃣ Fetch notification + template
      const result = await db
        .select({
          body: notificationTemplates.body
        })
        .from(notifications)
        .innerJoin(
          notificationTemplates,
          eq(notifications.templateId, notificationTemplates.id)
        )
        .where(eq(notifications.id, notificationId));

      if (!result.length) {
        throw new Error("Template not found for notification");
      }

      const { body } = result[0];

      // 4️⃣ Fetch user info
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      const userName = user?.name || "User";

      // 5️⃣ Substitute template variables
      const message = body.replace(/{{\s*name\s*}}/gi, userName);

      // 6️⃣ Store rendered message
      await db.insert(userNotifications).values({
        userId,
        message
      });

      // 7️⃣ Mark delivery as sent
      await db
        .update(notificationDeliveries)
        .set({ status: "SENT" })
        .where(eq(notificationDeliveries.id, delivery.id));

      console.log("✅ Notification delivered:", job.id);
    } else {
      // Retry / fail logic
      if (delivery.retryCount >= 2) {
        await db
          .update(notificationDeliveries)
          .set({ status: "FAILED" })
          .where(eq(notificationDeliveries.id, delivery.id));

        console.log("❌ Notification permanently failed:", job.id);
      } else {
        await db
          .update(notificationDeliveries)
          .set({
            status: "RETRYING",
            retryCount: delivery.retryCount + 1
          })
          .where(eq(notificationDeliveries.id, delivery.id));

        console.log("🔁 Retrying notification:", job.id);
        throw new Error("Retrying delivery");
      }
    }
  },
  { connection }
);

// 🔔 Worker lifecycle logs
worker.on("ready", () => {
  console.log("🚀 Worker READY and listening to event-delivery queue");
});

worker.on("failed", (job, err) => {
  console.error("❗ Job failed:", job?.id, err.message);
});

console.log("👷 Worker booted");
