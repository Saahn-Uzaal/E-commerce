import { revalidatePath } from "next/cache";
import {
  createOrder,
  getOrdersByCustomer,
  getOrdersBySeller,
  getRecentOrders,
} from "@backend/orders.js";
import { getCurrentAccount } from "@/lib/auth";

export async function GET() {
  const account = await getCurrentAccount();

  if (!account) {
    return Response.json({ message: "Vui lòng đăng nhập để xem đơn hàng." }, { status: 401 });
  }

  let orders = [];

  if (account.role === "admin") {
    orders = await getRecentOrders();
  } else if (account.role === "seller") {
    orders = await getOrdersBySeller(account.id);
  } else {
    orders = await getOrdersByCustomer(account.id);
  }

  return Response.json({
    count: orders.length,
    data: orders,
  });
}

export async function POST(request) {
  try {
    const account = await getCurrentAccount();
    const payload = await request.json();
    const order = await createOrder(payload, { actor: account });

    revalidatePath("/admin");
    revalidatePath("/seller");
    revalidatePath("/account");
    revalidatePath("/cart");

    return Response.json({ data: order }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        message: error.message ?? "Không tạo được đơn hàng.",
      },
      { status: error.statusCode ?? 500 },
    );
  }
}
