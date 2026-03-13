import Link from "next/link";
import { getProductBySlug } from "@backend/products.js";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { formatPrice } from "@/lib/format";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return {
      title: "Không tìm thấy sản phẩm",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params }) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <SiteShell>
      <div className="page-stack">
        <section className="product-detail__header panel">
          <div>
            <span className="eyebrow">{product.category}</span>
            <h1>{product.name}</h1>
            <p className="product-detail__summary">{product.description}</p>
          </div>
          <Link className="button button--secondary" href="/products">
            Quay lại danh mục
          </Link>
        </section>

        <section className="detail-grid">
          <article
            className="detail-panel"
            style={{
              background: product.gradient,
              color: "white",
            }}
          >
            <p className="detail-panel__label" style={{ color: "rgba(255,255,255,0.82)" }}>
              Xem trước sản phẩm
            </p>
            <h3 className="product-detail__title">{product.badge}</h3>
            <p>{product.sku}</p>
            <p className="detail-panel__price">{formatPrice(product.price)}</p>
            <p>{product.inventory} sản phẩm sẵn kho.</p>
            <div className="detail-panel__actions">
              <AddToCartButton productId={product.id} />
            </div>
          </article>

          <article className="detail-panel">
            <p className="detail-panel__label">Điểm nổi bật</p>
            <h3>Những gì bộ khởi tạo này đã hỗ trợ</h3>
            <div className="product-detail__highlights">
              {product.highlights.map((item) => (
                <div className="highlight-row" key={item}>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </SiteShell>
  );
}
