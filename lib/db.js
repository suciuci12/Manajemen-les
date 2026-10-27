
import mysql from "mysql2/promise";

const sslCaBase64 = process.env.DB_SSL_CA_BASE64;

if (!sslCaBase64) {
  throw new Error("Environment variable DB_SSL_CA_BASE64 belum diatur.");
}

const sslCa = Buffer.from(
  sslCaBase64.trim(),
  "base64"
).toString("utf8");

if (!sslCa.includes("-----BEGIN CERTIFICATE-----")) {
  throw new Error("Isi DB_SSL_CA_BASE64 bukan sertifikat PEM yang valid.");
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "defaultdb",

  ssl: {
    ca: sslCa,
    rejectUnauthorized: true,
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
