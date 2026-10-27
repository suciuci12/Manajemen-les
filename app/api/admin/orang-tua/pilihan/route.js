import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const [rows] = await pool.query(`
      SELECT id, nama, email
      FROM users
      WHERE role = 'orang_tua'
      ORDER BY nama ASC
    `);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("GET pilihan orang tua:", error);

    return NextResponse.json(
      { message: "Gagal mengambil daftar orang tua." },
      { status: 500 }
    );
  }
}