import dns from "dns";
import mongoose from "mongoose";

mongoose.set("bufferCommands", false);

if (!globalThis.__mrCreativistMongo) {
  globalThis.__mrCreativistMongo = {
    conn: null,
    promise: null
  };
}

export function hasMongoConfig() {
  return Boolean(getMongoConnectionString());
}

export function getMongoConnectionEnvName() {
  if (String(process.env.MONGODB_URI ?? "").trim()) return "MONGODB_URI";
  if (String(process.env.DATABASE_URL ?? "").trim()) return "DATABASE_URL";
  return null;
}

export function getMongoConnectionString() {
  return process.env.MONGODB_URI || process.env.DATABASE_URL || "";
}

function envBoolean(name, defaultValue = false) {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) return defaultValue;
  return ["1", "true", "yes", "on"].includes(value);
}

function encodeMongoCredential(value) {
  try {
    return encodeURIComponent(decodeURIComponent(value));
  } catch {
    return encodeURIComponent(value);
  }
}

function normalizedMongoUri(value) {
  const uri = String(value ?? "").trim().replace(/^['"]|['"]$/g, "");
  const prefixMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)/i);
  if (!prefixMatch || !uri.includes("@")) return uri;

  try {
    new URL(uri);
    return uri;
  } catch {
    const prefix = prefixMatch[1];
    const restWithCredentials = uri.slice(prefix.length);
    const atIndex = restWithCredentials.lastIndexOf("@");
    if (atIndex <= 0) return uri;

    const credentials = restWithCredentials.slice(0, atIndex);
    const rest = restWithCredentials.slice(atIndex + 1);
    const colonIndex = credentials.indexOf(":");
    if (colonIndex < 0) return uri;

    const username = credentials.slice(0, colonIndex);
    const password = credentials.slice(colonIndex + 1);

    return `${prefix}${encodeMongoCredential(username)}:${encodeMongoCredential(password)}@${rest}`;
  }
}

function shouldUseTls(mongodbUri) {
  if (envBoolean("MONGODB_TLS", false)) return true;
  if (process.env.MONGODB_TLS?.trim().toLowerCase() === "false") return false;
  if (/^mongodb\+srv:\/\//i.test(mongodbUri)) return true;
  if (/[?&](tls|ssl)=true/i.test(mongodbUri)) return true;
  if (/mongodb\.net|cosmos\.azure\.com|docdb\.amazonaws\.com/i.test(mongodbUri)) return true;

  return false;
}

function mongoTlsOptions(mongodbUri) {
  const tls = shouldUseTls(mongodbUri);
  const options = { tls };

  if (!tls) return options;

  if (envBoolean("MONGODB_TLS_INSECURE", false)) {
    options.tlsInsecure = true;
    return options;
  }

  if (envBoolean("MONGODB_TLS_ALLOW_INVALID_CERTIFICATES", false)) {
    options.tlsAllowInvalidCertificates = true;
  }

  return options;
}

export function isMongoConnectionError(error) {
  const message = String(error?.message ?? error ?? "");

  return (
    error?.name === "MongooseServerSelectionError" ||
    error?.name === "MongoServerSelectionError" ||
    /MONGODB_URI|DATABASE_URL is not configured|tls|ssl|alert|server selection|ENOTFOUND|ECONNREFUSED|ETIMEOUT|querySrv/i.test(message)
  );
}

export function friendlyMongoError(error) {
  const message = String(error?.message ?? error ?? "");

  if (/tlsInsecure.*tlsAllowInvalidCertificates|tlsAllowInvalidCertificates.*tlsInsecure/i.test(message)) {
    return "MongoDB TLS configuration is invalid. Use either MONGODB_TLS_INSECURE or MONGODB_TLS_ALLOW_INVALID_CERTIFICATES, not both.";
  }

  if (/tlsv1 alert internal error|SSL alert number 80/i.test(message)) {
    return "MongoDB Atlas rejected the TLS handshake. Check the Atlas Network Access IP allowlist and verify MONGODB_URI or DATABASE_URL.";
  }

  if (isMongoConnectionError(error)) {
    return "Database connection is temporarily unavailable. Check MONGODB_URI or DATABASE_URL, TLS settings, network access, and Atlas IP allowlist.";
  }

  return message || "Database connection failed.";
}

export async function connectMongoDB() {
  const mongodbUri = normalizedMongoUri(getMongoConnectionString());
  const mongodbDb = process.env.MONGODB_DB || "platform_db";
  const dnsServers =
    process.env.MONGODB_DNS_SERVERS ||
    (mongodbUri?.startsWith("mongodb+srv://") ? "8.8.8.8,1.1.1.1" : "");

  if (!mongodbUri) {
    throw new Error("MONGODB_URI or DATABASE_URL is not configured.");
  }

  if (dnsServers) {
    dns.setServers(
      dnsServers
        .split(",")
        .map((server) => server.trim())
        .filter(Boolean)
    );
  }

  if (globalThis.__mrCreativistMongo.conn) {
    return globalThis.__mrCreativistMongo.conn;
  }

  if (!globalThis.__mrCreativistMongo.promise) {
    globalThis.__mrCreativistMongo.promise = mongoose.connect(mongodbUri, {
      dbName: mongodbDb,
      bufferCommands: false,
      maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE ?? 10),
      serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? 3000),
      connectTimeoutMS: Number(process.env.MONGODB_CONNECT_TIMEOUT_MS ?? 3000),
      socketTimeoutMS: Number(process.env.MONGODB_SOCKET_TIMEOUT_MS ?? 45000),
      retryWrites: process.env.MONGODB_RETRY_WRITES?.trim().toLowerCase() === "false" ? false : true,
      ...mongoTlsOptions(mongodbUri)
    }).catch((error) => {
      globalThis.__mrCreativistMongo.promise = null;
      globalThis.__mrCreativistMongo.conn = null;
      throw error;
    });
  }

  globalThis.__mrCreativistMongo.conn = await globalThis.__mrCreativistMongo.promise;

  return globalThis.__mrCreativistMongo.conn;
}

export default connectMongoDB;
