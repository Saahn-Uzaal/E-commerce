"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CART_UPDATED_EVENT, countCartItems, readCart } from "@/lib/cart";
import { getDashboardPathForRole, getRoleLabel } from "@/lib/auth-shared";

const searchSuggestions = [
  "miễn phí vận chuyển từ 99k",
  "nhà cửa đời sống",
  "mẹ và bé",
  "khuyến mãi công nghệ",
  "bán chạy",
];

export function SiteShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [session, setSession] = useState({
    loading: true,
    account: null,
    dashboardPath: "/account",
  });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function syncCartCount() {
      setCartCount(countCartItems(readCart()));
    }

    syncCartCount();
    window.addEventListener(CART_UPDATED_EVENT, syncCartCount);
    window.addEventListener("storage", syncCartCount);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCartCount);
      window.removeEventListener("storage", syncCartCount);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const body = await response.json();

        if (cancelled) {
          return;
        }

        setSession({
          loading: false,
          account: body.account ?? null,
          dashboardPath: body.dashboardPath ?? "/account",
        });
      } catch (_error) {
        if (!cancelled) {
          setSession({
            loading: false,
            account: null,
            dashboardPath: "/account",
          });
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const account = session.account;
  const dashboardPath = account ? getDashboardPathForRole(account.role) : "/login";
  const roleLabel = account ? getRoleLabel(account.role) : null;

  const navigation = useMemo(
    () => [
      { href: "/", label: "Trang chủ" },
      { href: "/products", label: "Ưu đãi nổi bật" },
      {
        href: dashboardPath,
        label:
          account?.role === "admin" ? "Quản trị" : account?.role === "seller" ? "Kênh người bán" : "Tài khoản",
      },
    ],
    [account?.role, dashboardPath],
  );

  const actionLinks = useMemo(
    () => [
      { href: "/", label: "Trang chủ", meta: "Bảng tin chính" },
      {
        href: dashboardPath,
        label:
          account?.role === "admin" ? "Quản trị" : account?.role === "seller" ? "Gian hàng" : account ? "Tài khoản" : "Đăng nhập",
        meta: account ? `${roleLabel} • ${account.fullName}` : "Buyer / seller / admin",
      },
      { href: "/cart", label: "Giỏ hàng", meta: `${cartCount} sản phẩm` },
    ],
    [account, cartCount, dashboardPath, roleLabel],
  );

  function handleLogout() {
    if (isPending) {
      return;
    }

    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession({
        loading: false,
        account: null,
        dashboardPath: "/account",
      });
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="site-shell">
      <div className="site-announcement">
        <div className="site-announcement__inner">
          <p>Miễn phí vận chuyển cho đơn từ 99.000đ, thêm nhiều khuyến mãi mới mỗi ngày.</p>
          <Link href="/products">Xem tất cả ưu đãi</Link>
        </div>
      </div>

      <header className="site-header">
        <div className="site-header__inner">
          <Link className="brand" href="/">
            <span className="brand__mark brand__mark--market">GT</span>
            <span className="brand__text">
              <span className="brand__name">Gettsay</span>
              <span className="brand__tag">Mua sắm nhanh cho mọi ngành hàng</span>
            </span>
          </Link>

          <div className="site-search">
            <form action="/products" className="site-search__form" role="search">
              <input
                aria-label="Tìm kiếm sản phẩm"
                className="site-search__input"
                name="q"
                placeholder="Tìm sản phẩm, sách, đồ gia dụng, công nghệ..."
                type="search"
              />
              <button className="site-search__button" type="submit">
                Tìm kiếm
              </button>
            </form>

            <div className="site-search__suggestions">
              {searchSuggestions.map((item) => (
                <Link href="/products" key={item}>
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="site-header__actions">
            {actionLinks.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  className={`site-action ${isActive ? "site-action--active" : ""}`}
                  href={item.href}
                  key={item.label}
                >
                  <span className="site-action__label">{item.label}</span>
                  <span className="site-action__meta">{session.loading && item.href === dashboardPath ? "Đang tải..." : item.meta}</span>
                </Link>
              );
            })}

            {account ? (
              <button className="button button--secondary site-auth-button" onClick={handleLogout} type="button">
                {isPending ? "Đang thoát..." : "Đăng xuất"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="site-header__sub">
          <div className="site-nav" aria-label="Điều hướng chính">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  className={`site-nav__link ${isActive ? "site-nav__link--active" : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <p className="site-header__note">
            {account
              ? `Xin chào ${account.fullName}, bạn đang ở vai trò ${roleLabel.toLowerCase()}.`
              : "Đăng nhập để theo dõi đơn hàng, bán hàng hoặc quản trị hệ thống."}
          </p>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__lead">
            <p className="site-footer__title">Gettsay</p>
            <p>Mẫu trang chủ sàn thương mại điện tử với buyer, seller, admin và danh mục sản phẩm chạy trên MySQL.</p>
          </div>
          <div className="site-footer__links">
            <Link href="/products">Danh mục</Link>
            <Link href={dashboardPath}>{account ? "Dashboard" : "Đăng nhập"}</Link>
            <Link href="/api/health">Trạng thái</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
