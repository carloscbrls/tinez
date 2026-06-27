/**
 * TINEZ Health Check Endpoint
 *
 * Returns real-time status of all data sources, OAuth token, and build info.
 * Used by: site footer, cron monitoring, village health dashboard.
 *
 * GET /api/health
 */

import type { APIRoute } from "astro";
import { monitor } from "../../lib/monitor";

export const GET: APIRoute = async ({ request }) => {
  const health = monitor.getHealth();

  // Determine HTTP status based on overall health
  let status = 200;
  if (health.overall === "unhealthy") status = 503;
  else if (health.overall === "degraded") status = 200; // still serve, but degraded

  // Add CORS for external monitoring
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  };

  return new Response(JSON.stringify(health, null, 2), { status, headers });
};
