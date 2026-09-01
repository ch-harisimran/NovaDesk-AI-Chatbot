import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { migrationPool } from "./pool";

dotenv.config();

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  console.log("Applying schema.sql to", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));
  await migrationPool.query(sql);
  console.log("Schema applied successfully.");
  await migrationPool.end();
}

main().catch((err) => {
  console.error("Failed to apply schema:", err);
  process.exit(1);
});
