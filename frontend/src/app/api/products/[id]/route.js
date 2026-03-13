import { revalidatePath } from "next/cache";
import { deleteProduct, updateProduct } from "@backend/products.js";
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

export async function PATCH(request, { params }) {
  try {
    const account = await requireCatalogManagerAccount();

    if (account instanceof Response) {
      return account;
    }

    const payload = await request.json();
    const product = await updateProduct(params.id, payload, { actor: account });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/seller");
    revalidatePath("/admin");
    revalidatePath(`/products/${product.slug}`);
    if (product.previousSlug && product.previousSlug !== product.slug) {
      revalidatePath(`/products/${product.previousSlug}`);
    }

    return Response.json({ data: product });
  } catch (error) {
    return Response.json(
      {
        message: error.message ?? "Không cập nhật được sản phẩm.",
      },
      { status: error.statusCode ?? 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const account = await requireCatalogManagerAccount();

    if (account instanceof Response) {
      return account;
    }

    const product = await deleteProduct(params.id, { actor: account });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/seller");
    revalidatePath("/admin");
    revalidatePath(`/products/${product.slug}`);

    return Response.json({ data: product });
  } catch (error) {
    return Response.json(
      {
        message: error.message ?? "Không xóa được sản phẩm.",
      },
      { status: error.statusCode ?? 500 },
    );
  }
}
