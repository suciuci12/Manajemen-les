import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT DATABASE() AS database_name, NOW() AS server_time"
    );

    return NextResponse.json({
      success: true,
      message: "Koneksi database berhasil",
      data: rows[0],
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    return NextResponse.json(
      {
        success: false,
        message: "Koneksi database gagal",
      },
      { status: 500 }
    );
  }
}
