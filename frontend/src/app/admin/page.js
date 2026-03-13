import { hasDatabaseConfig } from "@backend/db.js";
import { getRecentOrders } from "@backend/orders.js";
import { getCatalogCategories, getManageableProducts } from "@backend/products.js";
import { AdminDashboard } from "@/components/admin-dashboard";
import { requireAccount } from "@/lib/auth";
import { SiteShell } from "@/components/site-shell";

export const metadata = {
  title: "Quản trị",
};

export default async function AdminPage() {
  const account = await requireAccount({
    roles: ["admin"],
    nextPath: "/admin",
  });

  const databaseConfigured = hasDatabaseConfig();
  const [catalog, categories, orders] = await Promise.all([
    getManageableProducts(account),
    getCatalogCategories(),
    getRecentOrders(),
  ]);

  return (
    <SiteShell>
      <AdminDashboard
        currentAccount={account}
        databaseConfigured={databaseConfigured}
        initialCategories={categories}
        initialOrders={orders}
        initialProducts={catalog.products}
        role="admin"
        source={catalog.source}
      />
    </SiteShell>
  );
}
