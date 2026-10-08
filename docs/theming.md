# Backgrounds, first paint and browser chrome

Hydromental uses the same four surface palettes for startup, loaded pages, browser tint, offline fallback and install manifests. `lib/theme.ts` owns these values. The interface retains Day, Midnight, Dusk and true-black Noir, with device-following appearance by default.

The root layout includes a small critical style before application startup. It gives the HTML canvas and body an opaque theme color even while stylesheets, fonts or JavaScript bundles are unavailable. A fixed decorative body layer paints the authored gradient once across the viewport; its top and bottom blend into the browser color. Pages are transparent over that layer, so long playground pages, navigation and viewport resizing do not restart the gradient. `vh`, `svh` and `dvh` fallbacks cover older and modern viewport behavior, and content remains padded away from safe areas. Existing gestures, scene effects and dialog/dock animations are retained.

The early theme initializer restores only a whitelisted local preference and falls back to the device theme if storage is unavailable. It creates one mutable browser-color tag and one manifest link before hydration. React's static media-qualified theme tags are left intact for JavaScript-disabled reading. Keeping mutable tags separate avoids React creating duplicates while matching server metadata during hydration. The browser-color component follows live settings, operating-system changes, page restoration and Next metadata updates.

The default `/manifest.webmanifest` remains available. Four statically generated `/manifests/<theme>/manifest.webmanifest` variants supply matching `background_color` and `theme_color`. All keep the same root app ID, start URL, icons and scope. The service worker precaches each variant, so the selected manifest also works offline. `/offline.html` is a generated standalone document using the same critical styles and initializer; it needs no downloaded application CSS or React bundle.

The initial explorer loading state shares `AppLoading` and the same viewport background. Reference pages remain fully server-rendered and readable without JavaScript. A global streaming loading boundary is intentionally avoided because it can hide reference content and change alias redirects into streamed responses.

## Platform limits

`theme-color` is a browser hint rather than a guarantee. Desktop browsers, Safari versions, Android/iOS system bars and installed apps can apply their own tinting or reserved areas. A browser cannot use a gradient for its theme-color hint; the page's edges therefore blend to its solid color. Installed splash screens are generated and cached by the OS/browser, which may apply manifest changes later rather than on the next launch. Existing installations may need to refresh their manifest or be reinstalled to pick up a changed splash color. iOS retains the existing translucent standalone status-bar setting and full-viewport layout.

Without JavaScript, reference and offline pages follow the system theme through CSS; saved device-local preferences require the early script to read storage. Native splash screens appear before that script can run, so exact instantaneous per-launch customization cannot be promised.

## Guidance and verification

Based on [web.dev's theming guidance](https://web.dev/learn/design/theming), [MDN theme-color](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/theme-color) and [manifest background-color guidance](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/background_color).

Production browser regressions cover saved themes while application CSS/scripts are blocked, device changes with and without JavaScript or storage, live appearance/manifest changes, metadata uniqueness, short/long/landscape/tablet/desktop viewport coverage, install manifest identity, and an uncached offline Noir page. Browser tests emulate viewport sizes and preferences; physical iPhone/Android status bars and native splash screens still require device testing.
