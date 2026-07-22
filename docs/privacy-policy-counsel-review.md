# Privacy Policy — Counsel Review Notes

**Status:** Draft revised policy shipped to `src/pages/privacy.astro` (branch `feature/privacy-policy-meta-omnichannel`). **Do not merge to `main` (production) until the open items below are resolved by counsel/product** — merging deploys the page live to `www.myrecruiter.ai` via Vercel.

**Prepared:** 2026-07-21. Not legal advice. Grounded in an internal code + data-flow review of the platform (chat widget, Lambdas, the Facebook Messenger / Instagram integration, the maintained subprocessor list, and the PII inventory).

## What changed vs. the prior policy (last updated 2026-01-16)

The prior policy was a clean generic template but did not reflect the product's actual data flows. This revision adds/strengthens:

1. **Two Roles (Controller vs. Processor)** section up front — the nonprofit Customer is the Controller for End User data; MyRecruiter is the Processor.
2. **Conversation & message content** disclosed as a collected data category (previously absent).
3. **Messaging Channel data** (Facebook Messenger / Instagram) — platform-scoped user IDs (PSID/IGSID), message content, metadata.
4. **AI & Automated Processing** — names the processor (AWS Bedrock / Anthropic Claude), states messages are sent to an LLM to generate replies, and discloses AI-generated conversation summaries about individuals.
5. **Messaging Channels — Facebook Messenger and Instagram** — dedicated section with Meta Platform Terms / Developer Policies commitments and the "no sale / no advertising use of Meta Platform Data" language required for Meta App Review.
6. **Named Subprocessors** table (AWS, Anthropic, Meta, Telnyx, Clerk, Google, Firecrawl, Stripe) + clarification that Customer-directed downstream sinks (CRM/Sheets/webhooks) are not our Subprocessors.
7. **Expanded rights** — CCPA/CPRA, other U.S. states, EEA/UK, explicit "we do not sell or share," and a Messenger/Instagram deletion mechanism.

Deliberately **not** over-promised: deletion language for Messenger-only End Users (see item 3 below) and form-submission retention numbers (item 1 below).

## Open items to resolve before publishing (then delete this file or move it out of the deploy path)

1. **Form-submission retention** — RESOLVED via privacy-data-governance advisory (2026-07-21), grounded in code:
   - **Code enforces a uniform 365-day TTL** on every form-submission row (`Lambdas/lambda/Master_Function_Staging/form_handler.py:695`), matching the locked operator decision (`docs/roadmap/PII-Project/data-retention-strategy.md:48,110`). The inventory's "effectively permanent / no TTL" note (`pii-inventory.md:93`) is **STALE** — reconcile it.
   - Form data is **Tier-3-floor raw PII** (name/email/phone/free-text); some tenants (foster/minors/crisis) carry vulnerable-population context. Our store is an **operational buffer + discretionary lead record** — the Controller receives its own copy via fulfillment at capture (`form_handler.py:970-1039`) and analytics is de-identified (`form_handler.py:714`), so nothing technical requires long retention.
   - **Recommendation:** endorse **365 days as a tenant-configurable CEILING** (not a floor); allow shorter per-tenant; **counsel-set shorter default (~90–180d) for vulnerable-population tenants**. Consent artifacts are separate (SMS/TCPA, 4–5yr, never DSAR-deleted, `data-retention-strategy.md:51`).
   - **Keep the public policy GENERAL** (no single hard number) until item #13 (controller/processor determination) is decided — that gates who publishes a consumer retention schedule. If counsel wants a number, express it as a **maximum/ceiling** that code enforces.

2. **Messaging retention specifics** — code today ages Messenger/IG message content on a short TTL (recent-messages ~7 days for Meta rows; widget recent-messages ~24h; analytics preview ~90 days; logs ~30 days). Page says "short-term" rather than exact days so the policy doesn't lock to an implementation detail. Decide whether to state exact days.

3. **Deletion reachability** — a Messenger/Instagram-only End User who never provides an email is keyed only by a platform ID; the email-keyed deletion index cannot reach that data by identity alone. Page language is written to **not** over-promise. The **Meta Data Deletion Callback** (spec: `docs/meta-data-deletion-callback-SPEC.md`) is the more robust fix and is recommended before Meta App Review.

4. **Meta App Review sequencing** — this policy must be **live at a public URL and cover Messenger + Instagram data use BEFORE submitting for App Review.** The Meta app is currently in Development mode; review was not submitted. Confirm the app's requested permissions match the policy (current scopes: `pages_messaging`, `pages_show_list`, `pages_read_engagement`, `instagram_basic`, `instagram_manage_messages`).

5. **Bedrock invocation logging** — confirm whether AWS Bedrock model-invocation logging is enabled (would persist raw prompts). If enabled, ensure retention/security statements remain accurate.

6. **Contact method** — RESOLVED: page routes all privacy/rights/deletion requests to `privacy@myrecruiter.ai` (confirmed live 2026-07-21). No further action unless counsel prefers a different address.

7. **Legal entity / address** — page states "MyRecruiter LLC" with email-only contact (matching the prior page, which had no mailing address). Confirm whether a physical/mailing address is required for any jurisdiction.

8. **EEA/UK scope** — internal scope currently excludes a formal GDPR program. Page includes a measured EEA/UK rights paragraph. If there is no EEA/UK offering, counsel may narrow or remove it; SCCs / lawful basis are intentionally not addressed here.

9. **IP address characterization** — current widget/analytics contracts largely avoid persisting IP/UA as consumer PII; IP is used transiently. Confirm before relying on the "transient" characterization.

10. **"Do not sell/share" durability** — confirm this remains true across all Customer configurations and any future ad/analytics integrations.

11. **Security representation / F-SEC1** — an unauthenticated form-write path was flagged internally (fabricated submissions possible). Not a policy statement, but relevant to the "commercially reasonable safeguards" representation — confirm remediation status with security.

12. **"Last updated" date** — page shows 2026-07-21 (draft date). Update to the actual publish date at merge.

13. **Controller vs. processor determination (Q1)** — the load-bearing gate. Decides whether MyRecruiter's own policy publishes a consumer retention schedule at all, or whether that duty sits with the tenant nonprofit (Controller). Counsel decision (`data-retention-strategy.md:117`).

14. **Prod TTL enforcement (honesty gate for any retention claim)** — prod is a divergent table `picasso_form_submissions` (Phase-4 carve-out, `pii-inventory.md:89`). A backfill log exists (`m4g2-prod-ttl-backfill-execution-log-2026-05-24.md`) but **TTL-enabled state + backfill completeness of pre-M4 legacy rows must be independently verified** before publishing any "we retain no longer than X" statement — a row missing the `ttl` attribute never expires.

15. **Litigation-hold exception (honesty + legal gap)** — the 365-day TTL is **unconditional** (`form_handler.py:695`); DynamoDB will auto-delete rows even under legal hold or a pending dispute/DSAR. Add a hold mechanism (per-row TTL suppression or hold table) + a documented hold process, and include the "unless a longer period is required to comply with law, resolve disputes, or enforce agreements" carve-out in the policy retention wording.
