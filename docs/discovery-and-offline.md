# Discovery and installation

Elementals uses one name, orbital mark, share image, and title template across the app, installable package, and element library. The interactive atom is an illustrative model. Each of the 118 elements has a server-rendered, directly addressable `/elements/<name>` page with scientific context and linked sources. The library, XML sitemap, robots instructions, JSON-LD, and supplementary `/llms.txt` make this content discoverable without requiring a WebGL renderer.

## Public origin

Set `NEXT_PUBLIC_SITE_URL` to the actual public HTTPS origin (for example, your verified custom domain) before building. If omitted on Vercel, `VERCEL_PROJECT_PRODUCTION_URL` provides the production project domain. Outside Vercel the fallback is `http://localhost:3000`, so configure the value before publishing elsewhere. No deployment hostname is invented. The value controls canonical links, sitemap locations, metadata base, and structured-data URLs. Preview deployments retain production canonical URLs when this environment variable is configured.

Metadata and structured data describe actual content; no fabricated reviews, author credentials, update timestamps, or search guarantees are supplied. `llms.txt` supplements readable HTML and sources and does not guarantee AI indexing or citation.

## Install and offline behavior

The production service worker precaches the app shell, element index, full public element-data JSON, local fonts, shell scripts/styles, icons, and fallback page. Visited HTML pages and requested immutable assets are saved on the device. A reference page that has not been visited falls back to a readable offline explanation. Element exploration and locally saved learning progress remain available from the cached shell; external source websites require a connection. No API, cross-origin, non-GET, byte-range, or Next.js RSC request is intercepted.

Installation appears only when the browser offers an install prompt. Other supported browsers can use their own Add to Home Screen menu. Installation is optional; account creation is unnecessary. New versions offer an explicit restart control instead of interrupting a learning session. Online/offline status describes browser connectivity and is not a guarantee that every remote resource is reachable. Browser storage can be evicted, and clearing site data removes cached content and local progress.

Offline caching requires HTTPS or a localhost secure context and an initial online visit. It is not a complete offline copy of every reference page. The browser's caching/storage policies can differ, especially in private browsing. Progress backups are exported/imported in the learning journal; no account-backed synchronization service is configured. Installability does not add native push notifications, background synchronization or a native app-store package.

## Verification

Use a production build, not `next dev`, because service worker registration is intentionally disabled for development. On localhost or HTTPS:

1. Visit the playground, wait for `navigator.serviceWorker.ready`, and reload once so the service worker controls the page.
2. Visit an element reference page, then turn the browser context offline.
3. Reload the playground. Check its element controls and Three.js canvas, saved progress, and offline indicator.
4. Reload the previously visited reference page; it should remain readable. Navigate to an unvisited reference page; it should show the offline fallback.
5. Open `/element-data.json` offline and verify 118 scientific records.
6. Restore connectivity. Installation and source links should work normally. A changed service-worker version must prompt for restart while retaining local learning storage.

Use browser DevTools Application panels to inspect the manifest, service worker, Cache Storage, and icons. Test an actual supported mobile browser for platform-specific installation behavior.

Theme-specific install manifests are precached with the same app identity, and the standalone offline page restores the same background as the explorer. See [theming and startup](theming.md) for first-paint behavior and browser/native splash limitations.
