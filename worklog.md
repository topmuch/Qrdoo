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
