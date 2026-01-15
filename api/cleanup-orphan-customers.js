import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Grace period in hours - don't delete customers created within this time
// (they might still complete checkout)
const GRACE_PERIOD_HOURS = 24;

export default async function handler(req, res) {
    // Only allow POST requests with authorization
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Simple API key check - use CLEANUP_API_KEY env var
    const authHeader = req.headers.authorization;
    const expectedKey = process.env.CLEANUP_API_KEY;

    if (!expectedKey) {
        return res.status(500).json({ error: 'CLEANUP_API_KEY not configured' });
    }

    if (authHeader !== `Bearer ${expectedKey}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check for dry-run mode (default to true for safety)
    const dryRun = req.body?.dryRun !== false;

    const gracePeriodSeconds = GRACE_PERIOD_HOURS * 60 * 60;
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - gracePeriodSeconds;

    const results = {
        scanned: 0,
        orphaned: 0,
        deleted: 0,
        skipped: 0,
        errors: [],
        deletedCustomers: [],
        dryRun,
    };

    try {
        // Paginate through all customers
        let hasMore = true;
        let startingAfter = undefined;

        while (hasMore) {
            const customers = await stripe.customers.list({
                limit: 100,
                starting_after: startingAfter,
            });

            for (const customer of customers.data) {
                results.scanned++;

                // Skip if customer was created within grace period
                if (customer.created > cutoffTimestamp) {
                    results.skipped++;
                    continue;
                }

                // Skip deleted customers
                if (customer.deleted) {
                    results.skipped++;
                    continue;
                }

                try {
                    // Check for subscriptions (active or canceled)
                    const subscriptions = await stripe.subscriptions.list({
                        customer: customer.id,
                        limit: 1,
                        status: 'all',
                    });

                    if (subscriptions.data.length > 0) {
                        // Customer has subscription history - keep them
                        continue;
                    }

                    // Check for any charges/payments
                    const charges = await stripe.charges.list({
                        customer: customer.id,
                        limit: 1,
                    });

                    if (charges.data.length > 0) {
                        // Customer has payment history - keep them
                        continue;
                    }

                    // Check for any invoices (even unpaid)
                    const invoices = await stripe.invoices.list({
                        customer: customer.id,
                        limit: 1,
                    });

                    if (invoices.data.length > 0) {
                        // Customer has invoice history - keep them
                        continue;
                    }

                    // This customer is orphaned - no subscriptions, payments, or invoices
                    results.orphaned++;

                    const customerInfo = {
                        id: customer.id,
                        email: customer.email,
                        name: customer.name,
                        created: new Date(customer.created * 1000).toISOString(),
                    };

                    if (dryRun) {
                        results.deletedCustomers.push({
                            ...customerInfo,
                            action: 'would_delete',
                        });
                    } else {
                        // Actually delete the customer
                        await stripe.customers.del(customer.id);
                        results.deleted++;
                        results.deletedCustomers.push({
                            ...customerInfo,
                            action: 'deleted',
                        });
                    }
                } catch (customerError) {
                    results.errors.push({
                        customerId: customer.id,
                        error: customerError.message,
                    });
                }
            }

            hasMore = customers.has_more;
            if (hasMore && customers.data.length > 0) {
                startingAfter = customers.data[customers.data.length - 1].id;
            }
        }

        return res.status(200).json({
            success: true,
            message: dryRun
                ? `Dry run complete. Found ${results.orphaned} orphaned customers that would be deleted.`
                : `Cleanup complete. Deleted ${results.deleted} orphaned customers.`,
            results,
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        return res.status(500).json({
            success: false,
            error: 'Cleanup failed',
            message: error.message,
            partialResults: results,
        });
    }
}
