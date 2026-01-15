# Scripts

## Stripe Customer Cleanup

The checkout flow creates a Stripe Customer **before** redirecting to Stripe Checkout. If users abandon checkout, these orphaned customer records remain in Stripe.

### How It Works

The cleanup process identifies customers that:
- Were created more than 24 hours ago (grace period)
- Have no subscriptions (active or canceled)
- Have no charges/payments
- Have no invoices

These are considered "orphaned" and safe to delete.

### Setup

1. **Generate a cleanup API key** - Create a random string to secure the endpoint:
   ```bash
   openssl rand -hex 32
   ```

2. **Add to Vercel Environment Variables**:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add `CLEANUP_API_KEY` with your generated key
   - Redeploy

### Usage

#### Option 1: Shell Script (Recommended)

```bash
# Dry run - shows what would be deleted (safe)
CLEANUP_API_KEY=your_key ./scripts/run-cleanup.sh

# Execute - actually deletes orphaned customers
CLEANUP_API_KEY=your_key ./scripts/run-cleanup.sh --execute
```

#### Option 2: Direct API Call

```bash
# Dry run
curl -X POST https://myrecruiter.ai/api/cleanup-orphan-customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLEANUP_API_KEY" \
  -d '{"dryRun": true}'

# Execute
curl -X POST https://myrecruiter.ai/api/cleanup-orphan-customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLEANUP_API_KEY" \
  -d '{"dryRun": false}'
```

### Response Format

```json
{
  "success": true,
  "message": "Dry run complete. Found 5 orphaned customers that would be deleted.",
  "results": {
    "scanned": 150,
    "orphaned": 5,
    "deleted": 0,
    "skipped": 10,
    "errors": [],
    "deletedCustomers": [
      {
        "id": "cus_xxx",
        "email": "abandoned@example.com",
        "name": "Test Org",
        "created": "2024-01-15T10:30:00.000Z",
        "action": "would_delete"
      }
    ],
    "dryRun": true
  }
}
```

### Automated Cleanup (Optional)

To run cleanup automatically, you can set up a Vercel Cron Job (requires Pro plan):

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cleanup-orphan-customers",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

Note: Cron jobs on Vercel don't support request bodies, so you'd need to modify the function to default to execute mode when called by cron (check for `x-vercel-cron` header).

### Safety Features

- **Dry run by default** - Won't delete anything unless explicitly told to
- **24-hour grace period** - Never deletes recently created customers
- **Authorization required** - Protected by API key
- **Full audit trail** - Returns list of all affected customers
