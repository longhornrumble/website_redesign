const VALID_STRUGGLES = [
    'not-enough-volunteers',
    'after-hours-engagement',
    'website-traffic-no-action',
    'social-media-dead-ends',
    'event-follow-through',
    'other',
];

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, website, struggle } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
    }

    if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!website || !website.trim()) {
        return res.status(400).json({ error: 'Website URL is required' });
    }

    try {
        new URL(website);
    } catch {
        return res.status(400).json({ error: 'Invalid website URL' });
    }

    if (!struggle || !VALID_STRUGGLES.includes(struggle)) {
        return res.status(400).json({ error: 'Invalid struggle selection' });
    }

    // Build webhook payload
    const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        website: website.trim(),
        struggle,
        submittedAt: new Date().toISOString(),
        source: 'free-audit-landing-page',
    };

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const apiKey = process.env.N8N_API_KEY;

    if (!webhookUrl) {
        console.error('N8N_WEBHOOK_URL environment variable not configured');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!n8nResponse.ok) {
            console.error('n8n webhook error:', n8nResponse.status, await n8nResponse.text());
            return res.status(500).json({ error: 'Failed to process audit request' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('n8n webhook error:', error);
        return res.status(500).json({ error: 'Failed to process audit request' });
    }
}
