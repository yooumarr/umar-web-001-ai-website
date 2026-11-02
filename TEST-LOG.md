# WEB-001 — T1–T8 PASS/FAIL Test Log

All tests performed by the developer as objective verification (SOW §7). SAFI retains final acceptance authority.

| ID | PASS condition | Status | Evidence (screenshots / outputs) | Date |
|----|----------------|--------|----------------------------------|------|
| T1 | Release A live URL shows required demo content; mobile works; form operable | ☐ PASS | `t1-desktop.png`, `t1-mobile.png` | _add_ |
| T2 | First push runs locked install, build, check, deploys release A | ☐ PASS | SHA `3bccb58`, run https://github.com/yooumarr/umar-web-001-ai-website/actions/runs/41436982357 (run #7); earlier runs #2–#6 document the iteration | _add_ |
| T3 | Human submits form in live browser; Edge→Windmill→Supabase row with matching request_id/fields | ☐ PASS | `t3-form-filled.png`, `t3-success.png`, `t3-supabase-row.png` | _add_ |
| T4 | Blank/malformed/oversized fields rejected with clear messages; ZERO rows created | ☐ PASS | `t4-error-blank.png`, `t4-zero-rows.png` (+ PowerShell 400 responses for blank name, non-UUID) | _add_ |
| T5 | RLS denies unauthenticated direct read/write; no secrets in Git/bundle/browser | ☐ PASS | `t5-rls.png` (anon GET → `[]`/denied; anon INSERT → no new row), grep of repo + bundle shows no tokens; `grep password/token` in `windmill/flows/contact_intake.json` → no matches | _add_ |
| T6 | bolt.diy natural-language edit → release B SHA; same URL shows callout + Request a Callback; form still stores | ☐ PASS | bolt prompt screenshot `t6-bolt-prompt.png`; SHA `b28f604`, run #8 URL; `t6-callout.png`, `t6-form-stores.png` | _add_ |
| T7a | Same request_id repeated → exactly one row | ☐ PASS | `t7-duplicate.png` (PowerShell Edge call with existing UUID; Table Editor count unchanged) | _add_ |
| T7b | Windmill unavailable → truthful error; recovery + retry → exactly one row, no duplicate | ☐ PASS | `t7-failure.png`, `t7-recovery.png`, `t7-one-row.png` (broken webhook URL → 502 error, then restored → success on retry) | _add_ |
| T8 | New operator: open site → submit → verify in Supabase/Windmill within 30 min unaided | ☐ PASS | Recording `t8-recording.mp4` + `OPERATOR-QUICKSTART.md` walkthrough | _add_ |

## Report test session

- Browser: _add_ (e.g. Edge/Chrome version)
- Live URL at test time: https://yooumarr.github.io/umar-web-001-ai-website/
- Edge Function: `contact-submit` (project ref `kyfhfmqjggkybpepnnyf`)
- Windmill workspace: `web-001-demo`, flow `u/umarworkit/contact_intake`

## Recording script (2–3 min, uninterrupted — capture in this order)

1. Show live **Version A**… but note: version A was overwritten by release B on the same URL. For the recording, the SOW chain is: A → form → Windmill → row → bolt edit → run B → same URL. Record what's available now: the live form (release B, same URL), Windmill run, Supabase row, then show the GitHub Actions history: run #7 (release A SHA `3bccb58`) → run #8 (release B SHA `b28f604`) with no manual deployment in between, then bolt.diy chat showing the original prompt. Redact: Windmill token, DB password (never shown), operator email can be blurred.
