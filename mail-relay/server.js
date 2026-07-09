require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const RELAY_SECRET = process.env.RELAY_SECRET;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!RELAY_SECRET || !GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error('Missing required env vars: RELAY_SECRET, GMAIL_USER, GMAIL_APP_PASSWORD');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
});

function requireSecret(req, res, next) {
  if (req.header('x-relay-secret') !== RELAY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/send', requireSecret, async (req, res) => {
  const { to, subject, text, html, fromName } = req.body || {};
  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: 'to, subject, and text or html are required' });
  }

  try {
    await transporter.sendMail({
      from: `${fromName || 'Ride On'} <${GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    res.json({ sent: true });
  } catch (err) {
    console.error('Send failed:', err.message);
    res.status(502).json({ error: 'Failed to send email', message: err.message });
  }
});

app.listen(PORT, () => console.log(`mail-relay listening on port ${PORT}`));
