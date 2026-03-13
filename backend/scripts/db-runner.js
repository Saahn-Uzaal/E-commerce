import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..", "..");
const defaultEnvPath = path.join(workspaceRoot, "frontend", ".env.local");

function loadEnvFile(filePath) {
  return fs
    .readFile(filePath, "utf8")
    .then((content) => {
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();

        if (!line || line.startsWith("#") || !line.includes("=")) {
          continue;
        }

        const separatorIndex = line.indexOf("=");
        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();

        if (key && process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    })
    .catch(() => undefined);
}

function replaceDatabaseName(sql) {
  const databaseName = process.env.DB_NAME?.trim();

  if (!databaseName || databaseName === "ecommerce_store") {
    return sql;
  }

  return sql.replaceAll("ecommerce_store", databaseName);
}

async function getSqlFiles(relativeDirectory) {
  const absoluteDirectory = path.join(workspaceRoot, relativeDirectory);
  const entries = await fs.readdir(absoluteDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => path.join(relativeDirectory, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

async function runSqlFile(relativePath) {
  const absolutePath = path.join(workspaceRoot, relativePath);
  const rawSql = await fs.readFile(absolutePath, "utf8");
  const sql = replaceDatabaseName(rawSql);

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
    ssl: process.env.DB_SSL === "true" ? {} : undefined,
  });

  try {
    await connection.query(sql);
    console.log(`Da chay xong: ${relativePath}`);
  } finally {
    await connection.end();
  }
}

async function getCommandFiles(command) {
  const migrationFiles = await getSqlFiles("backend/database/migrations");
  const seedFiles = await getSqlFiles("backend/database/seeds");

  if (command === "migrate" || command === "upgrade") {
    return migrationFiles;
  }

  if (command === "seed") {
    return seedFiles;
  }

  if (command === "setup") {
    return [...migrationFiles, ...seedFiles];
  }

  return [];
}

async function main() {
  const command = process.argv[2];
  const validCommands = ["migrate", "upgrade", "seed", "setup"];

  if (!validCommands.includes(command)) {
    console.error("Lenh khong hop le. Dung: migrate | upgrade | seed | setup");
    process.exitCode = 1;
    return;
  }

  await loadEnvFile(defaultEnvPath);

  const requiredVariables = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD"];
  const missingVariables = requiredVariables.filter((key) => !process.env[key]);

  if (missingVariables.length > 0) {
    console.error(`Thieu bien moi truong: ${missingVariables.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const filePaths = await getCommandFiles(command);

  for (const filePath of filePaths) {
    await runSqlFile(filePath);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
