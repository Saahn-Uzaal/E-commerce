import { hasDatabaseConfig } from "@backend/db.js";
import { getCatalogProducts } from "@backend/products.js";
import { CartClient } from "@/components/cart-client";
import { getCurrentAccount } from "@/lib/auth";
import { SiteShell } from "@/components/site-shell";

export const metadata = {
  title: "Giỏ hàng",
};

export const revalidate = 300;

export default async function CartPage() {
  const [catalog, account] = await Promise.all([getCatalogProducts(), getCurrentAccount()]);
  const databaseConfigured = hasDatabaseConfig();

  return (
    <SiteShell>
      <CartClient account={account} databaseConfigured={databaseConfigured} products={catalog.products} />
    </SiteShell>
  );
}
