
import { NextResponse } from "next/server";
import  db from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Periksa sesi pengguna
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { message: "Akses ditolak" },
        { status: 401 }
      );
    }

    // Hitung total peserta
    const [peserta] = await db.query(
      "SELECT COUNT(*) AS total FROM peserta"
    );

    return NextResponse.json({
      totalPeserta: Number(peserta[0].total),
    });
  } catch (error) {
    console.error("Gagal mengambil statistik:", error);

    return NextResponse.json(
      { message: "Gagal mengambil statistik dashboard" },
      { status: 500 }
    );
  }
}
