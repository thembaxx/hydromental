# Optional product and performance measurement

Measurement is off by default. Visitors can opt in or withdraw in Settings or `/privacy`; browser Do Not Track and Global Privacy Control override consent. Consent has its own versioned storage key, never travels in progress backups, and fails closed if storage fails. Withdrawal stops callbacks immediately even when storage cannot save it.

The application uses same-origin Vercel Web Analytics and free Speed Insights scripts. Free Speed Insights has a limited Real Experience Score dashboard; it is not Speed Insights Plus. No Plus upgrade is requested. Custom events require an existing Pro/Enterprise plan. During production deployment, `scripts/configure-measurement.mjs` enables base Web Analytics, reads existing team eligibility, and sets `NEXT_PUBLIC_PRODUCT_EVENTS_ENABLED`. It does not change plans. On unsupported plans, custom events remain disabled. Provider usage limits and existing-plan charges still apply; see Vercel's current pricing.

On eligible plans the application sends only predefined fields:

| Event | Permitted information |
| --- | --- |
| element_discovered | Public atomic number |
| quiz_started | Fixed mode |
| quiz_answer | Combined mode/concept; correct/incorrect |
| lesson_started / lesson_abandoned | Fixed game identifier |
| lesson_attempt / lesson_completed | Game; result |
| onboarding_started / onboarding_completed / onboarding_abandoned | Result or step, where relevant |
| webgl_error | Renderer/asset/context lifecycle category |
| render_sample | Coarse FPS bucket; quality, once per scene |
| quality_adjusted | New quality category |
| web_vital | Combined LCP/INP/CLS name and rating; rounded value |

All events have at most two properties to respect base Pro's limit. LCP and INP use milliseconds rounded to 10 ms; CLS is rounded to .001. Fixed event schemas reject unknown names/values and drop extra fields. No journal text, search queries, creation titles, exported progress, arbitrary error messages, GPU renderer strings or application user IDs are attached. Page URLs lose query strings and fragments. Optional product events are dropped when offline. Existing hosting access logs are separate from this visitor-controlled measurement.

Web Vitals use the maintained `web-vitals` implementation, not homemade observers. Real-time shader interaction never causes a React state update per frame. Metric reports identify performance and learning problems; consented traffic is a biased sample and does not establish learning effectiveness or all-device coverage.

Review the Vercel dashboards for loading/interactivity, render failures, concept error rates and lesson drop-off before changing difficulty or adding more animation. Do not interpret an empty dashboard as zero failures. Physical device validation is documented in [mobile readiness](mobile-readiness.md).
