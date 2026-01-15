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

    const { plan, contactName, email, organizationName, taxExempt, ein } = req.body;

    // Validate required fields
    if (!plan || !PRICE_IDS[plan]) {
        return res.status(400).json({
            error: 'Invalid plan. Must be one of: standard_monthly, standard_annual, premium_monthly, premium_annual'
        });
    }

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    if (!contactName) {
        return res.status(400).json({ error: 'Contact name is required' });
    }

    if (!organizationName) {
        return res.status(400).json({ error: 'Organization name is required' });
    }

    const priceId = PRICE_IDS[plan];

    try {
        // Create Stripe Customer with tax exemption status
        const customerData = {
            email,
            name: organizationName,
            business_name: organizationName,
            individual_name: contactName,
            tax_exempt: taxExempt ? 'exempt' : 'none',
            metadata: {
                contact_name: contactName,
                organization_name: organizationName,
                exemption_status: taxExempt ? 'pending_verification' : 'not_exempt',
            },
        };

        // Add EIN to metadata if provided
        if (taxExempt && ein) {
            customerData.metadata.ein = ein;
        }

        const customer = await stripe.customers.create(customerData);

        // Create Checkout Session with the customer
        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            // Pre-fill organization name as read-only custom field
            custom_fields: [
                {
                    key: 'organization_name',
                    label: {
                        type: 'custom',
                        custom: 'Organization Name',
                    },
                    type: 'text',
                    text: {
                        default_value: organizationName || '',
                    },
                },
            ],
            // Save billing address to customer (keep organization name as customer name)
            customer_update: {
                address: 'auto',
            },
            // Enable automatic tax calculation
            automatic_tax: {
                enabled: true,
            },
            // Collect billing address
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
