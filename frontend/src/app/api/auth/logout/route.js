import { deleteSessionByToken } from "@backend/auth.js";
import { clearSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await deleteSessionByToken(sessionToken);
  }

  await clearSessionCookie();

  return Response.json({ ok: true });
}
