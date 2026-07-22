# Spec: Meta Data Deletion Request Callback (small Lambda task)

**Owner repo for implementation:** picasso monorepo `Lambdas/lambda/` (NOT this website repo). This spec lives here because it's a deliverable of the privacy-policy / Meta App Review workstream; the code lands in the Meta integration repo alongside `Meta_Webhook_Handler`, `Meta_Response_Processor`, and `Meta_OAuth_Handler`.

**Why:** Meta App Review requires either a **Data Deletion Instructions URL** or a **Data Deletion Request Callback URL** for apps that access Platform Data. We already provide instructions in the privacy policy, but a callback is the robust option and removes the "we can't reach Messenger-only users by identity" gap (privacy-policy counsel note #3). Deploy **staging-first**, prod gated, per SOP.

## 1. Endpoint

- New Lambda `Meta_Data_Deletion_Handler` (Node.js 20.x) fronted by a **Function URL** (or API Gateway route) — public, `AuthType: NONE` (Meta calls it unauthenticated; the signed_request HMAC is the auth).
- Register the URL in the Meta App Dashboard → App Settings → Advanced → **Data Deletion Request URL**.
- Also expose a **status page URL** (`GET /deletion-status?code=<confirmation_code>`) — can be a static page on `www.myrecruiter.ai` or a second route on the same Lambda.

## 2. Request contract (from Meta)

`POST` with `Content-Type: application/x-www-form-urlencoded`, body param `signed_request`.

```
signed_request = base64url(HMAC_SHA256_signature) + "." + base64url(payload_json)
```

- Verify: `HMAC_SHA256(base64url_payload, APP_SECRET)` must equal the decoded signature. **Reject on mismatch** (return 400). Use the **same app secret** used for webhook signature verification; Instagram uses its own app secret (mirror the dual-secret handling already in `Meta_Webhook_Handler`).
- Decoded `payload` contains at minimum `{ "algorithm": "HMAC-SHA256", "user_id": "<app-scoped user id>", "issued_at": <ts> }`.

## 3. Response contract (to Meta)

Return `200` with JSON:

```json
{ "url": "https://www.myrecruiter.ai/deletion-status?code=ABC123", "confirmation_code": "ABC123" }
```

Meta shows `url` to the user so they can check status. `confirmation_code` must let us look up the request.

## 4. Deletion actions

Enqueue (recommended: write a job row + push to an SQS queue for async processing so the callback responds fast) deletion of all PSID-keyed records for the given user across:

| Store | Key / how to find | Notes |
|---|---|---|
| `picasso-channel-mappings` | PSID-scoped item | Includes KMS-encrypted page token record for that user mapping |
| `recent-messages` | `sessionId = meta:{pageId}:{psid}` | message content; also ages out via TTL |
| `picasso-conversation-state` | PSID-derived rows (lock/form/scheduling) | may hold free-text + email + phone |
| `conversation-summaries` | PSID-derived sessionId | AI-inferred content about the subject |
| `session-events` | events tagged with psid/session | analytics preview text |
| `s3://picasso-archive/sessions/{sessionId}/*` | archived snapshots | delete prefix |
| `webhook-dedup` | transient mid only | no action needed (24h TTL) |

Record request + completion in a small `deletion-requests` table keyed by `confirmation_code` (status: `received` → `completed`), read by the status page.

## 5. Known complication — App-Scoped ID vs. Page-Scoped ID (flag, decide)

The callback's `user_id` is the **app-scoped user ID (ASID)**. Our data is keyed by **page-scoped PSID** (Messenger) / IGSID (Instagram). These are **not the same value**. Options:

1. **ID Matching API** (`/{app-scoped-id}/ids_for_pages` via the Business, requires business verification + page tokens) to resolve ASID → PSID(s), then delete. Most complete.
2. **Best-effort + TTL backstop:** if we cannot resolve ASID→PSID, still return a valid confirmation, rely on the short TTLs to age the data out, and document the limitation. Least effort; matches current privacy-policy language.

Recommend starting with **Option 2** for App Review sign-off, with **Option 1** as a fast-follow once business verification is in place. Confirm with Meta reviewer expectations.

## 6. IAM / config

- Dedicated execution role (never shared — per repo hard rule). Permissions: `dynamodb:DeleteItem`/`Query` on the tables above, `s3:DeleteObject`/`ListBucket` on the archive prefix, `kms:Decrypt` only if needed, `sqs:SendMessage` if async, and its own CloudWatch Logs group.
- Secrets: app secret(s) from the same source `Meta_Webhook_Handler` uses. Do not log signed_request or secrets.

## 7. Testing / verification

- Unit: signed_request parse + HMAC verify (valid, tampered, wrong-secret → all handled); malformed body → 400.
- Integration: seed PSID-keyed fixtures across the tables, POST a valid signed_request, assert rows deleted / job recorded, and a well-formed JSON response.
- Manual: trigger via Meta App Dashboard "Send Test" for the Data Deletion URL; confirm the status URL renders.
- Forward-compat: reader tolerates payloads missing optional fields (schema-discipline rule).

## 8. Rough effort

~0.5–1 day for Option 2 (parse/verify + async delete-by-PSID + status row + tests). Add ~1–2 days if implementing Option 1 (ID Matching + business verification plumbing).
