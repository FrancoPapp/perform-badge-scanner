import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env without extra dependencies
try {
  const env = readFileSync(join(__dirname, '.env'), 'utf8');
  for (const line of env.split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0 && !line.trimStart().startsWith('#')) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (k) process.env[k] = v;
    }
  }
} catch { /* .env is optional */ }

const DT_TENANT = process.env.DT_TENANT;
const DT_TOKEN  = process.env.DT_TOKEN;
const PORT      = process.env.PORT || 3000;

if (!DT_TENANT || !DT_TOKEN) {
  console.error('DT_TENANT and DT_TOKEN must be set in .env or environment');
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'docs')));

app.post('/api/scan', async (req, res) => {
  const { attendee_id, station_id, station_name, staff_id } = req.body;

  if (!attendee_id || !station_id) {
    return res.status(400).json({ error: 'attendee_id and station_id are required' });
  }

  const event = {
    'event.type':     'com.dynatrace.perform.stand.scan',
    'event.provider': 'perform.badge.scanner',
    'attendee.id':    attendee_id,
    'station.id':     station_id,
    'station.name':   station_name || station_id,
    'timestamp':      new Date().toISOString(),
  };
  if (staff_id) event['scanned_by.staff_id'] = staff_id;

  let dtRes;
  try {
    dtRes = await fetch(`${DT_TENANT}/api/v2/bizevents/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Api-Token ${DT_TOKEN}`,
      },
      body: JSON.stringify(event),
    });
  } catch (err) {
    console.error('DT fetch failed:', err.message);
    return res.status(502).json({ error: 'Could not reach Dynatrace tenant' });
  }

  if (!dtRes.ok) {
    const body = await dtRes.text();
    console.error(`DT API ${dtRes.status}:`, body);
    return res.status(dtRes.status).json({ error: body });
  }

  console.log(`[scan] ${station_id} → ${attendee_id}`);
  res.json({ ok: true, event });
});

app.listen(PORT, () => {
  console.log(`Badge scanner on http://localhost:${PORT}`);
  console.log(`Tenant: ${DT_TENANT}`);
});
