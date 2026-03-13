import { revalidatePath } from "next/cache";
import { createProduct, getCatalogProducts } from "@backend/products.js";
import { getCurrentAccount } from "@/lib/auth";

function createAuthError(message, status) {
  return Response.json({ message }, { status });
}

async function requireCatalogManagerAccount() {
  const account = await getCurrentAccount();

  if (!account) {
    return createAuthError("Vui lòng đăng nhập để quản lý sản phẩm.", 401);
  }

  if (!["seller", "admin"].includes(account.role)) {
    return createAuthError("Bạn không có quyền quản lý sản phẩm.", 403);
  }

  return account;
}

export async function GET() {
  const catalog = await getCatalogProducts();

  return Response.json({
    source: catalog.source,
    count: catalog.products.length,
    data: catalog.products,
  });
}

export async function POST(request) {
  try {
    const account = await requireCatalogManagerAccount();

    if (account instanceof Response) {
      return account;
    }

    const payload = await request.json();
    const product = await createProduct(payload, { actor: account });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/seller");
    revalidatePath("/admin");
    revalidatePath(`/products/${product.slug}`);

    return Response.json({ data: product }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        message: error.message ?? "Không tạo được sản phẩm.",
      },
      { status: error.statusCode ?? 500 },
    );
  }
}
