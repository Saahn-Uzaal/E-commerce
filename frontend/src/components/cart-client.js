"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  CART_UPDATED_EVENT,
  clearCart,
  readCart,
  removeProductFromCart,
  setCartItemQuantity,
} from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { getRoleLabel } from "@/lib/auth-shared";

function createInitialCheckoutForm(account) {
  return {
    customerName: account?.fullName ?? "",
    customerEmail: account?.email ?? "",
    customerPhone: account?.phone ?? "",
    shippingAddress: "",
    paymentMethod: "cod",
    note: "",
  };
}

export function CartClient({ products, databaseConfigured, account }) {
  const [cartEntries, setCartEntries] = useState([]);
  const [form, setForm] = useState(() => createInitialCheckoutForm(account));
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function syncCart() {
      setCartEntries(readCart());
    }

    syncCart();
    window.addEventListener(CART_UPDATED_EVENT, syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    if (!account) {
      return;
    }

    setForm((current) => ({
      ...current,
      customerName: current.customerName || account.fullName || "",
      customerEmail: current.customerEmail || account.email || "",
      customerPhone: current.customerPhone || account.phone || "",
    }));
  }, [account]);

  const productsById = new Map(products.map((product) => [product.id, product]));
  const cartItems = cartEntries
    .map((entry) => {
      const product = productsById.get(entry.productId);

      if (!product) {
        return null;
      }

      return {
        ...product,
        quantity: entry.quantity,
        lineTotal: product.price * entry.quantity,
      };
    })
    .filter(Boolean);

  const subtotal = cartItems.reduce((total, item) => total + item.lineTotal, 0);
  const shippingFee = cartItems.length > 0 && subtotal < 500000 ? 30000 : 0;
  const total = subtotal + shippingFee;

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleQuantityChange(productId, quantity) {
    setError("");
    setFeedback("");
    setCartEntries(setCartItemQuantity(productId, quantity));
  }

  function handleRemove(productId) {
    setError("");
    setFeedback("");
    setCartEntries(removeProductFromCart(productId));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (cartItems.length === 0 || isPending) {
      return;
    }

    setError("");
    setFeedback("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            items: cartItems.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
            })),
          }),
        });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message ?? "Không tạo được đơn hàng.");
        }

        clearCart();
        setCartEntries([]);
        setForm(createInitialCheckoutForm(account));
        setFeedback(`Đặt hàng thành công. Mã đơn: ${body.data.orderNumber}.`);
      } catch (submitError) {
        setError(submitError.message);
      }
    });
  }

  if (cartItems.length === 0) {
    return (
      <div className="page-stack">
        <section className="catalog-header panel">
          <div>
            <span className="eyebrow">Giỏ hàng</span>
            <h1>Giỏ hàng của bạn đang trống.</h1>
          </div>
          <aside className="catalog-status">
            <p className="note">Gợi ý</p>
            <strong>Thêm sản phẩm từ trang danh mục</strong>
            <p className="note">Khi bạn thêm sản phẩm vào giỏ, số lượng sẽ tự cập nhật trên header.</p>
          </aside>
        </section>

        <section className="detail-panel">
          <p className="detail-panel__label">Mua sắm tiếp</p>
          <h3>Bắt đầu chọn sản phẩm cho đơn hàng đầu tiên</h3>
          <div className="cart-actions">
            <Link className="button button--primary" href="/products">
              Đi tới danh mục
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="catalog-header panel">
        <div>
          <span className="eyebrow">Giỏ hàng</span>
          <h1>Bạn đang có {cartItems.length} sản phẩm chờ thanh toán.</h1>
        </div>
        <aside className="catalog-status">
          <p className="note">Kết nối đơn hàng</p>
          <strong>{databaseConfigured ? "Sẵn sàng tạo đơn thật" : "Chưa có MySQL thật cho checkout"}</strong>
          <p className="note">
            {account
              ? `Đơn này sẽ gắn với tài khoản ${getRoleLabel(account.role).toLowerCase()} ${account.fullName}.`
              : "Đăng nhập buyer để tự gắn đơn hàng vào tài khoản và xem lại trong page tài khoản."}
          </p>
        </aside>
      </section>

      {!account ? (
        <section className="detail-panel">
          <p className="detail-panel__label">Đăng nhập để đồng bộ đơn hàng</p>
          <h3>Bạn vẫn có thể checkout, nhưng đăng nhập sẽ giúp theo dõi đơn hàng dễ hơn.</h3>
          <div className="detail-panel__actions">
            <Link className="button button--secondary" href="/login?next=/cart">
              Đăng nhập ngay
            </Link>
          </div>
        </section>
      ) : null}

      <section className="cart-layout">
        <article className="detail-panel">
          <p className="detail-panel__label">Sản phẩm đã chọn</p>
          <h3>Kiểm tra giỏ hàng trước khi thanh toán</h3>

          <div className="cart-list">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <div
                  className="cart-item__media"
                  style={{
                    background: item.gradient,
                  }}
                />
                <div className="cart-item__content">
                  <p className="cart-item__meta">{item.category}</p>
                  <h4>{item.name}</h4>
                  <p>{item.description}</p>

                  <div className="cart-item__controls">
                    <button
                      className="button button--secondary cart-item__control"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      type="button"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      className="button button--secondary cart-item__control"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      type="button"
                    >
                      +
                    </button>
                    <button className="text-link cart-item__remove" onClick={() => handleRemove(item.id)} type="button">
                      Xóa
                    </button>
                  </div>
                </div>
                <div className="cart-item__aside">
                  <strong>{formatPrice(item.lineTotal)}</strong>
                  <span>{formatPrice(item.price)} / sản phẩm</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="detail-panel">
          <p className="detail-panel__label">Tóm tắt đơn hàng</p>
          <h3>Tạm tính và thông tin nhận hàng</h3>

          {feedback ? <p className="form-message form-message--success">{feedback}</p> : null}
          {error ? <p className="form-message form-message--error">{error}</p> : null}

          <div className="cart-summary">
            <div className="cart-summary__row">
              <span>Tạm tính</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <div className="cart-summary__row">
              <span>Phí vận chuyển</span>
              <strong>{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</strong>
            </div>
            <div className="cart-summary__row cart-summary__row--total">
              <span>Tổng cộng</span>
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>

          <form className="checkout-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Họ tên người nhận</span>
              <input
                className="form-input"
                name="customerName"
                onChange={handleFormChange}
                required
                value={form.customerName}
              />
            </label>

            <label className="form-field">
              <span>Email</span>
              <input
                className="form-input"
                name="customerEmail"
                onChange={handleFormChange}
                required
                type="email"
                value={form.customerEmail}
              />
            </label>

            <label className="form-field">
              <span>Số điện thoại</span>
              <input className="form-input" name="customerPhone" onChange={handleFormChange} value={form.customerPhone} />
            </label>

            <label className="form-field">
              <span>Phương thức thanh toán</span>
              <select className="form-input" name="paymentMethod" onChange={handleFormChange} value={form.paymentMethod}>
                <option value="cod">Thanh toán khi nhận hàng</option>
                <option value="bank_transfer">Chuyển khoản</option>
              </select>
            </label>

            <label className="form-field form-field--full">
              <span>Địa chỉ nhận hàng</span>
              <textarea
                className="form-input form-input--textarea"
                name="shippingAddress"
                onChange={handleFormChange}
                required
                rows="3"
                value={form.shippingAddress}
              />
            </label>

            <label className="form-field form-field--full">
              <span>Ghi chú</span>
              <textarea
                className="form-input form-input--textarea"
                name="note"
                onChange={handleFormChange}
                rows="3"
                value={form.note}
              />
            </label>

            <div className="cart-actions">
              <button className="button button--primary" disabled={isPending} type="submit">
                {isPending ? "Đang tạo đơn..." : "Đặt hàng ngay"}
              </button>
              <Link className="button button--secondary" href="/products">
                Chọn thêm sản phẩm
              </Link>
            </div>
          </form>
        </article>
      </section>
    </div>
  );
}
