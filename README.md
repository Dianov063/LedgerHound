# LedgerHound — Crypto Forensics Website

Next.js 14 + next-intl + Tailwind CSS

## Languages
- 🇺🇸 English (default, no prefix: `/`)
- 🇷🇺 Russian (`/ru`)
- 🇪🇸 Spanish (`/es`)
- 🇨🇳 Chinese (`/zh`)
- 🇫🇷 French (`/fr`)
- 🇸🇦 Arabic (`/ar`, RTL)

## Setup

```bash
cd ledgerhound
npm install
npm run dev
```

Open http://localhost:3000

## Structure

```
app/[locale]/page.tsx        — Homepage (all sections)
app/[locale]/layout.tsx      — Root layout with RTL support
components/Navbar.tsx        — Navigation + language switcher
components/Footer.tsx        — Footer with links
messages/*.json              — All translations (6 languages)
middleware.ts                — Locale routing
i18n.ts                     — i18n configuration
```

## Pages to add next (via Claude Code)

- `/services/crypto-tracing`
- `/services/romance-scams`
- `/services/divorce-crypto`
- `/services/litigation`
- `/services/corporate-fraud`
- `/cases`
- `/pricing`
- `/about`
- `/blog`
- `/blog/[slug]`
- `/contact`
- `/free-evaluation`
- `/privacy`
- `/terms`

## Deploy to Vercel

```bash
npx vercel
```

Set env var if needed:
```
NEXT_PUBLIC_SITE_URL=https://ledgerhound.com
```

## Customization

1. Replace `+1 (800) XXX-XXXX` with real phone number
2. Replace `contact@ledgerhound.com` with real email
3. Add real case studies to `app/[locale]/cases/page.tsx`
4. Add real blog posts to `app/[locale]/blog/`
5. Connect contact form to email service (Resend, SendGrid)

## Tech Stack

- Next.js 14 (App Router)
- next-intl 3.x (i18n)
- Tailwind CSS
- Lucide React (icons)
- Google Fonts: Inter + Syne
