import crypto from "node:crypto";
import { hasDatabaseConfig, query, withTransaction } from "./db.js";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;

export const demoAccounts = [
  {
    role: "buyer",
    email: "buyer@gmail.com",
    password: "123456",
    fullName: "Khách Mua Gettsay",
  },
  {
    role: "seller",
    email: "seller@gmail.com",
    password: "123456",
    fullName: "Nhà Bán Hàng Gettsay",
  },
  {
    role: "admin",
    email: "admin@gettsay.local",
    password: "admin123",
    fullName: "Quản Trị Gettsay",
  },
];

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sanitizeEmail(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (!normalized.includes("@") || normalized.length < 5) {
    throw createHttpError("Email không hợp lệ.");
  }

  return normalized;
}

function sanitizePassword(value) {
  const normalized = typeof value === "string" ? value : "";

  if (normalized.length < 6) {
    throw createHttpError("Mật khẩu phải có ít nhất 6 ký tự.");
  }

  return normalized;
}

function normalizeAccount(row) {
  if (!row) {
    return null;
  }

  return {
    id: Number(row.id),
    email: row.email,
    fullName: row.full_name,
    phone: row.phone ?? "",
    role: row.role,
    status: row.status,
    createdAt: row.created_at ?? null,
  };
}

function parsePasswordHash(value) {
  const [algorithm, salt, hash] = typeof value === "string" ? value.split(":") : [];

  if (algorithm !== "scrypt" || !salt || !hash) {
    throw createHttpError("Định dạng mật khẩu lưu trữ không hợp lệ.", 500);
  }

  return { salt, hash };
}

function hashPasswordWithSalt(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function hashSessionToken(sessionToken) {
  return crypto.createHash("sha256").update(sessionToken).digest("hex");
}

async function executeOn(target, sql, params = []) {
  if (target && typeof target.execute === "function") {
    const [rows] = await target.execute(sql, params);
    return rows;
  }

  return query(sql, params);
}

async function getAccountRowByEmail(email, target = null) {
  const rows = await executeOn(
    target,
    `
      SELECT
        id,
        email,
        password_hash,
        full_name,
        phone,
        role,
        status,
        created_at
      FROM user_accounts
      WHERE email = ?
      LIMIT 1
    `,
    [email],
  );

  return rows[0] ?? null;
}

export function verifyPassword(password, storedHash) {
  const { salt, hash } = parsePasswordHash(storedHash);
  const expectedHash = Buffer.from(hash, "hex");
  const actualHash = Buffer.from(hashPasswordWithSalt(password, salt), "hex");

  if (expectedHash.length !== actualHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedHash, actualHash);
}

export async function createSessionForCredentials(input) {
  if (!hasDatabaseConfig()) {
    throw createHttpError("Chưa có cấu hình MySQL để đăng nhập.", 503);
  }

  const email = sanitizeEmail(input.email);
  const password = sanitizePassword(input.password);

  return withTransaction(async (connection) => {
    const accountRow = await getAccountRowByEmail(email, connection);

    if (!accountRow || !verifyPassword(password, accountRow.password_hash)) {
      throw createHttpError("Email hoặc mật khẩu không đúng.", 401);
    }

    if (accountRow.status !== "active") {
      throw createHttpError("Tài khoản hiện không khả dụng.", 403);
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionTokenHash = hashSessionToken(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await executeOn(connection, "DELETE FROM user_sessions WHERE expires_at <= NOW()", []);
    await executeOn(
      connection,
      `
        INSERT INTO user_sessions (
          account_id,
          session_token_hash,
          expires_at
        )
        VALUES (?, ?, ?)
      `,
      [accountRow.id, sessionTokenHash, expiresAt],
    );

    return {
      account: normalizeAccount(accountRow),
      sessionToken,
      expiresAt: expiresAt.toISOString(),
    };
  });
}

export async function getAccountForSessionToken(sessionToken) {
  if (!hasDatabaseConfig() || typeof sessionToken !== "string" || sessionToken.length === 0) {
    return null;
  }

  const sessionTokenHash = hashSessionToken(sessionToken);
  const rows = await query(
    `
      SELECT
        a.id,
        a.email,
        a.full_name,
        a.phone,
        a.role,
        a.status,
        a.created_at,
        s.id AS session_id,
        s.expires_at
      FROM user_sessions s
      INNER JOIN user_accounts a ON a.id = s.account_id
      WHERE s.session_token_hash = ?
      LIMIT 1
    `,
    [sessionTokenHash],
  );

  const row = rows[0];

  if (!row) {
    return null;
  }

  const expiresAt = new Date(row.expires_at);

  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    await deleteSessionByToken(sessionToken);
    return null;
  }

  if (row.status !== "active") {
    return null;
  }

  return normalizeAccount(row);
}

export async function deleteSessionByToken(sessionToken) {
  if (!hasDatabaseConfig() || typeof sessionToken !== "string" || sessionToken.length === 0) {
    return false;
  }

  const sessionTokenHash = hashSessionToken(sessionToken);
  const result = await query("DELETE FROM user_sessions WHERE session_token_hash = ?", [
    sessionTokenHash,
  ]);

  return Boolean(result.affectedRows);
}
