# MyRecruiter Homepage

AI-powered engagement platform for nonprofits. This repository contains the marketing homepage for MyRecruiter.

## Overview

MyRecruiter helps nonprofits capture and convert more volunteers and donors by providing 24/7 AI-powered engagement across all channels - website, email, and social media.

## Tech Stack

- **Astro 5** - Static site generator (no SSR, no runtime JS frameworks)
- **Tailwind CSS 3** - Utility-first styling
- **Plus Jakarta Sans** - Typography (latin subset, 400-700 weights)
- **Vanilla JavaScript** - Client-side interactions

## File Structure

```
/
├── src/
│   ├── components/         # Astro components (Header, Hero, FAQ, etc.)
│   ├── layouts/            # Layout templates
│   └── pages/              # Page routes (index.astro, demo.astro)
├── public/
│   ├── images/             # Static images
│   ├── videos/             # Video assets
│   └── scripts/            # Client-side JavaScript
├── dist/                   # Production build output
├── astro.config.mjs        # Astro configuration
├── tailwind.config.mjs     # Tailwind configuration
└── vercel.json             # Deployment & security headers
```

## Page Sections

1. **Header** - Navigation with How It Works, Results, Pricing, Blog, Contact
2. **Hero** - Main value proposition with CTAs
3. **Lean Teams** - Problem statement for resource-constrained nonprofits
4. **Hub & Spoke** - Multi-channel engagement messaging
5. **Dashboard Carousel** - Interactive carousel showing platform capabilities
6. **Austin Angels Case Study** - Real results with statistics
7. **Setup Process** - 4-step onboarding flow
8. **Pricing** - Standard ($150) and Premium ($300) tiers
9. **FAQ** - Common questions and answers (accordion on mobile)
10. **Final CTA** - Conversion-focused call to action
11. **Footer** - Links, security info, and social media

## Development

```bash
npm install         # Install dependencies
npm run dev         # Start dev server (localhost:4321)
npm run build       # Production build to dist/
npm run preview     # Preview production build
```

After editing `public/scripts/main.js`, regenerate the minified version:
```bash
npx terser public/scripts/main.js -o public/scripts/main.min.js -c -m
```

## Deployment

Deployed to Vercel. The `vercel.json` configures:
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Cache headers for static assets
- URL rewrites for clean routes

## Design System

- **Primary Color**: Emerald (`#50C878`)
- **Dark Background**: Slate 900/950
- **Font**: Plus Jakarta Sans (400, 500, 600, 700 weights)
- **Border Radius**: Rounded corners (2xl, 3xl for cards)

## Repository

GitHub: https://github.com/longhornrumble/website_redesign
