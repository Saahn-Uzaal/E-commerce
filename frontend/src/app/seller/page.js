import { getCatalogCategories, getManageableProducts } from "@backend/products.js";
import { getOrdersBySeller } from "@backend/orders.js";
import { hasDatabaseConfig } from "@backend/db.js";
import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAccount } from "@/lib/auth";
import { SiteShell } from "@/components/site-shell";

export const metadata = {
  title: "Kênh người bán",
};

export default async function SellerPage() {
  const account = await requireAccount({
    roles: ["seller"],
    nextPath: "/seller",
  });

  const databaseConfigured = hasDatabaseConfig();
  const [catalog, categories, orders] = await Promise.all([
    getManageableProducts(account),
    getCatalogCategories(),
    getOrdersBySeller(account.id),
  ]);

  return (
    <SiteShell>
      <AdminDashboard
        currentAccount={account}
        databaseConfigured={databaseConfigured}
        initialCategories={categories}
        initialOrders={orders}
        initialProducts={catalog.products}
        role="seller"
        source={catalog.source}
      />
    </SiteShell>
  );
}
