import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAccountForSessionToken } from "@backend/auth.js";
import { getDashboardPathForRole, getRoleLabel } from "@/lib/auth-shared";

export const SESSION_COOKIE_NAME = "gettsay_session";

export { getDashboardPathForRole, getRoleLabel };

export async function getCurrentAccount() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  return getAccountForSessionToken(sessionToken);
}

export async function requireAccount(options = {}) {
  const { roles = [], nextPath = "/" } = options;
  const account = await getCurrentAccount();

  if (!account) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (roles.length > 0 && !roles.includes(account.role)) {
    redirect(getDashboardPathForRole(account.role));
  }

  return account;
}

export async function persistSessionCookie(sessionToken, expiresAt) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
