import { getCatalogProducts } from "@backend/products.js";
import { ProductCard } from "@/components/product-card";
import { SiteShell } from "@/components/site-shell";

export const metadata = {
  title: "Danh mục",
};

export const revalidate = 300;

export default async function ProductsPage() {
  const { products, source } = await getCatalogProducts();

  return (
    <SiteShell>
      <div className="page-stack">
        <section className="catalog-header panel">
          <div>
            <span className="eyebrow">Danh mục sản phẩm</span>
            <h1>Tất cả sản phẩm đang hiển thị trong gian hàng mẫu.</h1>
          </div>
          <aside className="catalog-status">
            <p className="note">Nguồn dữ liệu hiện tại</p>
            <strong>{source === "database" ? "MySQL" : "Dữ liệu mẫu dự phòng"}</strong>
            <p className="note">
              Chuyển sang dữ liệu thật bằng cách điền biến MySQL trong `.env.local`
              và phần Environment Variables của Netlify.
            </p>
          </aside>
        </section>

        <section className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </section>
      </div>
    </SiteShell>
  );
}
