// =============================================================
// ORDOMOTIK - Next.js Instrumentation
// Runs once when the Next.js server starts (inside the process)
// This guarantees PrismaClient module resolution works correctly
// =============================================================

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Dynamic import to avoid bundling issues
    const { initDatabase } = await import('@/lib/db-init');
    // Fire and forget - don't block server startup
    initDatabase().catch((err) => {
      console.error('[instrumentation] DB init failed:', err);
    });
  }
}
