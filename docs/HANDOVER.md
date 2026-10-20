# Handover checklist

The company owns every account and every secret. The developer keeps nothing, and is added as a
collaborator only when maintenance is needed.

## Accounts (all in the company's name)

| What | Owner | Notes |
|---|---|---|
| Domain `chanrainigeria.com` | Chanrai Nigeria | Already registered. Change only `A`/`CNAME` records, never `MX` |
| Hosting (server or Vercel) | Chanrai Nigeria | |
| Database (Docker volume, Supabase or Neon) | Chanrai Nigeria | Nightly backups, see RUNBOOK |
| GitHub organisation + this repository | Chanrai Nigeria | Make the repository **private** |
| Sending mailbox (SMTP) | Chanrai Nigeria IT | e.g. `website@chanrainigeria.com`; add SPF/DKIM for it |
| AI key (Groq or other) | Chanrai Nigeria | Optional. The free tier is enough to start |
| First dashboard administrator | Named staff member | Created at `/admin/setup` |

## Before launch

- [ ] Desk emails and phone/WhatsApp numbers entered in **Settings**
- [ ] Logo (and a white version for dark mode) uploaded
- [ ] Each manufacturer has confirmed in writing how Chanrai may describe the relationship, and the logo rules
- [ ] Brand photos and brochures uploaded from the manufacturers' dealer media kits (below)
- [ ] Model list trimmed to what Chanrai actually supplies; each model's specifications checked and ticked
- [ ] Locations confirmed (Isolo is pre-filled from the business card; add Victoria Island or others if public)
- [ ] Privacy notice reviewed by the Data Protection Officer; DPO contact entered in Settings
- [ ] Test: a quote, a service booking with a photo and a parts request each reach the right desk, and the customer copy arrives
- [ ] Test: Enyo logs a request and the desk receives it
- [ ] Backups scheduled and one restore tested

## Brand assets to request

| Manufacturer | Ask for | Contact |
|---|---|---|
| LiuGong | High-resolution product photos, spec sheets (EMEA, metric), logo pack, dealer co-branding rules | LiuGong West Africa marketing, `lgci@liugong.com` |
| SOPAN / Sopan Process Technologies | Equipment brochure PDF, product photos, logo, model codes and full specifications | `marketing@sptlglobal.com`, +91 20 6770 4141 |
| BYD forklifts | EMEA spec sheets (kg, 500 mm load centre), product photos, logo and usage rules, local warranty statement | Chanrai's BYD account manager |

## What the content is based on

`content/seed/*.json` was researched in October 2026 from the manufacturers' public websites and spec sheets.
Each model lists its sources (shown to staff only). Key caveats:
- **LiuGong**: figures come from LiuGong Middle East & Africa spec sheets. The African range is mostly E-series excavators and H-series loaders.
- **BYD**: figures come mainly from BYD Singapore and Europe material. Some speeds and lift heights are missing or provisional.
- **SOPAN**: the company publishes ranges rather than model codes, so models are listed as ranges (e.g. "up to 3,000 SCMH").
- Maintenance intervals are general industry practice and say so. The manufacturer's manual always takes precedence.
- No prices, warranty lengths or "authorised dealer" claims appear anywhere until Chanrai confirms them.
