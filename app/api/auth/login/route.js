
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "../../../../lib/db";
import {
  createSessionToken,
  SESSION_COOKIE,
} from "../../../../lib/auth";

const validRoles = ["admin", "tutor", "orang_tua"];

export async function POST(request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (
      !email ||
      email.length > 150 ||
      !password ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return NextResponse.json(
        { message: "Email atau password tidak valid." },
        { status: 400 }
      );
    }

    const [rows] = await db.execute(
      `SELECT id, nama, email, password, role
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const user = rows[0];

    // Gunakan pesan yang sama agar tidak membocorkan
    // apakah sebuah email terdaftar.
    if (!user || !validRoles.includes(user.role)) {
      return NextResponse.json(
        { message: "Email atau password salah." },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValid) {
      return NextResponse.json(
        { message: "Email atau password salah." },
        { status: 401 }
      );
    }

    const token = await createSessionToken(user);

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error.message);

    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
