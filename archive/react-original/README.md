# React/Babel Original Site Archive

This folder contains the original React/Babel/Tailwind CDN version of the MyRecruiter homepage, archived on 2025-12-12 before migrating to Astro.

## Files
- `index.html` - 377KB single-file React app with inline base64 images

## Why Archived
The site was migrated to Astro for performance:
- Lighthouse mobile: 58 → 99
- Removed 2.3MB of runtime JavaScript (React, ReactDOM, Babel)
- Static HTML generation instead of client-side rendering

## To Restore
Copy `index.html` to the project root and remove the Astro build configuration.

