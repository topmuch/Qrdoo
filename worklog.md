---
Task ID: 1-4
Agent: Main
Task: Fix super-admin crash, buttons, client dashboard KPI multicolor, violet sidebar

Work Log:
- Diagnosed super-admin crash: stats-overview.tsx line 139 calls .filter() on batch.physicalQrCodes which was undefined (API only returned _count)
- Fixed API /api/admin/stats: added physicalQrCodes to include with status select
- Made frontend defensive: added fallback for undefined physicalQrCodes array
- Added qrStatusDistribution to API response for admin-stats pie chart
- Added totalPhysicalQr and activatedQr aliases for admin-stats compatibility
- Fixed ErrorBoundary not resetting on page change: added key={adminPage} and key={clientPage}
- Enhanced ErrorBoundary with reset button and error icon
- Redesigned client-dashboard KPI cards with multicolor gradient backgrounds (emerald, amber, violet, sky)
- Redesigned client-layout sidebar with violet/purple gradient (from-violet-950 via-violet-900 to-purple-950)
- Updated sidebar active states, hover states, separator, and header badge to violet theme

Stage Summary:
- Super-admin dashboard crash fixed (API + defensive frontend)
- All sidebar buttons now work (ErrorBoundary resets on page change)
- Client dashboard KPIs now use colorful gradient cards
- Client sidebar now uses violet/purple gradient theme
- Lint passes clean, compilation succeeds
---
Task ID: 1
Agent: Main Agent
Task: Fix Coolify build prerender error and QR activation flow

Work Log:
- Diagnosed build error: `useSearchParams()` in client components causes prerender failure during `bun run build`
- Wrapped `AppContent` in `<Suspense>` in page.tsx
- Wrapped `ActivatePageContent` in `<Suspense>` in activate/[code]/page.tsx
- Wrapped `DemoPageContent` in `<Suspense>` in demo/[id]/page.tsx
- Changed activation flow from auto-redirect to explicit buttons ("Creer un compte et activer" + "Se connecter")
- Changed `router.replace` to `window.location.href` for full page reload (fixes useState not picking up new searchParams)
- Fixed activate API to auto-resolve homeId/roomId from authenticated user session
- Made homeId/roomId optional in activation form
- Added default content templates per module type in activate API
- Verified all flows with Agent Browser
- Pushed to GitHub

Stage Summary:
- Build error fixed by wrapping useSearchParams() in Suspense boundaries
- Activation flow: scan QR → signup page → back to activate page with code pre-filled → choose module → activate
- Activate API no longer requires hardcoded homeId/roomId, resolves from user session
- All 5 files modified, committed and pushed to main
---
Task ID: 2
Agent: General-purpose
Task: Fix code format bug + simplify dashboard activation wizard

Work Log:
- Fixed `formatCodeInput` regex: changed `/[^a-zA-Z0-9]/g` to `/[^a-zA-Z0-9-]/g` so dashes (e.g. `QR-BV994ZDA`) are preserved
- Removed `roomId: selectedRoomId` from `handleSingleActivate` POST body (API auto-resolves room)
- Removed `!selectedRoomId` guard from `handleSingleActivate` early return
- Made room selector optional in wizard Step 2: changed "no rooms" block from a blocking message to a note "Aucune pièce — le QR sera associé à votre maison"
- Removed `!selectedRoomId` from Step 2 "Suivant" button disabled condition
- Made Step 3 confirmation conditionally hide the room row when no room is selected
- Note: no `moduleContent` state exists in the component, so that field was not added

Stage Summary:
- Code input now preserves dashes, matching DB format (e.g. `QR-BV994ZDA`)
- Activation wizard no longer blocks users without rooms
- Room selection is optional; API handles auto-resolution
- Confirmation step hides room row when none selected
