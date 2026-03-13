import { demoAccounts } from "@backend/auth.js";
import { LoginForm } from "@/components/login-form";
import { getCurrentAccount, getDashboardPathForRole } from "@/lib/auth";
import { SiteShell } from "@/components/site-shell";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Đăng nhập",
};

export default async function LoginPage() {
  const account = await getCurrentAccount();

  if (account) {
    redirect(getDashboardPathForRole(account.role));
  }

  return (
    <SiteShell>
      <LoginForm demoAccounts={demoAccounts} />
    </SiteShell>
  );
}
