import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { AddToCartButton } from "@/components/add-to-cart-button";

export function ProductCard({ product }) {
  const inventoryLabel =
    product.inventory <= 20
      ? `Chỉ còn ${product.inventory} sản phẩm`
      : `${product.inventory} sản phẩm sẵn kho`;

  return (
    <article className="product-card">
      <div
        className="product-card__media"
        style={{
          background: product.gradient,
        }}
      >
        <span className="product-card__badge">{product.badge}</span>
        <span className="product-card__sku">{product.sku}</span>
      </div>

      <div className="product-card__body">
        <p className="product-card__meta">{product.category}</p>
        <h3 className="product-card__title">{product.name}</h3>
        <p className="product-card__description">{product.description}</p>
        <p className="product-card__price">{formatPrice(product.price)}</p>
        <p className="product-card__shipping">Có hỗ trợ miễn phí vận chuyển</p>
        <div className="product-card__footer">
          <span>{inventoryLabel}</span>
          <div className="product-card__actions">
            <AddToCartButton className="product-card__cart-button" productId={product.id} />
            <Link className="text-link" href={`/products/${product.slug}`}>
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
