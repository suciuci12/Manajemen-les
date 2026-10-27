
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSession } from "@/lib/auth";

const FORMAT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(request) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const foto = formData.get("foto");

    if (!foto || typeof foto.arrayBuffer !== "function") {
      return NextResponse.json(
        { success: false, message: "Pilih foto terlebih dahulu." },
        { status: 400 }
      );
    }

    const ekstensi = FORMAT[foto.type];

    if (!ekstensi) {
      return NextResponse.json(
        {
          success: false,
          message: "Foto harus berformat JPG, PNG, atau WebP.",
        },
        { status: 400 }
      );
    }

    if (foto.size <= 0 || foto.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Ukuran foto maksimal 5 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await foto.arrayBuffer());

    const valid =
      (foto.type === "image/jpeg" &&
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff) ||
      (foto.type === "image/png" &&
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(
          Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
        )) ||
      (foto.type === "image/webp" &&
        buffer.length >= 12 &&
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP");

    if (!valid) {
      return NextResponse.json(
        { success: false, message: "File gambar tidak valid." },
        { status: 400 }
      );
    }

    const folder = path.join(
      process.cwd(),
      "public",
      "uploads",
      "presensi"
    );

    await mkdir(folder, { recursive: true });

    const namaFile = `${randomUUID()}${ekstensi}`;

    await writeFile(path.join(folder, namaFile), buffer, {
      flag: "wx",
    });

    return NextResponse.json({
      success: true,
      message: "Foto berhasil diunggah.",
      path: `/uploads/presensi/${namaFile}`,
    });
  } catch (error) {
    console.error("Upload foto:", error);

    return NextResponse.json(
      { success: false, message: "Gagal mengunggah foto." },
      { status: 500 }
    );
  }
}
