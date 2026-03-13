import { getCurrentAccount, getDashboardPathForRole } from "@/lib/auth";

export async function GET() {
  const account = await getCurrentAccount();

  return Response.json({
    authenticated: Boolean(account),
    account,
    dashboardPath: account ? getDashboardPathForRole(account.role) : null,
  });
}
