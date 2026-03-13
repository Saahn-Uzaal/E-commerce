import Link from "next/link";
import { getCatalogProducts } from "@backend/products.js";
import { ProductCard } from "@/components/product-card";
import { SiteShell } from "@/components/site-shell";
import {
  departmentRows,
  marketplaceCategories,
  promoBanners,
  quickChannels,
  trustHighlights,
} from "@/lib/marketplace-content";

export const revalidate = 300;

export default async function Home() {
  const { products, source } = await getCatalogProducts();
  const heroProducts = products.slice(0, 2);
  const topDeals = products.slice(0, 5);
  const valueDeals = [...products].reverse().slice(0, 5);
  const trendDeals = products.slice(1, 6);

  return (
    <SiteShell>
      <section className="marketplace-trust panel">
        <div className="marketplace-trust__label">Cam kết</div>
        <div className="marketplace-trust__items">
          {trustHighlights.map((item) => (
            <span className="marketplace-pill" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="marketplace-hero">
        <aside className="marketplace-sidebar panel">
          <div className="marketplace-sidebar__header">
            <h2>Danh mục</h2>
            <Link className="text-link" href="/products">
              Xem tất cả
            </Link>
          </div>

          <div className="marketplace-category-list">
            {marketplaceCategories.map((category) => (
              <Link className="marketplace-category-item" href="/products" key={category.label}>
                <span className="marketplace-category-item__icon">{category.code}</span>
                <span>{category.label}</span>
              </Link>
            ))}
          </div>
        </aside>

        <div className="marketplace-stage">
          <div className="marketplace-banners panel">
            {promoBanners.map((banner, index) => (
              <article
                className={`marketplace-banner ${index === 1 ? "marketplace-banner--dark" : ""}`}
                key={banner.title}
                style={{ background: banner.tone }}
              >
                <p className="marketplace-banner__label">{banner.label}</p>
                <h1>{banner.title}</h1>
                <p className="marketplace-banner__copy">{banner.description}</p>
                <div className="marketplace-banner__cta">
                  <Link className="button button--primary" href="/products">
                    {banner.cta}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="marketplace-mini-row">
            {heroProducts.map((product) => (
              <article
                className="marketplace-mini-card"
                key={product.slug}
                style={{ background: product.gradient }}
              >
                <p className="marketplace-mini-card__label">{product.category}</p>
                <h3>{product.name}</h3>
                <p>{product.badge}</p>
              </article>
            ))}
          </div>

          <div className="marketplace-shortcuts panel">
            {quickChannels.map((item) => (
              <Link className="marketplace-shortcut" href="/products" key={item.label}>
                <span className="marketplace-shortcut__icon">{item.code}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="marketplace-section panel">
        <div className="marketplace-section__header">
          <div>
            <p className="marketplace-section__eyebrow">Ưu đãi đỉnh - giá sốc</p>
            <h2>Sản phẩm bán nhanh cho nhu cầu mua sắm hằng ngày.</h2>
          </div>
          <Link className="text-link" href="/products">
            Xem tất cả
          </Link>
        </div>
        <div className="marketplace-product-grid">
          {topDeals.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="marketplace-feature-strip">
        {departmentRows.map((row, index) => (
          <article className="marketplace-feature-card panel" key={row.title}>
            <p className="marketplace-section__eyebrow">{row.label}</p>
            <h3>{row.title}</h3>
            <p>{row.description}</p>
            <div className="marketplace-feature-card__status">
              <span className="status-dot" />
              <span>
                {index === 0
                  ? source === "database"
                    ? "Danh mục đang kết nối dữ liệu thật"
                    : "Đang dùng danh mục mẫu dự phòng"
                  : "Khối trang chủ đã sẵn sàng cho khuyến mãi thật"}
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="marketplace-section marketplace-section--split">
        <div className="marketplace-section__header">
          <div>
            <p className="marketplace-section__eyebrow">Siêu thị</p>
            <h2>Các tầng danh mục rộng giúp gian hàng luôn sôi động.</h2>
          </div>
          <Link className="text-link" href="/products">
            Xem mọi danh mục
          </Link>
        </div>

        <div className="marketplace-shelf-layout">
          <article className="marketplace-shelf-banner panel panel--soft">
            <p className="marketplace-section__eyebrow">Nhà cửa và bếp</p>
            <h3>Kết hợp hàng thiết thực với chiến dịch hằng tuần và khám phá theo danh mục.</h3>
            <p>
              Đây là nơi biểu ngữ, nhãn danh mục và thẻ ưu đãi phối hợp như một trang chủ
              sàn thật thay vì trang đích của một thương hiệu đơn lẻ.
            </p>
          </article>

          <div className="marketplace-product-grid marketplace-product-grid--compact">
            {valueDeals.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="marketplace-section">
        <div className="marketplace-section__header">
          <div>
            <p className="marketplace-section__eyebrow">Xu hướng</p>
            <h2>Giữ thêm một lưới cho sách, công nghệ và các lượt mua ngẫu hứng.</h2>
          </div>
          <Link className="text-link" href="/products">
            Khám phá mọi ưu đãi
          </Link>
        </div>
        <div className="marketplace-product-grid">
          {trendDeals.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
