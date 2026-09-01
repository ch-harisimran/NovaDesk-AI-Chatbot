-- =============================================================================
-- NovaDesk AI -- database schema
-- Local Postgres + pgvector. Multi-tenant from the ground up: every tenant-owned
-- row carries tenant_id (denormalized onto knowledge_chunks/messages on purpose,
-- so Row Level Security policies stay a flat "tenant_id = current tenant" check
-- instead of a join/subquery on every read).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "vector";     -- pgvector

-- -----------------------------------------------------------------------------
-- Core tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tenants (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     TEXT NOT NULL,
  slug                     TEXT NOT NULL UNIQUE,
  widget_color             TEXT NOT NULL DEFAULT '#6366F1',
  widget_color_secondary   TEXT NOT NULL DEFAULT '#8B5CF6',
  logo_url                 TEXT,
  greeting_message         TEXT NOT NULL DEFAULT 'Hi there! How can I help you today?',
  proactive_message        TEXT NOT NULL DEFAULT 'Have a question? I''m happy to help!',
  proactive_delay_seconds  INTEGER NOT NULL DEFAULT 12,
  proactive_enabled        BOOLEAN NOT NULL DEFAULT true,
  chat_model               TEXT NOT NULL DEFAULT 'openai/gpt-4o-mini',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admins (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email          TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'agent')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  source_type  TEXT NOT NULL CHECK (source_type IN ('text', 'pdf', 'url')),
  source_ref   TEXT,
  raw_content  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  chunk_count  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  chunk_index  INTEGER NOT NULL DEFAULT 0,
  content      TEXT NOT NULL,
  token_count  INTEGER NOT NULL DEFAULT 0,
  embedding    vector(768), -- dimension of Ollama's nomic-embed-text model (see services/embeddings.ts)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  visitor_session_id  TEXT NOT NULL,
  visitor_name        TEXT,
  visitor_email       TEXT,
  channel             TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp', 'telegram')),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'handoff', 'closed')),
  sentiment           TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content          TEXT NOT NULL,
  attachments      JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback         TEXT CHECK (feedback IN ('up', 'down')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  conversation_id  UUID REFERENCES conversations(id) ON DELETE SET NULL,
  name             TEXT,
  email            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_number         TEXT NOT NULL,
  customer_email       TEXT NOT NULL,
  status               TEXT NOT NULL CHECK (status IN ('processing', 'shipped', 'out_for_delivery', 'delivered', 'delayed', 'cancelled', 'returned')),
  items                TEXT NOT NULL,
  total_cents          INTEGER NOT NULL,
  tracking_number      TEXT,
  estimated_delivery   DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, order_number)
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_admins_tenant ON admins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kdocs_tenant ON knowledge_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kchunks_tenant ON knowledge_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kchunks_document ON knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_kchunks_embedding ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(tenant_id, visitor_session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_lookup ON orders(tenant_id, order_number, customer_email);

-- -----------------------------------------------------------------------------
-- Row Level Security
--
-- The Express backend connects to Postgres as `novadesk_app`, a non-superuser
-- role with no BYPASSRLS. Every request that touches tenant-scoped data runs
-- inside a transaction that starts with:
--   SET LOCAL app.current_tenant_id = '<uuid>';
-- The policies below compare that session variable against each row's
-- tenant_id, so a bug that forgets a `WHERE tenant_id = ...` clause fails
-- closed (returns zero rows) instead of leaking cross-tenant data.
--
-- The one exception is admin login: the client only has an email/password,
-- not a tenant_id yet. That lookup goes through a SECURITY DEFINER function
-- (owned by the migration role, which bypasses RLS) so it can find the
-- matching admin row without granting the app role blanket read access.
-- -----------------------------------------------------------------------------

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON tenants;
CREATE POLICY tenant_isolation ON tenants
  USING (id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS tenant_isolation ON admins;
CREATE POLICY tenant_isolation ON admins
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS tenant_isolation ON knowledge_documents;
CREATE POLICY tenant_isolation ON knowledge_documents
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS tenant_isolation ON knowledge_chunks;
CREATE POLICY tenant_isolation ON knowledge_chunks
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS tenant_isolation ON conversations;
CREATE POLICY tenant_isolation ON conversations
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS tenant_isolation ON messages;
CREATE POLICY tenant_isolation ON messages
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS tenant_isolation ON leads;
CREATE POLICY tenant_isolation ON leads
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

DROP POLICY IF EXISTS tenant_isolation ON orders;
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- App role (non-superuser, subject to RLS) + login lookup escape hatch
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'novadesk_app') THEN
    CREATE ROLE novadesk_app LOGIN PASSWORD 'novadesk_app_local_pw' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO novadesk_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO novadesk_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO novadesk_app;

CREATE OR REPLACE FUNCTION find_admin_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID, tenant_id UUID, email TEXT, password_hash TEXT, name TEXT, role TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, email, password_hash, name, role
  FROM admins
  WHERE email = p_email;
$$;

GRANT EXECUTE ON FUNCTION find_admin_by_email(TEXT) TO novadesk_app;

-- -----------------------------------------------------------------------------
-- keep updated_at fresh
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON tenants;
CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON conversations;
CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
