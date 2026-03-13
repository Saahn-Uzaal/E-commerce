import { createSessionForCredentials } from "@backend/auth.js";
import { getDashboardPathForRole, persistSessionCookie } from "@/lib/auth";

export async function POST(request) {
  try {
    const payload = await request.json();
    const session = await createSessionForCredentials(payload);

    await persistSessionCookie(session.sessionToken, session.expiresAt);

    return Response.json({
      account: session.account,
      dashboardPath: getDashboardPathForRole(session.account.role),
    });
  } catch (error) {
    const isDatabaseError =
      error?.code === "ER_ACCESS_DENIED_ERROR" ||
      error?.code === "ECONNREFUSED" ||
      error?.message?.includes("Access denied") ||
      error?.message?.includes("Database environment variables are missing");

    return Response.json(
      {
        message: isDatabaseError ? "Không thể kết nối cơ sở dữ liệu đăng nhập." : error.message ?? "Không thể đăng nhập.",
      },
      { status: isDatabaseError ? 503 : error.statusCode ?? 500 },
    );
  }
}
