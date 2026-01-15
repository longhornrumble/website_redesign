import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Map of allowed price IDs
const PRICE_IDS = {
    standard_monthly: 'price_1RlwUwCPQDfL3b8R5JsRKQ6x',
    standard_annual: 'price_1SpjGYCPQDfL3b8Rfo0VczCi',
    premium_monthly: 'price_1PJUqqCPQDfL3b8R2cV9RgM3',
    premium_annual: 'price_1Q5XfJCPQDfL3b8RXSgjSXKd',
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { plan } = req.body;

    // Validate the plan parameter
    if (!plan || !PRICE_IDS[plan]) {
        return res.status(400).json({
            error: 'Invalid plan. Must be one of: standard_monthly, standard_annual, premium_monthly, premium_annual'
        });
    }

    const priceId = PRICE_IDS[plan];

    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            // Create a Stripe Customer to store all collected info
            customer_creation: 'always',
            // Collect organization name via custom field
            custom_fields: [
                {
                    key: 'organization_name',
                    label: {
                        type: 'custom',
                        custom: 'Organization Name',
                    },
                    type: 'text',
                },
            ],
            // Allow customers to enter tax ID for tax exemption
            tax_id_collection: {
                enabled: true,
            },
            // Collect billing address (includes name)
            billing_address_collection: 'required',
            // Redirect URLs
            success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/#pricing`,
        });

        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return res.status(500).json({ error: 'Failed to create checkout session' });
    }
}
