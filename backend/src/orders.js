import { hasDatabaseConfig, query, withTransaction } from "./db.js";

const allowedPaymentMethods = new Set(["cod", "bank_transfer"]);

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function requireDatabaseWrite() {
  if (!hasDatabaseConfig()) {
    throw createHttpError("Cần cấu hình MySQL thật để tạo đơn hàng.", 503);
  }
}

function sanitizeText(value, fieldName, minimumLength = 1) {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (normalized.length < minimumLength) {
    throw createHttpError(`${fieldName} không hợp lệ.`);
  }

  return normalized;
}

function sanitizeOptionalText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parsePositiveInteger(value, fieldName) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createHttpError(`${fieldName} không hợp lệ.`);
  }

  return parsed;
}

function sanitizeOrderInput(input) {
  const items = Array.isArray(input.items) ? input.items : [];

  if (items.length === 0) {
    throw createHttpError("Giỏ hàng đang trống.");
  }

  const normalizedItems = items.map((item) => ({
    productId: parsePositiveInteger(item.productId, "Sản phẩm"),
    quantity: parsePositiveInteger(item.quantity, "Số lượng"),
  }));

  const paymentMethod = typeof input.paymentMethod === "string" ? input.paymentMethod : "cod";

  if (!allowedPaymentMethods.has(paymentMethod)) {
    throw createHttpError("Phương thức thanh toán không hợp lệ.");
  }

  return {
    customerName: sanitizeText(input.customerName, "Họ tên", 2),
    customerEmail: sanitizeText(input.customerEmail, "Email", 5),
    customerPhone: sanitizeOptionalText(input.customerPhone),
    shippingAddress: sanitizeText(input.shippingAddress, "Địa chỉ nhận hàng", 5),
    note: sanitizeOptionalText(input.note),
    paymentMethod,
    items: normalizedItems,
  };
}

function formatOrderNumber(date = new Date()) {
  const datePart = date.toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `GET-${datePart}-${randomPart}`;
}

function normalizeOrder(row) {
  return {
    id: Number(row.id),
    orderNumber: row.order_number,
    customerAccountId: row.customer_account_id ? Number(row.customer_account_id) : null,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    paymentMethod: row.payment_method,
    status: row.status,
    totalAmount: Number(row.total_amount),
    itemCount: Number(row.item_count ?? 0),
    sellerRevenue: row.seller_revenue === undefined || row.seller_revenue === null ? null : Number(row.seller_revenue),
    createdAt: row.created_at,
  };
}

async function executeOn(connection, sql, params = []) {
  const [rows] = await connection.execute(sql, params);
  return rows;
}

function toSafeLimit(limit) {
  const normalizedLimit = Number.isInteger(limit) ? limit : Number.parseInt(limit, 10);
  return Number.isFinite(normalizedLimit) && normalizedLimit > 0 ? normalizedLimit : 10;
}

async function getLatestOrders(limit = 10) {
  const safeLimit = toSafeLimit(limit);
  const rows = await query(
    `
      SELECT
        o.id,
        o.order_number,
        o.customer_account_id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.payment_method,
        o.status,
        o.total_amount,
        o.created_at,
        COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${safeLimit}
    `,
  );

  return rows.map(normalizeOrder);
}

async function getCustomerOrders(accountId, limit = 20) {
  const safeLimit = toSafeLimit(limit);
  const rows = await query(
    `
      SELECT
        o.id,
        o.order_number,
        o.customer_account_id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.payment_method,
        o.status,
        o.total_amount,
        o.created_at,
        COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.customer_account_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${safeLimit}
    `,
    [accountId],
  );

  return rows.map(normalizeOrder);
}

async function getSellerOrders(accountId, limit = 20) {
  const safeLimit = toSafeLimit(limit);
  const rows = await query(
    `
      SELECT
        o.id,
        o.order_number,
        o.customer_account_id,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.payment_method,
        o.status,
        o.total_amount,
        o.created_at,
        COUNT(oi.id) AS item_count,
        SUM(oi.line_total) AS seller_revenue
      FROM orders o
      INNER JOIN order_items oi ON oi.order_id = o.id
      INNER JOIN products p ON p.id = oi.product_id
      WHERE p.seller_account_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${safeLimit}
    `,
    [accountId],
  );

  return rows.map(normalizeOrder);
}

export async function getRecentOrders(limit = 10) {
  if (!hasDatabaseConfig()) {
    return [];
  }

  try {
    return await getLatestOrders(limit);
  } catch (error) {
    console.warn("Không tải được danh sách đơn hàng:", error);
    return [];
  }
}

export async function getOrdersByCustomer(accountId, limit = 20) {
  if (!hasDatabaseConfig()) {
    return [];
  }

  try {
    return await getCustomerOrders(parsePositiveInteger(accountId, "Tài khoản"), limit);
  } catch (error) {
    console.warn("Không tải được đơn hàng của người mua:", error);
    return [];
  }
}

export async function getOrdersBySeller(accountId, limit = 20) {
  if (!hasDatabaseConfig()) {
    return [];
  }

  try {
    return await getSellerOrders(parsePositiveInteger(accountId, "Tài khoản"), limit);
  } catch (error) {
    console.warn("Không tải được đơn hàng của người bán:", error);
    return [];
  }
}

export async function createOrder(input, options = {}) {
  requireDatabaseWrite();

  const payload = sanitizeOrderInput(input);
  const actor = options.actor ?? null;

  return withTransaction(async (connection) => {
    const productIds = payload.items.map((item) => item.productId);
    const placeholders = productIds.map(() => "?").join(", ");
    const products = await executeOn(
      connection,
      `
        SELECT
          id,
          name,
          sku,
          price,
          inventory_qty,
          status
        FROM products
        WHERE id IN (${placeholders})
        FOR UPDATE
      `,
      productIds,
    );

    const productsById = new Map(products.map((product) => [Number(product.id), product]));

    let subtotal = 0;
    const lineItems = payload.items.map((item) => {
      const product = productsById.get(item.productId);

      if (!product || product.status !== "active") {
        throw createHttpError("Một hoặc nhiều sản phẩm không còn khả dụng.", 409);
      }

      if (Number(product.inventory_qty) < item.quantity) {
        throw createHttpError(`Sản phẩm "${product.name}" không đủ tồn kho.`, 409);
      }

      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      return {
        productId: item.productId,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      };
    });

    const shippingFee = subtotal >= 500000 ? 0 : 30000;
    const totalAmount = subtotal + shippingFee;

    let orderNumber = formatOrderNumber();
    let insertedOrderId = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await executeOn(
          connection,
          `
            INSERT INTO orders (
              order_number,
              customer_account_id,
              customer_name,
              customer_email,
              customer_phone,
              shipping_address,
              payment_method,
              status,
              subtotal,
              shipping_fee,
              total_amount,
              note
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
          `,
          [
            orderNumber,
            actor?.id ?? null,
            payload.customerName,
            payload.customerEmail,
            payload.customerPhone,
            payload.shippingAddress,
            payload.paymentMethod,
            subtotal,
            shippingFee,
            totalAmount,
            payload.note,
          ],
        );

        insertedOrderId = result.insertId;
        break;
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY" && attempt < 2) {
          orderNumber = formatOrderNumber();
          continue;
        }

        throw error;
      }
    }

    if (!insertedOrderId) {
      throw createHttpError("Không tạo được đơn hàng.", 500);
    }

    for (const item of lineItems) {
      await executeOn(
        connection,
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            sku,
            quantity,
            unit_price,
            line_total
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          insertedOrderId,
          item.productId,
          item.productName,
          item.sku,
          item.quantity,
          item.unitPrice,
          item.lineTotal,
        ],
      );

      await executeOn(
        connection,
        `
          UPDATE products
          SET inventory_qty = inventory_qty - ?
          WHERE id = ?
        `,
        [item.quantity, item.productId],
      );
    }

    return {
      id: insertedOrderId,
      orderNumber,
      subtotal,
      shippingFee,
      totalAmount,
      status: "pending",
      itemCount: lineItems.length,
    };
  });
}
