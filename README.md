# Perform Badge Scanner

Browser-based QR scanner that fires a Dynatrace Business Event on every badge scan.

## Quick start

```bash
cd perform-badge-scanner
cp .env.example .env   # edit with your tenant + token
npm install
npm start              # → http://localhost:3000
```

> **Phone / on-device**: browsers require HTTPS for camera access.  
> Quickest tunnel: `npx ngrok http 3000` → open the HTTPS URL on the phone.

## Per-stand URL

Configure each phone by opening the app with URL params — no extra setup screen needed:

```
http://localhost:3000/?station_id=STAND_AI&station_name=AI+Innovation&staff_id=franco
```

| Param | Required | Example |
|---|---|---|
| `station_id` | yes | `STAND_AI` |
| `station_name` | no | `AI+Innovation` |
| `staff_id` | no | `franco` |

## Business Event schema (sent on each scan)

```json
{
  "event.type":     "com.dynatrace.perform.stand.scan",
  "event.provider": "perform.badge.scanner",
  "attendee.id":    "<badge QR value>",
  "station.id":     "STAND_AI",
  "station.name":   "AI Innovation",
  "timestamp":      "2026-08-24T10:30:00.000Z"
}
```

## DQL to verify events in Grail

```dql
fetch bizevents
| filter event.type == "com.dynatrace.perform.stand.scan"
| sort timestamp desc
| limit 50
```
