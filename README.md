# 🤖 NovaDesk AI
**Your support inbox, minus the guesswork.**

An embeddable, multi-tenant AI customer support platform. A business drops in one
`<script>` tag and gets a widget that answers from its own knowledge base, looks up
orders, captures leads, and hands off to a human — every conversation manageable from
one dashboard.

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14.2-000000?logo=nextdotjs&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white">
  <img alt="Postgres" src="https://img.shields.io/badge/Postgres-pgvector-4169E1?logo=postgresql&logoColor=white">
  <img alt="Ollama" src="https://img.shields.io/badge/Ollama-local%20embeddings-1a1a1a">
  <img alt="OpenRouter" src="https://img.shields.io/badge/OpenRouter-chat%20AI-6366F1">
</p>

> [!NOTE]
> **A local development build, not a hosted product.** Everything here runs on
> `localhost` with `npm run dev` — there is no deployment configuration, no signup flow,
> and nothing is sold. Email alerts are logged to the console instead of sent, file
> uploads land on local disk instead of a cloud bucket, and the two AI calls (chat via
> OpenRouter, embeddings via local Ollama) are the only things that leave your machine.

---

## 📑 Table of contents
- [Why it exists](#-why-it-exists)
- [Features](#-features)
- [Tech stack](#-tech-stack)
- [How the core features work](#-how-the-core-features-work)
- [Architecture](#-architecture)
- [Security model](#-security-model)
- [Getting started](#-getting-started)
- [Known limitations](#-known-limitations)

---

## 🎯 Why it exists

Most "AI support chatbot" products are a black box behind a signup wall — you can't see
how the retrieval works, how tenants are isolated from each other, or what actually
happens when a visitor asks "where's my order." NovaDesk AI is the opposite: a complete,
readable implementation of that whole loop, running entirely on your own machine.

It's built multi-tenant from the schema up — not bolted on later — because that's the
part that's hardest to retrofit and easiest to get wrong. One Postgres database, Row
Level Security on every tenant-owned table, and a seeded demo tenant (**Solace Skincare
Co.**, a fictional skincare brand) so every screen looks like a live product from the
first run: 14 real knowledge base articles, 18 realistic conversations, 10 mock orders,
and a handful of captured leads.

---

## ✨ Features

### 💬 Widget & conversation
| Feature | What it does |
|---|---|
| **Embeddable widget** | One `<script>` tag, rendered in a genuinely isolated `<iframe>` — the host page's CSS can't reach in, the widget's CSS can't leak out, regardless of origin. |
| **RAG-grounded answers** | Every reply is retrieved from articles, PDFs, or URLs a business adds — not hallucinated. |
| **Order lookup** | Function-calling lets the model check real order status by number (and email) mid-conversation. |
| **Lead capture** | Name/email are asked for naturally in the flow, not up front, and saved automatically the moment they're shared. |
| **Human handoff** | The model flags a conversation the moment a visitor asks for a person, or it's out of its depth. |
| **Feedback** | Thumbs up/down on any AI response, visible in the dashboard for review. |
| **Multi-language** | The model replies in whatever language the visitor writes in — no translation layer needed. |
| **Sentiment flagging** | A lightweight keyword heuristic flags negative-sentiment conversations for review, at zero added latency. |
| **Proactive greeting** | Auto-opens with a configurable message after N seconds, once per first-time visitor. |
| **Voice input** | Browser-native Web Speech API — no backend involved. |
| **File/image upload** | Stored on local disk, referenced in the conversation. |

### 🏢 Multi-tenant admin dashboard
| Feature | What it does |
|---|---|
| **Conversations** | Full thread view with expand/collapse, sentiment and channel badges, handoff/resolve actions. |
| **Knowledge base** | Drag-and-drop PDF upload, paste-text, or fetch-by-URL — with an animated chunking/embedding progress state. |
| **Live branding preview** | Widget colors, logo, and greeting update a real mock widget instantly as you type, before you save anything. |
| **Analytics** | Volume over time, most-asked questions, resolution rate, feedback split, and average response time — animated `recharts`. |
| **Leads** | Every captured name/email, with its originating conversation. |

### 📡 Multi-channel (stretch)
| Feature | What it does |
|---|---|
| **WhatsApp / Telegram webhooks** | Reuse the exact same RAG engine as the widget. Fully implemented; needs a public URL (`ngrok`) and real provider tokens to receive live traffic — see [Getting started](#-getting-started). |

---

## 🛠 Tech stack

| Layer | Technology | Why |
|---|---|---|
| **Admin + marketing** | Next.js 14 (App Router), Tailwind CSS, Framer Motion | Server-rendered dashboard shell, animated everything, one shared design system across both surfaces. |
| **Widget** | React 18, Vite (IIFE build) | Bundled standalone so it can be dropped into any site with zero dependency conflicts. |
| **Backend** | Node.js + Express, TypeScript (strict) | A plain REST API — no framework magic between the widget, the dashboard, and the database. |
| **Database** | Postgres + `pgvector` (Docker, local only) | Relational data and embeddings in one place; `ivfflat` cosine index for similarity search. |
| **Chat AI** | [OpenRouter](https://openrouter.ai) (`openai/gpt-4o-mini` default, configurable per tenant) | OpenAI-compatible chat completions with function calling. |
| **Embeddings** | [Ollama](https://ollama.com) (`nomic-embed-text`, 768-dim) | Fully local and free — OpenRouter doesn't serve embeddings, and this avoids a second paid API entirely. |
| **Auth** | JWT + bcrypt | Simple, local, no third-party auth provider required. |
| **Charts** | Recharts | Animated line/bar/donut charts on the analytics page. |
| **Icons / Motion** | lucide-react, Framer Motion | Consistent icon set and micro-interactions everywhere. |
| **Testing** | *(none included)* | See [Known limitations](#-known-limitations). |
| **Hosting** | *(none — local only)* | No deployment config exists or is intended. |

---

## ⚙️ How the core features work

### 🧩 Retrieval-augmented generation
`services/chunking.ts` splits a document into ~500-token chunks on paragraph
boundaries, with a small overlap so context isn't lost mid-idea. Each chunk is embedded
locally via Ollama and stored in `knowledge_chunks.embedding` (`vector(768)`). On every
visitor message, the message itself is embedded, the top 5 chunks are pulled by cosine
distance (`<=>`), and only those chunks — plus the last 20 turns of conversation — go
into the system prompt. Nothing outside that retrieved context is presented as fact.

### 🛠️ Function calling, not guessing
The model is given three tools: `check_order_status`, `capture_lead`, and
`request_human_handoff`. When it calls one, the backend actually executes it — a real
query against the `orders` table, a real `INSERT` into `leads` — and feeds the result
back for a final answer. The loop caps at four rounds so a confused tool-call sequence
can't spin forever. This is why order status is never invented: the number either comes
back from a row in Postgres, or the model says it can't find one.

### 🔒 Row Level Security is the isolation, not application code
The backend connects as `novadesk_app`, a **non-superuser** Postgres role with no
`BYPASSRLS`. Every tenant-scoped request runs inside a transaction that opens with:
```sql
SET LOCAL app.current_tenant_id = '<uuid>';
```
Every policy on every tenant-owned table checks that variable against the row's
`tenant_id`. A route handler that forgets a `WHERE tenant_id = ...` clause doesn't leak
data — it just returns zero rows, because Postgres enforces the boundary regardless of
what the application code does. The one exception is admin login, which has no tenant
context yet: it goes through a `SECURITY DEFINER` function that can look up an email
across tenants without granting the app role blanket read access.

### 🪟 A real isolated iframe, not a shadow DOM trick
The widget you embed is a small vanilla-JS loader (`widget/src/loader.ts`) with zero
dependencies. It reads its own `<script>` tag's attributes, creates an `<iframe>`
pointing at a separate React SPA, and resizes that iframe via `postMessage` as the
widget opens and closes. Because it's a genuinely separate document — not content
injected into the host page — the host's CSS can never restyle the widget, and the
widget's CSS can never touch the host, regardless of same- or cross-origin.

### 🎨 A live preview that's actually live
The Settings page doesn't call the API on every keystroke. Color, logo, and greeting
changes update a local React component (`WidgetPreview.tsx`) styled identically to the
real widget — instant, no network round-trip — and only hit `PATCH
/api/tenants/:id/settings` when you click Save.

---

## 🏗 Architecture

```
novadesk/
├─ backend/
│  ├─ src/routes/        11 route modules, 25 REST endpoints (widget, knowledge,
│  │                      conversations, messages, tenants, analytics, leads, orders,
│  │                      auth, + 2 multi-channel webhooks)
│  ├─ src/services/       chunking · embeddings (Ollama) · openrouter · rag · sentiment · ingest
│  ├─ src/db/             schema.sql (8 tables, 8 RLS policies) · pool.ts (tenant-scoped transactions)
│  └─ src/seed/           demo tenant, 14 KB articles, 18 conversations, 10 orders, leads
├─ dashboard/
│  └─ app/                marketing page · /login · 6-page admin shell (overview, conversations,
│                          knowledge, leads, analytics, settings)
├─ widget/
│  └─ src/                loader.ts (the embed script) + the widget SPA it points at
├─ demo-site/              a static "client website" with the widget embedded
└─ docker-compose.yml      Postgres + pgvector only — not a deployment config
```

### Data model
| Table | Holds | Access |
|---|---|---|
| `tenants` | One row per business — branding, greeting, model config | Owner reads/writes only |
| `admins` | Dashboard users, bcrypt password hashes | Scoped to own tenant, except the login lookup |
| `knowledge_documents` / `knowledge_chunks` | Source articles and their embedded chunks | Tenant-scoped |
| `conversations` / `messages` | Every widget/WhatsApp/Telegram thread | Tenant-scoped |
| `leads` | Captured names/emails | Tenant-scoped |
| `orders` | Mock order data the AI can look up | Tenant-scoped |

All eight tables have Row Level Security **enabled**, each with a `tenant_isolation`
policy keyed on `tenant_id = current_setting('app.current_tenant_id')`. See
[Security model](#-security-model).

---

## 🛡 Security model

| Control | Implementation |
|---|---|
| **Row Level Security** | Enabled on all 8 tenant-owned tables, enforced against a non-superuser app role — not just enabled and trusted to the table owner. |
| **Tenant isolation** | `SET LOCAL app.current_tenant_id` per request/transaction; every policy checks it. A missing filter fails closed. |
| **Admin auth** | JWT, bcrypt-hashed passwords, a `SECURITY DEFINER` function for the one pre-tenant login lookup. |
| **Widget auth** | None by design (public by nature), but every widget route is rate-limited per IP + tenant. |
| **No real payment or bank data** | There's no field for either anywhere in the product — orders are mock demo data only. |
| **Cross-tenant safety net** | Even the seed script's second-tenant instructions rely on RLS, not app-layer checks, to keep data apart. |

---

## 🚀 Getting started

**Prerequisites:** Node.js 18+, Docker, an [OpenRouter](https://openrouter.ai) API key,
and [Ollama](https://ollama.com/download) installed and running.

```bash
# one-time: pull the local embedding model
ollama pull nomic-embed-text

# from the repo root: start Postgres + pgvector
docker compose up -d
```

**Backend** (terminal 1):
```bash
cd backend
cp .env.example .env        # fill in OPENROUTER_API_KEY
npm install
npm run db:schema           # applies schema.sql (tables, RLS policies, the app role)
npm run seed                # seeds the demo tenant, knowledge base, conversations, orders, leads
npm run dev                 # http://localhost:4000
```

**Widget** (terminal 2):
```bash
cd widget
npm install
npm run dev                 # http://localhost:5173
```

**Dashboard** (terminal 3):
```bash
cd dashboard
cp .env.local.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

Open **http://localhost:3000/login**:
```
Email:    admin@solaceskincare.com
Password: SolaceDemo!2026
```

Then open `demo-site/index.html` directly in a browser (or `npx serve .` from inside
that folder) to see the widget running on a "client" storefront.

`npm run seed` is idempotent — re-run it anytime to reset the demo tenant back to its
seeded state.

<details>
<summary><strong>Multi-channel (WhatsApp / Telegram) setup</strong></summary>

<br>

`backend/src/routes/webhooks/whatsapp.ts` and `telegram.ts` reuse the exact same RAG
engine as the widget. Receiving real webhook traffic requires a public HTTPS URL:

```bash
ngrok http 4000
```

Then register the resulting URL with Meta's WhatsApp Business API console
(`https://<ngrok-domain>/api/webhooks/whatsapp`) or Telegram's `setWebhook` endpoint
(`https://<ngrok-domain>/api/webhooks/telegram/<TELEGRAM_BOT_TOKEN>`). Without `ngrok`
and real provider tokens, replies are logged to the console instead
(`[MOCK WHATSAPP SEND]` / `[MOCK TELEGRAM SEND]`).

</details>

<details>
<summary><strong>Troubleshooting</strong></summary>

<br>

- **"DATABASE_URL is not set"** — copy `backend/.env.example` to `backend/.env`.
- **Seed fails saying it can't reach Ollama** — make sure Ollama is running, then
  `ollama pull nomic-embed-text` and re-run `npm run seed`.
- **Widget shows "Couldn't load the chat widget"** — the backend isn't running, or
  `data-api-url` / `NEXT_PUBLIC_API_URL` doesn't match where it's actually listening.
- **Postgres connection refused** — give `docker compose up -d` a few seconds, or check
  `docker compose logs postgres`.

</details>

---

## ⚠️ Known limitations

Stated plainly rather than hidden:

- **No automated test suite.** This build prioritized a complete, working feature set
  over test coverage — there's no Vitest/Jest suite included.
- **Email is mocked.** Handoff alerts are logged to the backend console
  (`[MOCK EMAIL] ...`), not sent through a real provider.
- **File uploads are local disk only.** `backend/uploads/`, served at `/uploads/...` —
  no cloud bucket, so they don't survive a fresh clone without re-uploading.
- **"Most-asked questions" groups by exact message text**, not semantic similarity —
  two visitors phrasing the same question differently count separately.
- **WhatsApp/Telegram need `ngrok` for live traffic.** The handlers are fully
  implemented and share the real RAG engine, but can't receive webhooks without a
  public URL and real provider tokens.
- **Single language UI.** The dashboard and marketing site are English-only, even
  though the AI itself replies in whatever language the visitor writes.

---

<p align="center">
  <sub>A local development build · Not affiliated with OpenRouter, Ollama, or any AI provider</sub>
</p>
