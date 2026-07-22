# Terms of Service — Counsel Review Notes

**Status:** Draft revised Terms shipped to `src/pages/terms.astro` (branch `feature/privacy-policy-meta-omnichannel`). **Do not merge to `main` (production) until the open items below are resolved by counsel/product** — merging deploys the page live to `www.myrecruiter.ai` via Vercel.

**Prepared:** 2026-07-21. Not legal advice. Grounded in the same internal code + data-flow review that informed the revised Privacy Policy (chat widget, Lambdas, the Facebook Messenger / Instagram integration, the subprocessor list, the PII inventory, and the live Stripe subscription plans). Companion to `privacy-policy-counsel-review.md`.

## What changed vs. the prior Terms (last updated 2026-01-16)

The prior Terms were a clean generic template that predated the current platform. This revision aligns the Terms with the grounded state and with the revised Privacy Policy:

1. **"Who These Terms Cover" (new, Section 2)** — distinguishes **Customer** (nonprofit licensee, bound by all Terms) from **End User** (person interacting through a Customer, primarily governed by the Customer's own terms; acceptable-use still applies). The prior single ambiguous "you" is resolved. Mirrors the Controller/Processor split in the Privacy Policy.
2. **Service description (Section 1)** — grounded to what actually ships: AI chat widget, connected Messenger/Instagram channels, conversational forms, analytics, optional SMS/email follow-up and scheduling.
3. **Customer Responsibilities (new, Section 6)** — Customer-as-Controller obligations: legal basis/notice/consent for End User data, configuration/content accuracy, messaging-law compliance for outreach, authority over connected accounts, downstream-destination ownership, and program-compliance (incl. the employment/FCRA/background-check carve-out drawn from the platform's internal compliance triggers).
4. **AI section (Section 8)** — names the actual stack (AWS Bedrock / Anthropic Claude), discloses conversation summaries, "no training on your data," and "not for legally significant automated decisions."
5. **Messaging Channels (new, Section 9)** — Meta Platform Terms / Developer Policies commitments, Customer's authority to connect Pages/IG, "Meta is not a party." Supports Meta App Review alongside the Privacy Policy.
6. **Fees (Section 11)** — grounded to the real model: recurring monthly/annual subscriptions via the payment processor, **auto-renewal**, cancellation-at-period-end, taxes, price change at renewal. (Prior text was generic.)
7. **Termination (Section 13)** — adds a survival clause and points data deletion to the Privacy Policy's retention practices.
8. **Privacy Policy incorporated by reference** throughout (Sections 2, 7, 8, 13).
9. **Disclaimers / Indemnification** — extended to AI-output accuracy and to Customer Data / configuration / End-User relationships.

Deliberately **not** added without a counsel decision: an arbitration/class-action-waiver clause, a specific venue/jurisdiction line, an SLA/uptime commitment, a formal DPA reference, and specific dollar pricing (kept general so plan changes don't require a Terms edit).

## Open items to resolve before publishing (then delete this file or move it out of the deploy path)

1. **Governing law / dispute resolution (Q)** — Terms keep **Texas** governing law (unchanged from prior) but add **no** arbitration clause, class-action waiver, or venue/forum-selection clause. Decide whether counsel wants to add binding arbitration + venue (common for SaaS) — a substantive choice, intentionally left to counsel rather than invented here. Note the entity is now a **Delaware LLC** (item #9); counsel may prefer to align governing law to Delaware or keep Texas (both are valid and coexist with Delaware formation).

2. **Contact email** — Terms route to `info@myrecruiter.ai` (matches the prior Terms). The Privacy Policy routes privacy/rights/deletion to `privacy@myrecruiter.ai`. Decide whether legal notices should go to a dedicated `legal@myrecruiter.ai` or stay `info@`. (Kept `info@` as the known-live address.)

3. **Order form / MSA relationship — RESOLVED (2026-07-21, operator):** the website **click-through is the operative agreement**. Companies subscribe and cancel online; there is no separate order form or MSA. No order-of-precedence clause is needed; the "an applicable order or plan" phrasing in Section 11 simply covers plan-specific fee details shown at checkout.

4. **Auto-renewal disclosure law** — Section 11 discloses auto-renewal, cancellation-at-period-end, and price-change-at-renewal. State Automatic Renewal Laws (ARLs), strictest being **California's**, require clear-and-conspicuous pre-purchase disclosure, affirmative consent, a post-purchase acknowledgment with cancellation instructions, and easy online cancellation. **Mitigating factor:** most ARLs (incl. CA) are aimed at **consumer** transactions; MyRecruiter is **B2B** (organizations subscribe), which is generally outside their core scope — lower exposure than a B2C SaaS. **Federal note:** the FTC "Click-to-Cancel"/Negative Option Rule was **vacated by the 8th Circuit in July 2025**, so there is no federal click-to-cancel mandate today; state ARLs still apply. Confirm the Stripe checkout shows the renewal terms clearly and that online cancellation is genuinely self-serve (it is, per operator). Wording is likely sufficient as-is for a B2B posture; counsel to confirm.

5. **Refund wording vs. actual practice** — Terms say fees are "non-refundable except as required by law." Confirm this matches actual practice and the checkout page. (The marketing site's Stripe checkout has monthly and annual plans; annual prepay + "non-refundable" is a combination counsel may want softened or qualified.)

6. **DPA (Data Processing Agreement) / CCPA "service provider" terms** — the Privacy Policy and these Terms characterize MyRecruiter as a processor acting "under our agreement" with the Customer. There is no standalone DPA today; the click-through Terms are the agreement. **Context (2026-07-21):** CCPA/CPRA is **not** a children's law (see item #14) — it is California's general **consumer** privacy law applying to for-profit **"businesses"** meeting thresholds ($25M+ revenue, 100k+ CA consumers/households, or ≥50% revenue from selling/sharing PI). MyRecruiter likely does not meet those thresholds and is not directly a covered "business" today. The CCPA "service provider" **contract-terms** requirement is triggered by a **covered business** sharing PI with its service provider — but MyRecruiter's Customers are **nonprofits, which are generally excluded from CCPA's "business" definition**, so that contract pressure is low. **Caveat:** a few newer state laws (e.g., **Colorado**, **Oregon**) do reach some **nonprofits** — those Customers may eventually ask for processor/DPA contract language. Recommendation: no DPA required to launch; revisit if/when a Customer subject to a nonprofit-covering state law requests one. (This item lives mostly in the Privacy Policy, not the Terms.)

7. **Employment / FCRA / background-check carve-out (Section 6)** — the Terms state the Service "is not designed or licensed for" employment/credit/background-check decisions and push responsibility + required legal review to the Customer. This mirrors the platform's internal compliance triggers (`CLAUDE.md` Employment/Hiring Trigger and Background Check Caution). Confirm counsel is comfortable with a contractual carve-out rather than a hard technical prohibition, given the current nonprofit-volunteer scope.

8. **Meta App Review sequencing** — like the Privacy Policy, these Terms should be **live at a public URL** and consistent with the requested Messenger/Instagram scopes **before** submitting for Meta App Review. The Meta app is currently in Development mode. Confirm the Terms + Privacy Policy pair matches the app's requested permissions (`pages_messaging`, `pages_show_list`, `pages_read_engagement`, `instagram_basic`, `instagram_manage_messages`).

9. **Legal entity / address — PARTLY RESOLVED (2026-07-21, operator):** entity is a **Delaware LLC**; Section preamble now reads "MyRecruiter LLC, a Delaware limited liability company." Remaining sub-question: whether a physical/mailing address is required anywhere (kept email-only, matching the Privacy Policy). Note: Delaware **formation** is independent of the **Texas governing-law** choice in Section 18 — both can coexist; see item #1.

10. **AI-output disclaimer strength** — Section 8 + Section 15 disclaim reliance on AI output and specialized-advice use. Given the nonprofit audience (which may include health/crisis/family-adjacent topics per tenant configuration), confirm counsel is satisfied with the disclaimer, or wants a stronger "not a substitute for professional/emergency services" line.

11. **Limitation-of-liability cap** — keeps the prior "12 months' fees" cap. Confirm this is the intended cap, and whether any carve-outs (e.g., for indemnification, confidentiality, or IP infringement) should be excluded from the cap.

12. **"Last updated" date** — page shows 2026-07-21 (draft date). Update to the actual publish date at merge (same as Privacy Policy item #12).

13. **Consistency pass with Privacy Policy** — publish the two together. Both are on the same branch; if either changes materially in counsel review (esp. Controller/Processor language, subprocessor list, retention, or Meta commitments), reconcile the other so they don't contradict.

---

## Compliance advisory review (2026-07-21) — findings and disposition

An internal privacy/data-governance advisory pass reviewed the draft Terms against the grounded platform state. Advisory only — not legal advice. Findings and what was done:

### Applied to the draft (self-remediable, low-risk — done)
- **Standard boilerplate added (was the most material gap).** New **Section 20 "General"** adds Entire Agreement, Assignment, Force Majeure, Notices, Severability, and No-Waiver clauses. These matter more here because the click-through Terms are the *entire and only* agreement (no MSA). **Counsel should still bless the final wording.**
- **Crisis/emergency carve-out** added to Section 8 ("Not an emergency service…") and a matching **Customer obligation** in Section 6 (surface AI/automated + not-for-emergencies notices to End Users). Addresses health/family/crisis-adjacent tenant configurations.
- **"No training" softened** (Section 8) from an unqualified representation about AWS/Anthropic to "under our current configuration and our AI providers' terms" — removes an over-promise about a third party's future behavior. The Company's *own* no-training commitment stays absolute.
- **Meta data-use wording reconciled** (Section 9) to match the Privacy Policy's "provide **and improve** the messaging functionality for the connecting Customer" — the Meta-aligned phrasing; removes the only live Terms↔Privacy contradiction.
- **Auto-renewal cancellation mechanism** added to Section 11 ("cancel at any time from your account or billing portal…") and **material-change email notice + cancel-before-renewal** added to Section 19. Supports ARL posture.
- **Data export on termination** one-liner added to Section 13.
- **"an applicable order or plan" → "the plan details shown at checkout"** (Section 11), consistent with the no-MSA resolution.

### Remaining — needs attorney or product/operational action (NOT yet done)
16. **Clickwrap acceptance capture (H2)** — *operational, not a doc edit.* The preamble asserts "by using… you agree" (browsewrap-flavored). For a paid, auto-renewing subscription with a liability cap + indemnity, enforceability (and ARL "affirmative consent") is much stronger with an explicit **"I agree to the Terms + Privacy Policy"** checkbox/CTA at signup/checkout, with the acceptance event **logged (timestamp, IP, Terms version)**. Confirm the Stripe/signup flow does this. This is also the "e-sign/click-acceptance record" item.
17. **California ARL sufficiency sign-off (M1)** — with cancellation-method + material-change notice now in the doc, counsel to confirm the B2B posture + flow satisfies CA ARL (and that a post-purchase renewal-terms acknowledgment email is actually sent).
18. **Indemnification procedure (L3)** — Section 17 is a one-way indemnity with no notice-of-claim / control-of-defense / cooperation mechanics and no stated interaction with the Section 16 cap. Standard to add; attorney-adjacent.
19. **End-User acceptable-use is browsewrap-weak (L4)** — extending Section 5 to End Users who merely chat (never click "agree") is a stated house rule, not an enforceable contract term. No change made; real leverage is the Customer's own terms (already acknowledged in Section 2). Flagged as a limitation, not a defect.
