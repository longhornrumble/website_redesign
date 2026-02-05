# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyRecruiter homepage - a marketing website for an AI engagement platform for nonprofits. Built with Astro and Tailwind CSS.

**Primary Domain**: `www.myrecruiter.ai` (non-www redirects to www)
**Blog**: `blog.myrecruiter.ai` (hosted on Framer, separate from this repo)
**App**: `app.myrecruiter.ai` (separate application)

## Commands

```bash
npm run dev      # Start dev server (default: localhost:4321)
npm run build    # Production build to dist/
npm run preview  # Preview production build

# After editing main.js, regenerate minified version:
npx terser public/scripts/main.js -o public/scripts/main.min.js -c -m
```

## Architecture

**Static Site Generator**: Astro with static output mode. No SSR, no React runtime.

**Component Flow**: `index.astro` imports section components in order: Header → Hero → LogoTicker → LeanTeams → HubAndSpoke → DashboardCarousel → CaseStudy → Setup → Pricing → FAQ → FinalCTA → Footer

**Pages** (`src/pages/`):
- `index.astro` - Main homepage
- `demo.astro` - Demo/scheduling page with Motion calendar embed
- `success.astro` - Post-checkout success page with onboarding calendar
- `sandbox.astro` - Private demo workspace for prospects (noindex, invite-only)
- `404.astro` - Custom 404 error page

**Landing Pages** (`src/pages/<slug>/index.astro`): Each landing page gets its own folder for organization. New landing pages follow this pattern:
- `free-audit/index.astro` - Free Engagement Gap Audit lead capture page

**API Functions** (`api/`): Vercel serverless functions
- `checkout.js` - Creates Stripe checkout sessions for subscription plans
- `cleanup-orphan-customers.js` - Removes Stripe customers without payment history (called daily via GitHub Actions)

**Client-Side JS** (`public/scripts/main.js`):
- Header scroll effect with logo swap
- Mobile hamburger menu with focus trapping
- FAQ accordion (mobile only, triggers below 768px)
- Pricing toggle (monthly/annual with keyboard navigation)
- Dashboard carousel with swipe + keyboard support
- Animated number counters (triggered per slide)
- Fade-in animations via IntersectionObserver
- Setup section pulsing dots animation

**JS-HTML Coupling**: JavaScript relies on specific IDs/classes. When modifying components, preserve these:
- `#header`, `#logo-default`, `#logo-scrolled` - Header scroll behavior
- `#mobile-menu-btn`, `#mobile-menu`, `.mobile-nav-link` - Mobile navigation
- `.faq-btn`, `.faq-item` - FAQ accordion
- `#billing-monthly`, `#billing-annual`, `#standard-price`, `#premium-price` - Pricing toggle
- `#standard-billing-note`, `#premium-billing-note`, `#standard-cta`, `#premium-cta-save`, `#billing-message` - Pricing display updates
- `.carousel-tab`, `.carousel-slide`, `#carousel-slides`, `[data-indicator]` - Dashboard carousel
- `#slide-eyebrow` - Carousel swipe scroll target
- `.counter[data-target][data-decimals]` - Animated counters
- `.fade-in` - Scroll-triggered fade animations
- `#setup`, `.setup-dot[data-delay]` - Setup section pulsing dots

## Design System

- **Primary color**: Emerald (#50C878) - custom scale in tailwind.config.mjs overrides emerald-500
- **Font**: Plus Jakarta Sans (latin subset only, weights 400-700)
- **Dark sections**: slate-900/950 backgrounds
- **Global styles** (Layout.astro `<style is:global>`): gradient-text, hero-gradient, noise, widget-shadow, float-animation, sequentialPulse, fade-in, animated-bar, scroll-mt-24, hero-headline

## Stripe Integration

**Checkout Flow**: Pricing component → checkout modal (collects org info) → API creates Stripe customer → redirects to Stripe Checkout → success page

**Price IDs** (in `api/checkout.js`):
- `standard_monthly`: $150/mo
- `standard_annual`: $1,500/yr
- `premium_monthly`: $300/mo
- `premium_annual`: $3,000/yr

**Orphan Cleanup**: GitHub Actions runs daily at midnight CT to delete Stripe customers with no payment history (24-hour grace period). See `.github/workflows/cleanup-orphan-customers.yml`.

## Deployment

**Platform**: Vercel (static hosting)

**Domain Configuration**:
- `www.myrecruiter.ai` → Vercel (primary)
- `myrecruiter.ai` → redirects to www
- `blog.myrecruiter.ai` → Framer (CNAME)

**Redirects** (in `vercel.json`): 301 redirects preserve SEO from old Framer site:
- `/blog/*` → `blog.myrecruiter.ai/*`
- `/posts/*` → `blog.myrecruiter.ai/posts/*`
- `/about`, `/contact`, `/pricing`, `/thank-you` → appropriate new locations

**Security Headers** (configured in `vercel.json`):
- Content-Security-Policy with strict directives
- HSTS, X-Frame-Options, X-Content-Type-Options
- Permissions-Policy (blocks geolocation, microphone, camera)

**Caching**: Images and assets have 1-year immutable cache headers

**Environment Variables** (Vercel):
- `STRIPE_SECRET_KEY` - Stripe API key
- `CLEANUP_API_KEY` - Auth key for cleanup endpoint

## Key Patterns

- Astro components use TypeScript interfaces in frontmatter for props
- SEO: Layout includes Open Graph, Twitter cards, JSON-LD structured data; pages can inject additional head content via `<slot name="head" />`
- Analytics: Google Analytics (G-H76K3TC1FL) deferred until page load
- External links use `rel="noopener noreferrer"` and `target="_blank"` for security
- Static files in `public/` copied directly to build output
- LogoTicker: Auto-scrolling marquee on mobile, static on desktop
- Canonical URLs use `www.myrecruiter.ai` (matches redirect config)

## Sandbox Page

Private demo workspace for prospects at `/sandbox`. Not indexed by search engines.

**Dynamic Content**:
- `organizationName` variable in frontmatter - update for each client
- Chat widget with `data-tenant` attribute for client-specific assistant

**Chat Widget**: Embedded via `chat.myrecruiter.ai`. CSP in `vercel.json` allows:
- `script-src`: loads widget.js
- `connect-src`: API calls
- `frame-src`: widget iframe

## Landing Pages

Landing pages live in `src/pages/<slug>/index.astro` — one folder per page. This keeps each page self-contained and scales as new pages are added.

**Pattern**: Standalone pages with minimal header (logo only, no nav), inline sections, and simplified footer. They do not use the shared Header/Footer components. The global `main.min.js` fade-in animations work automatically; page-specific JS goes in an inline `<script>` tag.

**Free Engagement Gap Audit** (`/free-audit`):
- CRO landing page targeting nonprofit leaders
- Dark hero + light body sections
- Static form (no backend yet) — submit handler shows a thank-you state client-side
- Form fields: Name, Org Email, Website URL, Primary Recruitment Struggle (dropdown)
- Sections: Hero → 4 Leaks (problem) → What You Get (deliverables) → Social Proof → Form → Personal Note → Footer
- Rewrite rule in `vercel.json` for clean URL

**Adding a new landing page**:
1. Create `src/pages/<slug>/index.astro`
2. Import Layout from `../../layouts/Layout.astro` (two levels up)
3. Add rewrite rule in `vercel.json`: `{ "source": "/<slug>", "destination": "/<slug>.html" }`

## Framer Blog Integration

The blog at `blog.myrecruiter.ai` is hosted separately on Framer. Shared header/footer styles are provided in `public/framer/` for Framer's Custom Code feature:
- `styles.css` - Header/footer CSS
- `scripts.js` - Mobile menu and scroll behavior

Framer well-known files (robots.txt, security.txt) are in `framer-well-known/` for manual upload to Framer.
