import FormData from 'form-data';

// Helper to collect plain text stream
async function readTextBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return res.status(500).json({ error: 'Server missing API configuration.' });
        }

        // Read the raw base64 text string directly
        const base64Data = await readTextBody(req);
        
        if (!base64Data || !base64Data.includes('base64,')) {
            return res.status(400).json({ error: 'Invalid or missing image stream data' });
        }

        // Convert string directly to buffer
        const cleanBase64 = base64Data.split('base64,')[1];
        const base64Buffer = Buffer.from(cleanBase64, 'base64');

        const telegramForm = new FormData();
        telegramForm.append('chat_id', CHAT_ID);
        telegramForm.append('photo', base64Buffer, {
            filename: 'capture.jpg',
            contentType: 'image/jpeg'
        });

        const telegramResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: telegramForm,
            headers: telegramForm.getHeaders()
        });

        const telegramResult = await telegramResponse.json();

        if (telegramResult.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ error: telegramResult.description || 'Telegram rejected photo' });
        }

    } catch (error) {
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}