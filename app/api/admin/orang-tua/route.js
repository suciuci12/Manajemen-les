import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

async function cekAdmin() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    return false;
  }

  return true;
}

function respons(data, status = 200) {
  return NextResponse.json(data, { status });
}

// GET: Mengambil data orang tua
export async function GET() {
  try {
    if (!(await cekAdmin())) {
      return respons(
        { success: false, message: "Akses hanya untuk admin." },
        403
      );
    }

    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.nama,
        u.email,
        COUNT(DISTINCT p.id) AS total_anak
      FROM users u
      LEFT JOIN peserta p ON p.parent_user_id = u.id
      WHERE u.role = 'orang_tua'
      GROUP BY u.id, u.nama, u.email
      ORDER BY u.nama ASC
    `);

    return respons({
      success: true,
      data: rows.map((item) => ({
        ...item,
        total_anak: Number(item.total_anak || 0),
      })),
    });
  } catch (error) {
    console.error("GET orang tua:", error);

    return respons(
      {
        success: false,
        message: "Gagal mengambil data orang tua.",
      },
      500
    );
  }
}

// POST: Menambahkan akun orang tua
export async function POST(request) {
  try {
    if (!(await cekAdmin())) {
      return respons(
        { success: false, message: "Akses hanya untuk admin." },
        403
      );
    }

    const body = await request.json();
    const nama = String(body.nama || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!nama || !email || !password) {
      return respons(
        {
          success: false,
          message: "Nama, email, dan kata sandi wajib diisi.",
        },
        400
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return respons(
        { success: false, message: "Format email tidak valid." },
        400
      );
    }

    if (password.length < 8) {
      return respons(
        {
          success: false,
          message: "Kata sandi minimal 8 karakter.",
        },
        400
      );
    }

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      return respons(
        { success: false, message: "Email sudah terdaftar." },
        409
      );
    }

    const hashPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      `INSERT INTO users (nama, email, password, role)
       VALUES (?, ?, ?, 'orang_tua')`,
      [nama, email, hashPassword]
    );

    return respons(
      {
        success: true,
        message: "Akun orang tua berhasil ditambahkan.",
        data: {
          id: result.insertId,
          nama,
          email,
          total_anak: 0,
        },
      },
      201
    );
  } catch (error) {
    console.error("POST orang tua:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return respons(
        { success: false, message: "Email sudah digunakan." },
        409
      );
    }

    return respons(
      {
        success: false,
        message:
          "Gagal menyimpan akun. Periksa struktur tabel users dan terminal Next.js.",
      },
      500
    );
  }
}

// PUT: Mengedit akun orang tua
export async function PUT(request) {
  try {
    if (!(await cekAdmin())) {
      return respons(
        { success: false, message: "Akses hanya untuk admin." },
        403
      );
    }

    const body = await request.json();
    const id = Number(body.id);
    const nama = String(body.nama || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!Number.isInteger(id) || id <= 0 || !nama || !email) {
      return respons(
        {
          success: false,
          message: "ID, nama, dan email harus diisi dengan benar.",
        },
        400
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return respons(
        { success: false, message: "Format email tidak valid." },
        400
      );
    }

    if (password && password.length < 8) {
      return respons(
        {
          success: false,
          message: "Kata sandi baru minimal 8 karakter.",
        },
        400
      );
    }

    const [target] = await pool.query(
      "SELECT id FROM users WHERE id = ? AND role = 'orang_tua' LIMIT 1",
      [id]
    );

    if (!target.length) {
      return respons(
        { success: false, message: "Akun orang tua tidak ditemukan." },
        404
      );
    }

    const [duplicate] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
      [email, id]
    );

    if (duplicate.length) {
      return respons(
        { success: false, message: "Email sudah digunakan akun lain." },
        409
      );
    }

    if (password) {
      const hashPassword = await bcrypt.hash(password, 12);

      await pool.query(
        `UPDATE users
         SET nama = ?, email = ?, password = ?
         WHERE id = ? AND role = 'orang_tua'`,
        [nama, email, hashPassword, id]
      );
    } else {
      await pool.query(
        `UPDATE users
         SET nama = ?, email = ?
         WHERE id = ? AND role = 'orang_tua'`,
        [nama, email, id]
      );
    }

    return respons({
      success: true,
      message: "Data orang tua berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PUT orang tua:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return respons(
        { success: false, message: "Email sudah digunakan." },
        409
      );
    }

    return respons(
      {
        success: false,
        message: "Gagal memperbarui data orang tua.",
      },
      500
    );
  }
}