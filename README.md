# Sample Home Services — Demo (WEB-001)

One-page demonstration website built with [bolt.diy](https://github.com/stackblitz-labs/bolt.diy) (React + TypeScript + Vite + Tailwind/shadcn), deployed to GitHub Pages by GitHub Actions. Contact form submissions flow browser → Supabase Edge Function → Windmill → Supabase PostgreSQL.

**Demonstration only — no services offered.**

- **Live:** https://yooumarr.github.io/umar-web-001-ai-website/
- **Releases:** A `3bccb58` (initial site) · B `b28f604` (bolt.diy edit: Weekend Appointments callout + Request a Callback)
- **Full handover:** see [HANDOVER.md](./HANDOVER.md) · **Operator onboarding:** [OPERATOR-QUICKSTART.md](./OPERATOR-QUICKSTART.md) · **Tests:** [TEST-LOG.md](./TEST-LOG.md)

## Local development

```bash
npm ci
cp .env.example .env.local   # set VITE_CONTACT_FUNCTION_URL (or rely on the embedded default)
npm run dev
```

## How it works

```
Form (request_id UUID, honeypot website="")
  → POST /functions/v1/contact-submit        # Supabase Edge Function (public, verified server-side)
  → Windmill flow contact_intake             # synchronous webhook, scoped Bearer token in Edge secrets
  → store_submission script                  # server-side DB credential (Windmill resource)
  → contact_submissions                      # UUID PK, RLS enabled, no anon policies; idempotent inserts
  ← 200 {request_id, status:"received"}      # only after explicit {stored:true}
```

Retries reuse the same `request_id`; failures never fake success.