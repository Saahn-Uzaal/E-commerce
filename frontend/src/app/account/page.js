import Link from "next/link";
import { getOrdersByCustomer } from "@backend/orders.js";
import { formatPrice } from "@/lib/format";
import { requireAccount } from "@/lib/auth";
import { SiteShell } from "@/components/site-shell";

export const metadata = {
  title: "Tài khoản",
};

export default async function AccountPage() {
  const account = await requireAccount({
    roles: ["buyer"],
    nextPath: "/account",
  });

  const orders = await getOrdersByCustomer(account.id);
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <SiteShell>
      <div className="page-stack">
        <section className="catalog-header panel">
          <div>
            <span className="eyebrow">Tài khoản người mua</span>
            <h1>Theo dõi đơn hàng, thông tin nhận hàng và lịch sử mua sắm của bạn.</h1>
            <p className="note dashboard-note">Mỗi đơn checkout khi đăng nhập sẽ tự gắn với tài khoản buyer hiện tại.</p>
          </div>
          <aside className="catalog-status">
            <p className="note">Thông tin tài khoản</p>
            <strong>{account.fullName}</strong>
            <p className="note">{account.email}</p>
            <p className="note">{account.phone || "Chưa cập nhật số điện thoại"}</p>
          </aside>
        </section>

        <section className="admin-grid">
          <article className="admin-card">
            <p className="admin-card__label">Đơn hàng</p>
            <h3>{orders.length} đơn đã gắn tài khoản</h3>
            <p>Buyer có thể xem lại các đơn đã đặt sau khi đăng nhập và checkout thành công.</p>
          </article>

          <article className="admin-card">
            <p className="admin-card__label">Chi tiêu</p>
            <h3>{formatPrice(totalSpent)}</h3>
            <p>Tổng giá trị đơn hàng đã tạo từ tài khoản hiện tại.</p>
          </article>

          <article className="admin-card">
            <p className="admin-card__label">Hành động nhanh</p>
            <h3>Mua tiếp hoặc hoàn tất giỏ hàng</h3>
            <p>Tiếp tục thêm sản phẩm vào giỏ hoặc quay lại trang checkout.</p>
          </article>
        </section>

        <section className="detail-panel">
          <p className="detail-panel__label">Đơn hàng gần đây</p>
          <h3>Lịch sử đơn hàng của tài khoản người mua</h3>

          {orders.length === 0 ? (
            <p className="note">Bạn chưa có đơn hàng nào. Hãy thêm sản phẩm vào giỏ và checkout để bắt đầu.</p>
          ) : (
            <div className="order-list">
              {orders.map((order) => (
                <div className="order-row" key={order.id}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <p>{order.customerName}</p>
                    <p className="note">{order.status}</p>
                  </div>
                  <div className="order-row__meta">
                    <span>{order.itemCount} sản phẩm</span>
                    <strong>{formatPrice(order.totalAmount)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="catalog-header panel">
          <div>
            <span className="eyebrow">Hành động nhanh</span>
            <h1>Tiếp tục mua sắm hoặc quay lại giỏ hàng để hoàn tất đơn.</h1>
          </div>
          <aside className="detail-panel__actions">
            <Link className="button button--primary" href="/products">
              Xem sản phẩm
            </Link>
            <Link className="button button--secondary" href="/cart">
              Mở giỏ hàng
            </Link>
          </aside>
        </section>
      </div>
    </SiteShell>
  );
}
