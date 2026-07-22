# Spec: Litigation Hold for TTL-governed PII (small task)

**Owner repo for implementation:** picasso monorepo `Lambdas/lambda/` (NOT this website repo). Lives here as a deliverable of the privacy-policy / retention workstream. For the **compliance-implementation-advisor** to turn into code/tests. Deploy **staging-first**, prod gated, per SOP.

## Problem

Form-submission (and sibling) PII carries an **unconditional 365-day DynamoDB TTL** (`Lambdas/lambda/Master_Function_Staging/form_handler.py:695`). DynamoDB TTL deletes a row when its `ttl` timestamp passes **regardless of any legal obligation to preserve it** — litigation, regulatory request, active dispute, or a DSAR that must be fulfilled/verified before erasure. Today there is **no mechanism to suppress expiry** for specific subjects or tenants. This is both a legal-preservation gap and a privacy-policy honesty gap (a published "we retain no longer than X" is fine; silently auto-deleting data under hold is not).

DynamoDB TTL **cannot be intercepted per-item at expiry time**. The only reliable way to keep an item is for its `ttl` attribute to be **absent or in the future**. So a hold works by **removing/pushing out `ttl` on held rows**, driven by a hold registry, with re-stamping on release.

## Design

### 1. Hold registry (new table `picasso-legal-holds`)

One row per hold. Keyed to make scope lookups cheap.

| Field | Purpose |
|---|---|
| `hold_id` (PK) | Unique hold identifier |
| `scope_type` | `subject` \| `tenant` \| `conversation` |
| `scope_value` | `pii_subject_id` \| `tenant_id` \| `conversation_id` |
| `reason` | Free text (matter/case ref) |
| `placed_by`, `placed_at` | Who/when (audit) |
| `status` | `active` \| `released` |
| `released_by`, `released_at` | Release audit |

Registry rows are **append-only / audit-logged**; releases set `status`, never hard-delete.

### 2. Apply step (place hold)

On hold placement, enumerate matching rows across the **retention-bearing tables** and **remove the `ttl` attribute** (or set it far future) so they cannot expire:

| Table | Match by |
|---|---|
| `picasso-form-submissions` | `pii_subject_id` / `tenant_id` |
| `picasso-conversation-state` | derived session / `conversation_id` |
| `session-summaries` | subject-derived session |
| `session-events` | subject / session |
| `picasso-booking`, scheduling rows | `attendee` subject |

Store the **original `ttl`** on the row (e.g. `ttl_held_from`) so it can be restored. Idempotent: re-applying an active hold is a no-op.

### 3. Release step

On release, for each affected row: restore `ttl = max(original_ttl, now + minimum_tail)` (so a row doesn't instantly vanish on release), set registry `status=released`. If the original retention window already elapsed during the hold, apply a short tail (e.g. 30 days) before deletion.

### 4. DSAR / purge pipeline guard (critical)

The existing deletion/purge pipeline **must check the hold registry first** and **refuse to delete a subject/tenant with an `active` hold**, returning a "retained under legal obligation" outcome instead of a silent skip or a delete. This is the inverse of the normal DSAR flow and is a **recognized exemption** under CCPA/CPRA and GDPR (retention required to comply with a legal obligation / establish or defend legal claims). The requester should be told their data is retained on that basis.

### 5. Interaction with existing carve-outs

Distinct from the **consent/suppression carve-outs** (SMS/TCPA consent, STOP rows) which are retained *against* deletion by default (`docs/roadmap/PII-Project/data-retention-strategy.md:51,90`). A litigation hold is a **separate, matter-scoped, releasable** overlay — do not conflate the two registries.

## IAM / config

- Dedicated execution role (no sharing). Permissions: `dynamodb:UpdateItem`/`Query`/`Scan` on the retention-bearing tables (remove/re-add `ttl`), full CRUD on `picasso-legal-holds`, own CloudWatch Logs group.
- Placement/release is a **privileged operator action** — gate behind an authenticated admin path, not a public endpoint. Every place/release is audit-logged (who/when/scope/reason).

## Testing / verification

- Unit: place hold → `ttl` removed + `ttl_held_from` saved; release → `ttl` restored with tail; re-apply idempotent.
- Integration: seed a subject across all retention-bearing tables with near-future `ttl`; place hold; assert none expire past the TTL window; run the DSAR purge and assert the held subject is **refused, not deleted**; release and assert normal expiry resumes.
- Forward-compat: readers tolerate rows with/without `ttl_held_from` (schema-discipline rule).

## Rough effort

~1–1.5 days: hold registry + apply/release across the table set + the DSAR-pipeline guard + tests. Add the admin trigger surface separately if one doesn't already exist.

## Counsel sign-off items

1. Who may place/release a hold, and the approval path.
2. Retention duration/handling while held, and notice to the data subject that erasure is deferred under legal obligation.
3. Which matters/triggers auto-create a hold vs. manual placement.
