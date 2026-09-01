import { Pool, PoolClient } from "pg";
import dotenv from "dotenv";

dotenv.config();

// The app connects as the restricted `novadesk_app` role (see schema.sql).
// If a caller supplies APP_DATABASE_URL we use it; otherwise we derive it
// from DATABASE_URL by swapping in the app role's credentials so a single
// .env entry (DATABASE_URL) is enough to get started.
function resolveAppConnectionString(): string {
  if (process.env.APP_DATABASE_URL) return process.env.APP_DATABASE_URL;
  const base = process.env.DATABASE_URL;
  if (!base) {
    throw new Error("DATABASE_URL is not set. Copy backend/.env.example to backend/.env and fill it in.");
  }
  try {
    const url = new URL(base);
    url.username = "novadesk_app";
    url.password = "novadesk_app_local_pw";
    return url.toString();
  } catch {
    return base;
  }
}

// A separate, privileged pool used only for schema migrations and the seed
// script -- both need to create roles/functions and write across tenants.
export const migrationPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const appPool = new Pool({
  connectionString: resolveAppConnectionString(),
});

/**
 * Runs `fn` inside a transaction scoped to `tenantId`. Every query issued
 * through the provided client is subject to the tenant_isolation RLS
 * policies, since `app.current_tenant_id` is set for the lifetime of the
 * transaction only (SET LOCAL).
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await appPool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** For the one pre-tenant-known operation: admin login via SECURITY DEFINER function. */
export async function withoutTenant<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await appPool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
