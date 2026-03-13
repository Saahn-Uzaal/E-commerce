import mysql from "mysql2/promise";

const requiredVariables = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];

export function hasDatabaseConfig() {
  return requiredVariables.every((key) => Boolean(process.env[key]));
}

function getPoolFromGlobal() {
  return globalThis.__gettsayDbState ?? null;
}

function setPoolOnGlobal(state) {
  globalThis.__gettsayDbState = state;
  return state;
}

function getDatabaseConfig() {
  if (!hasDatabaseConfig()) {
    throw new Error("Database environment variables are missing.");
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === "true" ? {} : undefined,
  };
}

function getConfigSignature(config) {
  return JSON.stringify({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: Boolean(config.ssl),
  });
}

async function resetPoolState(previousState) {
  if (!previousState?.pool) {
    return;
  }

  try {
    await previousState.pool.end();
  } catch {
    // Ignore pool shutdown errors and allow a fresh pool to be created.
  }
}

export async function getPool() {
  const config = getDatabaseConfig();
  const signature = getConfigSignature(config);
  const existingState = getPoolFromGlobal();

  if (existingState?.pool && existingState.signature === signature) {
    return existingState.pool;
  }

  await resetPoolState(existingState);

  return setPoolOnGlobal({
    signature,
    pool: mysql.createPool(config),
  }).pool;
}

export async function query(sql, params = []) {
  const pool = await getPool();

  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    if (error?.code === "ER_ACCESS_DENIED_ERROR") {
      await resetPoolState(getPoolFromGlobal());
      globalThis.__gettsayDbState = null;
    }

    throw error;
  }
}

export async function withTransaction(callback) {
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function pingDatabase() {
  if (!hasDatabaseConfig()) {
    return false;
  }

  await query("SELECT 1");
  return true;
}
