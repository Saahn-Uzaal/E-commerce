import { hasDatabaseConfig, query, withTransaction } from "./db.js";
import { sampleCategories, sampleProducts } from "./sample-data.js";

const fallbackGradients = [
  "linear-gradient(135deg, #14323e, #4d7787)",
  "linear-gradient(135deg, #8d3615, #d9906f)",
  "linear-gradient(135deg, #3b4c28, #94a36c)",
  "linear-gradient(135deg, #614134, #c08b72)",
];

const allowedStatuses = new Set(["draft", "active", "archived"]);
const catalogManagerRoles = new Set(["seller", "admin"]);

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeCategory(row) {
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
  };
}

function getFallbackHighlights(row) {
  return [
    row.material_note ?? "Bổ sung ghi chú về chất liệu",
    row.shipping_note ?? "Bổ sung chi tiết giao hàng",
    row.fit_note ?? "Bổ sung điểm bán hàng chính",
  ];
}

function normalizeProduct(row, index, highlightsByProductId) {
  const highlights = highlightsByProductId.get(row.id) ?? getFallbackHighlights(row);

  return {
    id: Number(row.id),
    categoryId: row.category_id ? Number(row.category_id) : null,
    sellerAccountId: row.seller_account_id ? Number(row.seller_account_id) : null,
    sellerName: row.seller_name ?? null,
    slug: row.slug,
    name: row.name,
    category: row.category_name ?? "Chưa phân loại",
    description: row.description ?? "Hãy bổ sung mô tả chi tiết hơn trong cơ sở dữ liệu.",
    price: Number(row.price),
    featured: Boolean(row.featured),
    badge: row.badge ?? (row.featured ? "Nổi bật" : "Danh mục"),
    sku: row.sku ?? `GET-${String(row.id).padStart(3, "0")}`,
    inventory: Number(row.inventory_qty ?? 0),
    status: row.status ?? "active",
    gradient: row.gradient ?? fallbackGradients[index % fallbackGradients.length],
    imageUrl: row.primary_image_url ?? null,
    materialNote: row.material_note ?? "",
    shippingNote: row.shipping_note ?? "",
    fitNote: row.fit_note ?? "",
    highlights,
  };
}

async function executeOn(target, sql, params = []) {
  if (target && typeof target.execute === "function") {
    const [rows] = await target.execute(sql, params);
    return rows;
  }

  return query(sql, params);
}

function coerceOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePositiveNumber(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw createHttpError(`${fieldName} không hợp lệ.`);
  }

  return parsed;
}

function parsePositiveInteger(value, fieldName) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw createHttpError(`${fieldName} không hợp lệ.`);
  }

  return parsed;
}

function parseBoolean(value) {
  return value === true || value === "true" || value === "on" || value === 1 || value === "1";
}

function parseHighlights(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  return [];
}

function sanitizeProductInput(input) {
  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (name.length < 3) {
    throw createHttpError("Tên sản phẩm phải có ít nhất 3 ký tự.");
  }

  const slugSource = typeof input.slug === "string" && input.slug.trim().length > 0 ? input.slug : name;
  const slug = slugify(slugSource);

  if (!slug) {
    throw createHttpError("Slug sản phẩm không hợp lệ.");
  }

  const sku = typeof input.sku === "string" ? input.sku.trim().toUpperCase() : "";

  if (sku.length < 3) {
    throw createHttpError("SKU phải có ít nhất 3 ký tự.");
  }

  const status = typeof input.status === "string" ? input.status : "active";

  if (!allowedStatuses.has(status)) {
    throw createHttpError("Trạng thái sản phẩm không hợp lệ.");
  }

  const rawCategoryId = input.categoryId ?? input.category_id;
  const categoryId =
    rawCategoryId === null || rawCategoryId === undefined || rawCategoryId === ""
      ? null
      : parsePositiveInteger(rawCategoryId, "Danh mục");

  const rawSellerAccountId = input.sellerAccountId ?? input.seller_account_id;
  const sellerAccountId =
    rawSellerAccountId === null || rawSellerAccountId === undefined || rawSellerAccountId === ""
      ? null
      : parsePositiveInteger(rawSellerAccountId, "Người bán");

  return {
    categoryId,
    sellerAccountId,
    name,
    slug,
    sku,
    badge: coerceOptionalString(input.badge),
    description: coerceOptionalString(input.description),
    gradient: coerceOptionalString(input.gradient),
    imageUrl: coerceOptionalString(input.imageUrl ?? input.primaryImageUrl ?? input.primary_image_url),
    materialNote: coerceOptionalString(input.materialNote ?? input.material_note),
    shippingNote: coerceOptionalString(input.shippingNote ?? input.shipping_note),
    fitNote: coerceOptionalString(input.fitNote ?? input.fit_note),
    price: parsePositiveNumber(input.price ?? 0, "Giá"),
    inventory: parsePositiveInteger(input.inventory ?? 0, "Tồn kho"),
    featured: parseBoolean(input.featured ?? input.is_featured),
    status,
    highlights: parseHighlights(input.highlights),
  };
}

async function loadProductHighlights(productIds, target) {
  if (productIds.length === 0) {
    return new Map();
  }

  const placeholders = productIds.map(() => "?").join(", ");
  const rows = await executeOn(
    target,
    `
      SELECT
        product_id,
        content
      FROM product_highlights
      WHERE product_id IN (${placeholders})
      ORDER BY sort_order ASC, id ASC
    `,
    productIds,
  );

  const highlightsByProductId = new Map();

  for (const row of rows) {
    const currentHighlights = highlightsByProductId.get(row.product_id) ?? [];
    currentHighlights.push(row.content);
    highlightsByProductId.set(row.product_id, currentHighlights);
  }

  return highlightsByProductId;
}

async function loadProductRows(filters = {}, target = null) {
  const whereClauses = [];
  const params = [];

  if (filters.activeOnly) {
    whereClauses.push("p.status = 'active'");
  }

  if (filters.productId) {
    whereClauses.push("p.id = ?");
    params.push(filters.productId);
  }

  if (filters.slug) {
    whereClauses.push("p.slug = ?");
    params.push(filters.slug);
  }

  if (filters.sellerAccountId) {
    whereClauses.push("p.seller_account_id = ?");
    params.push(filters.sellerAccountId);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  return executeOn(
    target,
    `
      SELECT
        p.id,
        p.category_id,
        p.seller_account_id,
        p.slug,
        p.name,
        p.description,
        p.price,
        p.sku,
        p.badge,
        p.gradient,
        p.primary_image_url,
        p.material_note,
        p.shipping_note,
        p.fit_note,
        p.inventory_qty,
        p.status,
        p.is_featured AS featured,
        c.name AS category_name,
        seller.full_name AS seller_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN user_accounts seller ON seller.id = p.seller_account_id
      ${whereSql}
      ORDER BY p.is_featured DESC, p.updated_at DESC, p.id DESC
    `,
    params,
  );
}

async function mapRowsToProducts(rows, target = null) {
  const productIds = rows.map((row) => row.id);
  const highlightsByProductId = await loadProductHighlights(productIds, target);

  return rows.map((row, index) => normalizeProduct(row, index, highlightsByProductId));
}

async function getProductFromDatabaseById(productId, target = null) {
  const rows = await loadProductRows({ productId }, target);
  const products = await mapRowsToProducts(rows, target);
  return products[0] ?? null;
}

async function getProductFromDatabaseBySlug(slug) {
  const rows = await loadProductRows({ slug, activeOnly: true });
  const products = await mapRowsToProducts(rows);
  return products[0] ?? null;
}

async function loadProductsFromDatabase() {
  const rows = await loadProductRows({ activeOnly: true });
  return mapRowsToProducts(rows);
}

async function loadManageableProductsFromDatabase(actor) {
  const rows = await loadProductRows({
    sellerAccountId: actor.role === "seller" ? actor.id : null,
  });

  return mapRowsToProducts(rows);
}

async function loadCategoriesFromDatabase() {
  const rows = await query(
    `
      SELECT
        id,
        name,
        slug,
        description
      FROM categories
      ORDER BY name ASC
    `,
  );

  return rows.map(normalizeCategory);
}

async function ensureCategoryExists(target, categoryId) {
  if (!categoryId) {
    return null;
  }

  const rows = await executeOn(target, "SELECT id FROM categories WHERE id = ? LIMIT 1", [categoryId]);

  if (rows.length === 0) {
    throw createHttpError("Danh mục không tồn tại.");
  }

  return categoryId;
}

async function ensureAccountExists(target, accountId) {
  if (!accountId) {
    return null;
  }

  const rows = await executeOn(
    target,
    `
      SELECT id
      FROM user_accounts
      WHERE id = ?
      LIMIT 1
    `,
    [accountId],
  );

  if (rows.length === 0) {
    throw createHttpError("Tài khoản người bán không tồn tại.");
  }

  return accountId;
}

async function replaceHighlights(target, productId, highlights) {
  await executeOn(target, "DELETE FROM product_highlights WHERE product_id = ?", [productId]);

  if (highlights.length === 0) {
    return;
  }

  const placeholders = highlights.map(() => "(?, ?, ?)").join(", ");
  const params = [];

  highlights.forEach((content, index) => {
    params.push(productId, content, index + 1);
  });

  await executeOn(
    target,
    `
      INSERT INTO product_highlights (product_id, content, sort_order)
      VALUES ${placeholders}
    `,
    params,
  );
}

async function replaceProductImages(target, productId, imageUrl, altText) {
  await executeOn(target, "DELETE FROM product_images WHERE product_id = ?", [productId]);

  if (!imageUrl) {
    return;
  }

  await executeOn(
    target,
    `
      INSERT INTO product_images (product_id, image_url, alt_text, sort_order)
      VALUES (?, ?, ?, 1)
    `,
    [productId, imageUrl, altText],
  );
}

function requireDatabaseWrite() {
  if (!hasDatabaseConfig()) {
    throw createHttpError("Cần cấu hình MySQL thật để lưu thay đổi.", 503);
  }
}

function requireCatalogManager(actor) {
  if (!actor || !catalogManagerRoles.has(actor.role)) {
    throw createHttpError("Bạn không có quyền quản lý sản phẩm.", 403);
  }
}

function resolveSellerAccountId(actor, payload) {
  if (!actor) {
    return payload.sellerAccountId;
  }

  if (actor.role === "seller") {
    return actor.id;
  }

  return payload.sellerAccountId ?? actor.id;
}

function assertCanManageProduct(actor, product) {
  if (!actor) {
    throw createHttpError("Bạn không có quyền quản lý sản phẩm.", 403);
  }

  if (actor.role === "admin") {
    return;
  }

  if (actor.role === "seller" && product.sellerAccountId === actor.id) {
    return;
  }

  throw createHttpError("Bạn không có quyền quản lý sản phẩm này.", 403);
}

export async function getCatalogProducts() {
  if (!hasDatabaseConfig()) {
    return {
      source: "sample",
      products: sampleProducts,
    };
  }

  try {
    const products = await loadProductsFromDatabase();

    return {
      source: "database",
      products,
    };
  } catch (error) {
    console.warn("Chuyển sang dùng sản phẩm mẫu:", error);

    return {
      source: "sample",
      products: sampleProducts,
    };
  }
}

export async function getManageableProducts(actor) {
  requireCatalogManager(actor);

  if (!hasDatabaseConfig()) {
    return {
      source: "sample",
      products: sampleProducts,
    };
  }

  try {
    const products = await loadManageableProductsFromDatabase(actor);

    return {
      source: "database",
      products,
    };
  } catch (error) {
    console.warn("Chuyển sang dùng sản phẩm mẫu trong quản trị:", error);

    return {
      source: "sample",
      products: sampleProducts,
    };
  }
}

export async function getCatalogCategories() {
  if (!hasDatabaseConfig()) {
    return sampleCategories;
  }

  try {
    return await loadCategoriesFromDatabase();
  } catch (error) {
    console.warn("Chuyển sang dùng danh mục mẫu:", error);
    return sampleCategories;
  }
}

export async function getFeaturedProducts(limit = 4) {
  const catalog = await getCatalogProducts();
  const featured = catalog.products.filter((product) => product.featured).slice(0, limit);

  return {
    ...catalog,
    products: featured.length > 0 ? featured : catalog.products.slice(0, limit),
  };
}

export async function getProductBySlug(slug) {
  if (!hasDatabaseConfig()) {
    return sampleProducts.find((product) => product.slug === slug) ?? null;
  }

  try {
    return await getProductFromDatabaseBySlug(slug);
  } catch (error) {
    console.warn("Chuyển sang dùng sản phẩm mẫu:", error);
    return sampleProducts.find((product) => product.slug === slug) ?? null;
  }
}

export async function createProduct(input, options = {}) {
  requireDatabaseWrite();

  const payload = sanitizeProductInput(input);
  const actor = options.actor ?? null;

  requireCatalogManager(actor);

  return withTransaction(async (connection) => {
    const sellerAccountId = resolveSellerAccountId(actor, payload);

    await ensureCategoryExists(connection, payload.categoryId);
    await ensureAccountExists(connection, sellerAccountId);

    const result = await executeOn(
      connection,
      `
        INSERT INTO products (
          category_id,
          seller_account_id,
          name,
          slug,
          sku,
          badge,
          description,
          gradient,
          primary_image_url,
          material_note,
          shipping_note,
          fit_note,
          price,
          inventory_qty,
          is_featured,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.categoryId,
        sellerAccountId,
        payload.name,
        payload.slug,
        payload.sku,
        payload.badge,
        payload.description,
        payload.gradient,
        payload.imageUrl,
        payload.materialNote,
        payload.shippingNote,
        payload.fitNote,
        payload.price,
        payload.inventory,
        payload.featured ? 1 : 0,
        payload.status,
      ],
    );

    await replaceHighlights(connection, result.insertId, payload.highlights);
    await replaceProductImages(connection, result.insertId, payload.imageUrl, payload.name);

    return getProductFromDatabaseById(result.insertId, connection);
  });
}

export async function updateProduct(productId, input, options = {}) {
  requireDatabaseWrite();

  const normalizedProductId = parsePositiveInteger(productId, "Mã sản phẩm");
  const payload = sanitizeProductInput(input);
  const actor = options.actor ?? null;

  requireCatalogManager(actor);

  return withTransaction(async (connection) => {
    const existingProduct = await getProductFromDatabaseById(normalizedProductId, connection);

    if (!existingProduct) {
      throw createHttpError("Không tìm thấy sản phẩm.", 404);
    }

    assertCanManageProduct(actor, existingProduct);

    const sellerAccountId = resolveSellerAccountId(actor, {
      ...payload,
      sellerAccountId: payload.sellerAccountId ?? existingProduct.sellerAccountId,
    });

    await ensureCategoryExists(connection, payload.categoryId);
    await ensureAccountExists(connection, sellerAccountId);

    await executeOn(
      connection,
      `
        UPDATE products
        SET
          category_id = ?,
          seller_account_id = ?,
          name = ?,
          slug = ?,
          sku = ?,
          badge = ?,
          description = ?,
          gradient = ?,
          primary_image_url = ?,
          material_note = ?,
          shipping_note = ?,
          fit_note = ?,
          price = ?,
          inventory_qty = ?,
          is_featured = ?,
          status = ?
        WHERE id = ?
      `,
      [
        payload.categoryId,
        sellerAccountId,
        payload.name,
        payload.slug,
        payload.sku,
        payload.badge,
        payload.description,
        payload.gradient,
        payload.imageUrl,
        payload.materialNote,
        payload.shippingNote,
        payload.fitNote,
        payload.price,
        payload.inventory,
        payload.featured ? 1 : 0,
        payload.status,
        normalizedProductId,
      ],
    );

    await replaceHighlights(connection, normalizedProductId, payload.highlights);
    await replaceProductImages(connection, normalizedProductId, payload.imageUrl, payload.name);

    const updatedProduct = await getProductFromDatabaseById(normalizedProductId, connection);

    return {
      ...updatedProduct,
      previousSlug: existingProduct.slug,
    };
  });
}

export async function deleteProduct(productId, options = {}) {
  requireDatabaseWrite();

  const normalizedProductId = parsePositiveInteger(productId, "Mã sản phẩm");
  const actor = options.actor ?? null;

  requireCatalogManager(actor);

  return withTransaction(async (connection) => {
    const existingProduct = await getProductFromDatabaseById(normalizedProductId, connection);

    if (!existingProduct) {
      throw createHttpError("Không tìm thấy sản phẩm.", 404);
    }

    assertCanManageProduct(actor, existingProduct);

    await executeOn(connection, "DELETE FROM products WHERE id = ?", [normalizedProductId]);

    return existingProduct;
  });
}
