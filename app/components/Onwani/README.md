# Onwani + MyLand Picker

Client-side component that embeds the MyLand iframe and drives cascading selects using Onwani public endpoints directly from the browser.

Key points:
- postMessage origin enforced to https://myland.dmt.gov.ae for send/receive.
- Cascading selects: Municipality → District → Community → Road ID (AAM only) → Plot.
- Optional community shape overlay is retrieved via getcommunityshape.
- No app/api wrappers; calls are made from the browser.

Usage:
- Component: `app/components/Onwani/MyLandPicker.tsx`
- Types: `OnwaniSelection` in `types/index.ts`.
- Demo page: `/debug/onwani`.

Notes:
- Values with spaces are URL-encoded by the helpers in `lib/onwani-client.ts`.
- If you need plot number/GISID lookups, use your backend or official Onwani endpoints.
