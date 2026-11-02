# WEB-001 — Sample Home Services Demo

AI-first one-page demo website (SOW #4). Built with open-source **bolt.diy**, deployed to **GitHub Pages via GitHub Actions**, with contact submissions flowing **browser → Supabase Edge Function → Windmill Flow → Supabase PostgreSQL**.

**Demonstration only — no services offered. Handles no real customer data.**

## Live URL

https://yooumarr.github.io/umar-web-001-ai-website/

## Releases

| Release | Description | Git SHA | Actions run URL |
|---|---|---|---|
| A | Initial site (bolt.diy prompt v1), working form, backend wiring | `3bccb58` | https://github.com/yooumarr/umar-web-001-ai-website/actions/runs/41436982357 (run #7) |
| B | bolt.diy natural-language edit: "Add a Weekend Appointments callout above the contact form and change the submit button to Request a Callback; keep the form operational." | `b28f604` | _Actions run #8 URL — add from repo Actions tab_ |

Lockfile: `package-lock.json` (npm; `npm ci` in CI).

## Architecture

```
Browser form (React + TS + Vite, Tailwind/shadcn)
  → POST https://kyfhfmqjggkybpepnnyf.supabase.co/functions/v1/contact-submit
    → Edge Function (public, verify_jwt=false) — validates, honeypot check, CORS pin
    → Windmill Flow u/umarworkit/contact_intake (synchronous webhook, scoped Bearer token in Edge secrets)
      → Script u/umarworkit/store_submission (server-side Supabase credential via Windmill resource)
      → INSERT ... ON CONFLICT (request_id) DO NOTHING → {stored:true, request_id}
  ← 200 {request_id, status:"received"} ONLY after Windmill confirms storage
```

- Duplicate `request_id` → idempotent: exactly one row, same id returned.
- Windmill down / DB unreachable → truthful error, **no** false success; the browser keeps the same `request_id` and retries.
- Browser never calls Windmill or the database directly.

## Repository layout

| Path | Purpose |
|---|---|
| `src/` | React + TypeScript site (bolt.diy-generated, hand-wired form) |
| `.github/workflows/deploy.yml` | Push main + manual dispatch → `npm ci`, lint, build, Pages deploy |
| `supabase/migrations/0001_contact_submissions.sql` | Table + RLS enabled, zero policies (anon access denied) |
| `supabase/functions/contact-submit/index.ts` | Edge Function (validation, honeypot, CORS, Windmill proxy) |
| `supabase/config.toml` | verify_jwt=false for the public function |
| `windmill/flows/contact_intake.json` | Windmill Flow export (resource references only, sanitized) |
| `.env.example` | Sanitized placeholders |

## Recreation guide (new environment)

1. **Create Supabase project** → run `supabase/migrations/0001_contact_submissions.sql` in SQL Editor. Confirm RLS enabled + zero policies.
2. **Create Windmill workspace** → import `windmill/flows/contact_intake.json` → create PostgreSQL resource `supabase_demo_db` (Session pooler host, port 5432, db `postgres`, user `postgres.<project-ref>`, SSL on) → deploy script `u/umarworkit/store_submission` and flow `contact_intake` → create a **token scoped to the flow path** (User settings → Tokens).
3. **Deploy Edge Function**: `npm i -g supabase && supabase login && supabase link --project-ref <ref> && supabase secrets set WINDMILL_WEBHOOK_URL=<flow webhook URL> WINDMILL_WEBHOOK_TOKEN=<token> ALLOWED_ORIGIN=https://yooumarr.github.io && supabase functions deploy contact-submit`.
4. **Create GitHub repo** → import this code → Settings → Pages → Source: **GitHub Actions** → set Actions secret `VITE_CONTACT_FUNCTION_URL` (optional; a default is embedded) → push to `main` → workflow deploys automatically.
5. Edit content via bolt.diy natural language, commit the result, push — CI republishes.

## Ownership, cost, access transfer

- **Developer-owned**: GitHub account/repo, Supabase project (free tier), Windmill workspace (free tier), bolt.diy/LLM access.
- Transferring to SAFI: repository transfer via GitHub (Settings → Transfer), Supabase/Windmill credential handover via a **vaulted one-time share** — never in Git or chat.
- **Credential rotation**: revoke old Windmill token (User settings → Tokens) → issue new token scoped to `contact_intake` → `supabase secrets set WINDMILL_WEBHOOK_TOKEN=<new>` → `supabase functions deploy contact-submit`. Rotate Supabase DB password in Settings → Database if service credentials ever leave SAFI custody.
- Pilot stays live **≥72 h** post-handover.

## Secrets inventory (never in Git/browser/bundle)

| Secret | Stored in |
|---|---|
| Windmill flow Bearer token | Supabase Edge Function secrets |
| Supabase service-role / DB password | Windmill resource (server side) |
| anon key | browser-safe by design; only used in T5 RLS denial test |
