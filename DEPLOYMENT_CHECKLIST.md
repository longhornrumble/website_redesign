# MyRecruiter Vercel Deployment Checklist

## Pre-Deployment (Already Complete)

- [x] SEO meta tags (description, Open Graph, Twitter cards)
- [x] Google Analytics (G-H76K3TC1FL)
- [x] favicon.ico
- [x] apple-touch-icon.png
- [x] og-image.png (social sharing preview)
- [x] robots.txt
- [x] sitemap.xml
- [x] 404.html error page
- [x] manifest.json (PWA metadata)
- [x] privacy.html (GA4 compliance)
- [x] vercel.json (security headers, caching, rewrites)
- [x] Blog links → blog.myrecruiter.ai

---

## Vercel Setup (Do When Ready to Deploy)

### 1. Create Vercel Project
- [ ] Go to [vercel.com](https://vercel.com) and sign in
- [ ] Click "Add New Project"
- [ ] Import from GitHub: `longhornrumble/website_redesign`
- [ ] Framework Preset: Select "Other" (static HTML)
- [ ] Click "Deploy"

### 2. Connect Custom Domain
- [ ] Go to Project → Settings → Domains
- [ ] Add `myrecruiter.ai`
- [ ] Vercel will show DNS records - add these at your domain registrar:
  - Type: `A` record pointing to `76.76.21.21`
  - Or Type: `CNAME` record pointing to `cname.vercel-dns.com`
- [ ] Add `www.myrecruiter.ai` and configure redirect to root domain
- [ ] Wait for SSL certificate (automatic, takes a few minutes)

### 3. Verify Deployment
- [ ] Visit https://myrecruiter.ai - confirm site loads
- [ ] Visit https://myrecruiter.ai/demo - confirm demo page works
- [ ] Visit https://myrecruiter.ai/privacy - confirm privacy page works
- [ ] Visit https://myrecruiter.ai/nonexistent - confirm 404 page shows
- [ ] Test on mobile device

---

## Post-Deployment Verification

### Favicon & Icons
- [ ] Check browser tab shows favicon
- [ ] On iPhone: Add to Home Screen - verify apple-touch-icon appears

### Social Sharing Preview
- [ ] Test at [opengraph.xyz](https://www.opengraph.xyz/) - enter `https://myrecruiter.ai`
- [ ] Paste link in Slack - verify preview image and description appear
- [ ] Paste link in Twitter/LinkedIn - verify preview looks correct

### Analytics
- [ ] Wait 24-48 hours after launch
- [ ] Check [Google Analytics](https://analytics.google.com) for incoming data
- [ ] Verify both homepage and demo page are tracking

### SEO
- [ ] Go to [Google Search Console](https://search.google.com/search-console)
- [ ] Add property for `myrecruiter.ai`
- [ ] Submit sitemap: `https://myrecruiter.ai/sitemap.xml`
- [ ] Request indexing for homepage

### Security Headers
- [ ] Test at [securityheaders.com](https://securityheaders.com/?q=myrecruiter.ai)
- [ ] Should show A or A+ rating

---

## Optional Vercel Settings (Recommended)

### Deployment Protection
- [ ] Settings → Deployment Protection
- [ ] Enable "Vercel Authentication" for preview deployments
- [ ] This keeps draft/preview URLs private (only you can see them)

### Vercel Analytics (Free Tier)
- [ ] Settings → Analytics → Enable
- [ ] Provides Core Web Vitals monitoring
- [ ] Separate from Google Analytics - shows performance metrics

### Speed Insights (Free Tier)
- [ ] Settings → Speed Insights → Enable
- [ ] Monitors real-user performance over time

---

## Ongoing Maintenance

### When You Update the Site
1. Make changes locally
2. Commit and push to GitHub
3. Vercel auto-deploys within ~30 seconds

### Monthly Tasks
- [ ] Check Google Analytics for traffic trends
- [ ] Review any 404 errors in Vercel logs
- [ ] Update sitemap.xml `<lastmod>` dates if content changed significantly

### If You Add New Pages
1. Add the page to `sitemap.xml`
2. Add SEO meta tags to the new page
3. Add GA4 tracking snippet to the new page

---

## Quick Reference

| URL | Purpose |
|-----|---------|
| https://myrecruiter.ai | Homepage |
| https://myrecruiter.ai/demo | Demo booking page |
| https://myrecruiter.ai/privacy | Privacy policy |
| https://blog.myrecruiter.ai | Blog (hosted on Framer) |

| Tool | URL |
|------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Google Analytics | https://analytics.google.com |
| Google Search Console | https://search.google.com/search-console |
| Test Social Preview | https://www.opengraph.xyz |
| Test Security Headers | https://securityheaders.com |

---

## Support

If something breaks:
- Check Vercel Dashboard → Deployments for error logs
- Use `git checkout -- filename` to revert a file locally
- Use Vercel's "Redeploy" button to retry a deployment
