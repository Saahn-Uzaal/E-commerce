"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRoleLabel } from "@/lib/auth-shared";

const initialState = {
  email: "",
  password: "",
};

export function LoginForm({ demoAccounts }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const nextPath = searchParams.get("next");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function fillDemoAccount(account) {
    setForm({
      email: account.email,
      password: account.password,
    });
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message ?? "Không thể đăng nhập.");
        }

        router.push(nextPath || body.dashboardPath || "/account");
        router.refresh();
      } catch (submitError) {
        setError(submitError.message);
      }
    });
  }

  return (
    <div className="page-stack">
      <section className="catalog-header panel">
        <div>
          <span className="eyebrow">Đăng nhập</span>
          <h1>Đăng nhập với vai trò người mua, người bán hoặc quản trị viên.</h1>
          <p className="note dashboard-note">
            Cùng một hệ thống nhưng mỗi vai trò sẽ được đưa tới page tương ứng sau khi đăng nhập.
          </p>
        </div>
        <aside className="catalog-status">
          <p className="note">Vai trò hỗ trợ</p>
          <strong>Buyer • Seller • Admin</strong>
          <p className="note">Dùng tài khoản mẫu bên dưới để test nhanh toàn bộ workflow.</p>
        </aside>
      </section>

      <section className="auth-layout">
        <article className="detail-panel">
          <p className="detail-panel__label">Biểu mẫu đăng nhập</p>
          <h3>Điền email và mật khẩu để vào đúng dashboard</h3>

          {error ? <p className="form-message form-message--error">{error}</p> : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Email</span>
              <input
                autoComplete="email"
                className="form-input"
                name="email"
                onChange={handleChange}
                required
                type="email"
                value={form.email}
              />
            </label>

            <label className="form-field">
              <span>Mật khẩu</span>
              <input
                autoComplete="current-password"
                className="form-input"
                name="password"
                onChange={handleChange}
                required
                type="password"
                value={form.password}
              />
            </label>

            <div className="form-actions">
              <button className="button button--primary" disabled={isPending} type="submit">
                {isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </div>
          </form>
        </article>

        <article className="detail-panel">
          <p className="detail-panel__label">Tài khoản mẫu</p>
          <h3>Chọn nhanh vai trò cần test</h3>

          <div className="demo-account-list">
            {demoAccounts.map((account) => (
              <button className="demo-account-card" key={account.role} onClick={() => fillDemoAccount(account)} type="button">
                <span className="demo-account-card__role">{getRoleLabel(account.role)}</span>
                <strong>{account.fullName}</strong>
                <span>{account.email}</span>
                <span>Mật khẩu: {account.password}</span>
              </button>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
