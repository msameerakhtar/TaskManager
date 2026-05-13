const nodemailer = require('nodemailer');

const isValidSlackWebhook = (url) =>
    typeof url === 'string' && url.startsWith('https://hooks.slack.com/services/');

const sendSlackWebhook = async (url, text) => {
    if (!isValidSlackWebhook(url)) {
        return { ok: false, error: 'Invalid Slack webhook URL (must be https://hooks.slack.com/services/...)' };
    }
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        return { ok: false, error: body || res.statusText };
    }
    return { ok: true };
};

const getMailer = () => {
    const host = process.env.SMTP_HOST;
    if (!host) return null;
    return nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
            : undefined
    });
};

const sendProjectEmail = async ({ to, subject, text }) => {
    const transport = getMailer();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@localhost';
    if (!transport) {
        console.log('[email not configured — log only]', { to, subject, text: text.slice(0, 200) });
        return { ok: true, mocked: true };
    }
    await transport.sendMail({ from, to, subject, text });
    return { ok: true };
};

module.exports = { sendSlackWebhook, sendProjectEmail, isValidSlackWebhook };
