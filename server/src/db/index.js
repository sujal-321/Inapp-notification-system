import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 Explicitly load .env from server root
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  override: true
});

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing");
  process.exit(1);
}

console.log("✅ DATABASE_URL loaded, connecting to Neon via Drizzle");

// 🔐 Neon-safe postgres client
const client = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  max: 10
});

// 🧠 Drizzle DB instance
export const db = drizzle(client, {
  schema,
  logger: false
});
