
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });

  let connection;

  try {
    const nama = (await rl.question("Nama admin: ")).trim();
    const email = (
      await rl.question("Email admin: ")
    ).trim().toLowerCase();

    const password = await rl.question("Password admin: ");

    if (!nama || nama.length > 100) {
      throw new Error("Nama wajib diisi, maksimal 100 karakter.");
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 150
    ) {
      throw new Error("Format email tidak valid.");
    }

    if (
      password.length < 6 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      throw new Error(
        "Password harus minimal 12 karakter dan maksimal 72 byte."
      );
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "db_manajemen_les",
    });

    const [existing] = await connection.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      throw new Error(
        "Email sudah terdaftar. Tidak ada akun yang diubah."
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await connection.execute(
      `INSERT INTO users (nama, email, password, role)
       VALUES (?, ?, ?, 'admin')`,
      [nama, email, passwordHash]
    );

    console.log("Akun admin berhasil dibuat.");
    console.log("Email:", email);
    console.log("Role: admin");
  } finally {
    rl.close();

    if (connection) {
      await connection.end();
    }
  }
}

main().catch((error) => {
  console.error("Gagal membuat admin:", error.message);
  process.exitCode = 1;
});
