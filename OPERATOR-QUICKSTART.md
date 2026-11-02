# SAFI Operator Quick Start (≤10 steps, ~5–10 minutes)

Goal: open the demo site, submit a test inquiry, and verify it was stored — with no developer help.

1. **Site**: open https://yooumarr.github.io/umar-web-001-ai-website/
2. **Fill the contact form**: your name, any email like `operator@test.local`, message of 10+ characters. Submit via **Request a Callback**. A green confirmation means it was stored.
3. **Supabase**: log in at https://supabase.com with the project credentials (transferred via the developer's vaulted one-time link). Open project **web-001** (ref `kyfhfmqjggkybpepnnyf`).
4. Go to **Table Editor → `contact_submissions`**: your row appears at the top ( newest first). Note its timestamp.

   *(Optional deeper check)* 5. **Windmill**: log in at https://app.windmill.dev → workspace `web-001-demo` → **Runs** (or **Apps → contact_intake → Runs**). The latest run corresponds to your submission: result should be `{"stored": true, ...}` matching the row above.

6. **Rejection check (optional)**: submit the form with an **empty message** → inline error "Message must be 10–1000 characters." and **no** new row in Supabase. This is expected behavior.
7. **Record**: log date + time of your test, and note "form submission verified" in the team log.
8. **Troubleshooting**: if the form shows *"We could not store your submission…"*, wait 2 minutes and retry — a delayed backend (Windmill/DB) outage is transient; persistence across retries is by design.
9. If unavailable for longer than 15 minutes, raise it with the developer (the Edge Function's `WINDMILL_WEBHOOK_*` secrets or the Windmill token may need attention).
10. Done. Nothing else is required — no emails, no logins for visitors.

**Reality check**: this pilot is intentionally small — single-page, single table, no admin UI by design (SOW exclusions). Direct DB ops are blocked read/write for everyone except the server-side Windmill credential.
