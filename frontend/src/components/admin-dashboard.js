"use client";

import { useState, useTransition } from "react";
import { formatPrice } from "@/lib/format";
import { getRoleLabel } from "@/lib/auth-shared";

const initialFormState = {
  categoryId: "",
  name: "",
  slug: "",
  sku: "",
  badge: "",
  description: "",
  price: "0",
  inventory: "0",
  status: "active",
  gradient: "",
  imageUrl: "",
  materialNote: "",
  shippingNote: "",
  fitNote: "",
  featured: true,
  highlights: "",
};

function mapProductToForm(product) {
  return {
    categoryId: product.categoryId ? String(product.categoryId) : "",
    name: product.name ?? "",
    slug: product.slug ?? "",
    sku: product.sku ?? "",
    badge: product.badge ?? "",
    description: product.description ?? "",
    price: String(product.price ?? 0),
    inventory: String(product.inventory ?? 0),
    status: product.status ?? "active",
    gradient: product.gradient ?? "",
    imageUrl: product.imageUrl ?? "",
    materialNote: product.materialNote ?? "",
    shippingNote: product.shippingNote ?? "",
    fitNote: product.fitNote ?? "",
    featured: Boolean(product.featured),
    highlights: Array.isArray(product.highlights) ? product.highlights.join("\n") : "",
  };
}

function sortProducts(products) {
  return [...products].sort((left, right) => {
    if (Boolean(left.featured) !== Boolean(right.featured)) {
      return Number(Boolean(right.featured)) - Number(Boolean(left.featured));
    }

    return Number(right.id) - Number(left.id);
  });
}

export function AdminDashboard({
  currentAccount,
  initialProducts,
  initialCategories,
  initialOrders,
  databaseConfigured,
  source,
  role = "admin",
}) {
  const [products, setProducts] = useState(sortProducts(initialProducts));
  const [orders] = useState(initialOrders);
  const [form, setForm] = useState(initialFormState);
  const [editingProductId, setEditingProductId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isSellerMode = role === "seller";
  const dashboardTitle = isSellerMode
    ? "Quản lý sản phẩm và đơn hàng của gian hàng người bán."
    : "Quản lý toàn bộ sản phẩm và vận hành đơn hàng trên Gettsay.";
  const dashboardEyebrow = isSellerMode ? "Kênh người bán" : "Quản trị hệ thống";
  const dashboardNote = isSellerMode
    ? "Sản phẩm mới sẽ tự gắn với tài khoản người bán hiện tại."
    : "Admin có thể xem toàn bộ sản phẩm, đơn hàng và cập nhật danh mục.";
  const orderPanelTitle = isSellerMode ? "Đơn hàng của gian hàng" : "Đơn hàng gần đây";
  const orderPanelHint = isSellerMode
    ? "Theo dõi đơn có chứa sản phẩm thuộc gian hàng của bạn."
    : "Theo dõi checkout và vận hành trên toàn bộ hệ thống.";

  function handleFieldChange(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm(initialFormState);
    setEditingProductId(null);
  }

  function handleEdit(product) {
    setError("");
    setFeedback("");
    setEditingProductId(product.id);
    setForm(mapProductToForm(product));
  }

  function handleDelete(product) {
    if (!databaseConfigured || isPending) {
      return;
    }

    if (!window.confirm(`Xóa sản phẩm "${product.name}"?`)) {
      return;
    }

    setError("");
    setFeedback("");

    startTransition(async () => {
      try {
        const response = await fetch(`/api/products/${product.id}`, {
          method: "DELETE",
        });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message ?? "Không xóa được sản phẩm.");
        }

        setProducts((current) => current.filter((item) => item.id !== product.id));
        if (editingProductId === product.id) {
          resetForm();
        }
        setFeedback("Đã xóa sản phẩm.");
      } catch (submitError) {
        setError(submitError.message);
      }
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!databaseConfigured || isPending) {
      return;
    }

    setError("");
    setFeedback("");

    const payload = {
      ...form,
      categoryId: form.categoryId || null,
      price: Number(form.price),
      inventory: Number(form.inventory),
      highlights: form.highlights,
    };

    startTransition(async () => {
      try {
        const response = await fetch(editingProductId ? `/api/products/${editingProductId}` : "/api/products", {
          method: editingProductId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message ?? "Không lưu được sản phẩm.");
        }

        const savedProduct = body.data;

        setProducts((current) => {
          if (editingProductId) {
            return sortProducts(current.map((item) => (item.id === savedProduct.id ? savedProduct : item)));
          }

          return sortProducts([savedProduct, ...current]);
        });

        setFeedback(editingProductId ? "Đã cập nhật sản phẩm." : "Đã tạo sản phẩm mới.");
        resetForm();
      } catch (submitError) {
        setError(submitError.message);
      }
    });
  }

  return (
    <div className="page-stack">
      <section className="catalog-header panel">
        <div>
          <span className="eyebrow">{dashboardEyebrow}</span>
          <h1>{dashboardTitle}</h1>
          <p className="note dashboard-note">{dashboardNote}</p>
        </div>
        <aside className="catalog-status">
          <p className="note">Phiên đăng nhập</p>
          <strong>{currentAccount.fullName}</strong>
          <p className="note">
            {getRoleLabel(currentAccount.role)} • {currentAccount.email}
          </p>
          <p className="note">
            {databaseConfigured
              ? source === "database"
                ? "MySQL đang hoạt động, thay đổi sẽ ghi trực tiếp vào dữ liệu thật."
                : "MySQL đã cấu hình nhưng đang fallback sang dữ liệu mẫu."
              : "Chưa có kết nối MySQL thật."}
          </p>
        </aside>
      </section>

      <section className="admin-console">
        <article className="detail-panel">
          <p className="detail-panel__label">{editingProductId ? "Chỉnh sửa sản phẩm" : "Sản phẩm mới"}</p>
          <h3>{editingProductId ? "Cập nhật thông tin sản phẩm" : "Tạo sản phẩm mới"}</h3>

          {!databaseConfigured ? (
            <p className="form-message form-message--warning">
              Chế độ hiện tại chỉ xem được dữ liệu mẫu. Kết nối MySQL thật để lưu sản phẩm.
            </p>
          ) : null}

          {feedback ? <p className="form-message form-message--success">{feedback}</p> : null}
          {error ? <p className="form-message form-message--error">{error}</p> : null}

          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Danh mục</span>
              <select
                className="form-input"
                disabled={!databaseConfigured || isPending}
                name="categoryId"
                onChange={handleFieldChange}
                value={form.categoryId}
              >
                <option value="">Chưa phân loại</option>
                {initialCategories.map((category) => (
                  <option key={category.id ?? category.slug} value={category.id ?? ""}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>SKU</span>
              <input
                className="form-input"
                disabled={!databaseConfigured || isPending}
                name="sku"
                onChange={handleFieldChange}
                value={form.sku}
              />
            </label>

            <label className="form-field form-field--full">
              <span>Tên sản phẩm</span>
              <input
                className="form-input"
                disabled={!databaseConfigured || isPending}
                name="name"
                onChange={handleFieldChange}
                value={form.name}
              />
            </label>

            <label className="form-field">
              <span>Slug</span>
              <input
                className="form-input"
                disabled={!databaseConfigured || isPending}
                name="slug"
                onChange={handleFieldChange}
                value={form.slug}
              />
            </label>

            <label className="form-field">
              <span>Nhãn</span>
              <input
                className="form-input"
                disabled={!databaseConfigured || isPending}
                name="badge"
                onChange={handleFieldChange}
                value={form.badge}
              />
            </label>

            <label className="form-field">
              <span>Giá</span>
              <input
                className="form-input"
                disabled={!databaseConfigured || isPending}
                min="0"
                name="price"
                onChange={handleFieldChange}
                type="number"
                value={form.price}
              />
            </label>

            <label className="form-field">
              <span>Tồn kho</span>
              <input
                className="form-input"
                disabled={!databaseConfigured || isPending}
                min="0"
                name="inventory"
                onChange={handleFieldChange}
                type="number"
                value={form.inventory}
              />
            </label>

            <label className="form-field">
              <span>Trạng thái</span>
              <select
                className="form-input"
                disabled={!databaseConfigured || isPending}
                name="status"
                onChange={handleFieldChange}
                value={form.status}
              >
                <option value="draft">Nháp</option>
                <option value="active">Đang bán</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </label>

            <label className="form-field">
              <span>Gradient</span>
              <input
                className="form-input"
                disabled={!databaseConfigured || isPending}
                name="gradient"
                onChange={handleFieldChange}
                value={form.gradient}
              />
            </label>

            <label className="form-field form-field--full">
              <span>Mô tả</span>
              <textarea
                className="form-input form-input--textarea"
                disabled={!databaseConfigured || isPending}
                name="description"
                onChange={handleFieldChange}
                rows="4"
                value={form.description}
              />
            </label>

            <label className="form-field">
              <span>Ghi chú chất liệu</span>
              <input
                className="form-input"
                disabled={!databaseConfigured || isPending}
                name="materialNote"
                onChange={handleFieldChange}
                value={form.materialNote}
              />
            </label>

            <label className="form-field">
              <span>Ghi chú giao hàng</span>
              <input
                className="form-input"
                disabled={!databaseConfigured || isPending}
                name="shippingNote"
                onChange={handleFieldChange}
                value={form.shippingNote}
              />
            </label>

            <label className="form-field">
              <span>Điểm bán hàng chính</span>
              <input
                className="form-input"
                disabled={!databaseConfigured || isPending}
                name="fitNote"
                onChange={handleFieldChange}
                value={form.fitNote}
              />
            </label>

            <label className="form-field">
              <span>URL ảnh chính</span>
              <input
                className="form-input"
                disabled={!databaseConfigured || isPending}
                name="imageUrl"
                onChange={handleFieldChange}
                value={form.imageUrl}
              />
            </label>

            <label className="form-field form-field--full">
              <span>Highlights</span>
              <textarea
                className="form-input form-input--textarea"
                disabled={!databaseConfigured || isPending}
                name="highlights"
                onChange={handleFieldChange}
                placeholder="Mỗi dòng là một highlight"
                rows="4"
                value={form.highlights}
              />
            </label>

            <label className="form-toggle form-field--full">
              <input
                checked={form.featured}
                disabled={!databaseConfigured || isPending}
                name="featured"
                onChange={handleFieldChange}
                type="checkbox"
              />
              <span>Đánh dấu là sản phẩm nổi bật</span>
            </label>

            <div className="form-actions form-field--full">
              <button className="button button--primary" disabled={!databaseConfigured || isPending} type="submit">
                {isPending ? "Đang lưu..." : editingProductId ? "Lưu cập nhật" : "Tạo sản phẩm"}
              </button>
              <button className="button button--secondary" onClick={resetForm} type="button">
                Làm mới form
              </button>
            </div>
          </form>
        </article>

        <article className="detail-panel">
          <p className="detail-panel__label">{orderPanelTitle}</p>
          <h3>{orderPanelHint}</h3>

          {orders.length === 0 ? (
            <p className="note">
              Chưa có đơn hàng phù hợp với vai trò hiện tại. Sau khi checkout thành công, đơn hàng sẽ xuất hiện ở
              đây.
            </p>
          ) : (
            <div className="order-list">
              {orders.map((order) => (
                <div className="order-row" key={order.id}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <p>{order.customerName}</p>
                    <p className="note">{order.customerEmail}</p>
                  </div>
                  <div className="order-row__meta">
                    <span>{order.itemCount} sản phẩm</span>
                    {order.sellerRevenue !== null ? <span>{formatPrice(order.sellerRevenue)} về gian hàng</span> : null}
                    <strong>{formatPrice(order.totalAmount)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="detail-panel">
        <p className="detail-panel__label">{isSellerMode ? "Kho sản phẩm của bạn" : "Danh sách sản phẩm"}</p>
        <h3>{isSellerMode ? "Các sản phẩm đang thuộc gian hàng hiện tại" : "Toàn bộ kho sản phẩm hiện có"}</h3>

        <div className="admin-product-list">
          {products.map((product) => (
            <article className="admin-product-row" key={product.id}>
              <div className="admin-product-row__content">
                <p className="admin-card__label">{product.category}</p>
                <h4>{product.name}</h4>
                <p>{product.description}</p>
                <div className="admin-product-row__meta">
                  <span>{product.sku}</span>
                  <span>{formatPrice(product.price)}</span>
                  <span>Tồn kho: {product.inventory}</span>
                  <span>
                    {product.status === "active"
                      ? "Đang bán"
                      : product.status === "draft"
                        ? "Nháp"
                        : "Lưu trữ"}
                  </span>
                  {!isSellerMode && product.sellerName ? <span>Chủ gian hàng: {product.sellerName}</span> : null}
                </div>
              </div>
              <div className="admin-product-row__actions">
                <button className="button button--secondary" onClick={() => handleEdit(product)} type="button">
                  Sửa
                </button>
                <button
                  className="button button--secondary admin-product-row__delete"
                  disabled={!databaseConfigured || isPending}
                  onClick={() => handleDelete(product)}
                  type="button"
                >
                  Xóa
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
