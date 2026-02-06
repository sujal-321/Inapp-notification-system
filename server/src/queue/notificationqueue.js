import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 Force-load .env from server root
dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

import { Queue } from "bullmq";
import IORedis from "ioredis";

console.log(
  "Queue Redis:",
  process.env.REDIS_HOST,
  process.env.REDIS_PORT
);

// 🔥 port MUST be a number
export const redisConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  maxRetriesPerRequest: null
});

export const notificationQueue = new Queue(
  "event-delivery", // ✅ MUST MATCH WORKER
  { connection: redisConnection }
);
