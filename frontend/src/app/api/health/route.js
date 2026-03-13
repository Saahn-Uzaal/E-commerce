import { hasDatabaseConfig, pingDatabase } from "@backend/db.js";

export async function GET() {
  if (!hasDatabaseConfig()) {
    return Response.json({
      status: "ok",
      database: "not-configured",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    await pingDatabase();

    return Response.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        status: "degraded",
        database: "connection-failed",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
