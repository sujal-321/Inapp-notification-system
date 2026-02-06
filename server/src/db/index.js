import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 Explicit path to .env (server/.env)
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  override: true
});

import pkg from "pg";
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL still missing");
  process.exit(1);
}

console.log("✅ DB ENV loaded, connecting to Neon with SSL");

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
