const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const DOH_UPSTREAM = process.env.DOH_UPSTREAM; // مثال: https://example.com/dns-query

if (!DOH_UPSTREAM) {
  console.error('DOH_UPSTREAM environment variable is not set. Set it to your upstream DoH URL.');
}

app.use((req, res, next) => {
  // ساده CORS برای تست/مرورگر
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// GET handler: فوروارد کوئری‌استرینگ
app.get('/dns-query', async (req, res) => {
  if (!DOH_UPSTREAM) return res.status(500).send('DOH_UPSTREAM not set');

  try {
    const qs = new URLSearchParams(req.query).toString();
    const sep = DOH_UPSTREAM.includes('?') ? '&' : '?';
    const url = DOH_UPSTREAM + (qs ? sep + qs : '');
    const accept = req.get('accept') || 'application/dns-message';

    const upstreamRes = await fetch(url, {
      method: 'GET',
      headers: { accept }
    });

    const buffer = Buffer.from(await upstreamRes.arrayBuffer());
    res.status(upstreamRes.status);
    upstreamRes.headers.forEach((v, k) => res.setHeader(k, v));
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(502).send('Bad gateway');
  }
});

// POST handler: فوروارد بادی باینری (application/dns-message)
app.post('/dns-query', bodyParser.raw({ type: '*/*', limit: '2mb' }), async (req, res) => {
  if (!DOH_UPSTREAM) return res.status(500).send('DOH_UPSTREAM not set');

  try {
    const contentType = req.get('content-type') || 'application/dns-message';
    const accept = req.get('accept') || 'application/dns-message';

    const upstreamRes = await fetch(DOH_UPSTREAM, {
      method: 'POST',
      headers: {
        'content-type': contentType,
        accept
      },
      body: req.body
    });

    const buffer = Buffer.from(await upstreamRes.arrayBuffer());
    res.status(upstreamRes.status);
    upstreamRes.headers.forEach((v, k) => res.setHeader(k, v));
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(502).send('Bad gateway');
  }
});

app.get('/health', (req, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log(`DoH proxy listening on ${PORT}, forwarding to ${DOH_UPSTREAM || '<not set>'}`);
});
