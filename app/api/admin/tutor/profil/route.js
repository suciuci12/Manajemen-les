
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Silakan login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    if (user.role !== "tutor") {
      return NextResponse.json(
        {
          success: false,
          message: "Akses hanya untuk tutor.",
        },
        { status: 403 }
      );
    }

    const [rows] = await db.execute(
      `SELECT id, nama, email, role
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Data akun tutor tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("GET profil tutor:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil profil tutor.",
      },
      { status: 500 }
    );
  }
}
