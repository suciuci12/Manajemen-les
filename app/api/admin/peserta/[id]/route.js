
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

async function checkAdmin() {
  const user = await getSession();
  return user?.role === "admin";
}

function validId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PUT(request, { params }) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const { id: rawId } = await params;
    const id = validId(rawId);

    if (!id) {
      return NextResponse.json(
        { message: "ID peserta tidak valid." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const nama =
      typeof body.nama === "string" ? body.nama.trim() : "";
    const sekolah =
      typeof body.sekolah === "string" ? body.sekolah.trim() : "";
    const tanggalLahir =
      typeof body.tanggal_lahir === "string"
        ? body.tanggal_lahir
        : "";
    const parentUserId =
      body.parent_user_id === "" ||
      body.parent_user_id === null ||
      body.parent_user_id === undefined
        ? null
        : Number(body.parent_user_id);

    if (!nama || nama.length > 100 || sekolah.length > 150) {
      return NextResponse.json(
        { message: "Nama atau sekolah tidak valid." },
        { status: 400 }
      );
    }

    if (tanggalLahir) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahir)) {
        return NextResponse.json(
          { message: "Format tanggal lahir tidak valid." },
          { status: 400 }
        );
      }

      const date = new Date(`${tanggalLahir}T00:00:00Z`);

      if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== tanggalLahir
      ) {
        return NextResponse.json(
          { message: "Tanggal lahir tidak valid." },
          { status: 400 }
        );
      }
    }

    if (
      parentUserId !== null &&
      (!Number.isSafeInteger(parentUserId) || parentUserId < 1)
    ) {
      return NextResponse.json(
        { message: "Akun orang tua tidak valid." },
        { status: 400 }
      );
    }

    if (parentUserId !== null) {
      const [parents] = await db.execute(
        "SELECT id FROM users WHERE id = ? AND role = 'orang_tua' LIMIT 1",
        [parentUserId]
      );

      if (parents.length === 0) {
        return NextResponse.json(
          { message: "Akun orang tua tidak ditemukan." },
          { status: 400 }
        );
      }
    }

    const [result] = await db.execute(
      `UPDATE peserta
       SET nama = ?, tanggal_lahir = ?, sekolah = ?, parent_user_id = ?
       WHERE id = ?`,
      [
        nama,
        tanggalLahir || null,
        sekolah || null,
        parentUserId,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Peserta tidak ditemukan atau tidak ada perubahan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Data peserta berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PUT peserta:", error.message);

    return NextResponse.json(
      { message: "Gagal memperbarui data peserta." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const { id: rawId } = await params;
    const id = validId(rawId);

    if (!id) {
      return NextResponse.json(
        { message: "ID peserta tidak valid." },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      "DELETE FROM peserta WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { message: "Peserta tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Peserta berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE peserta:", error.message);

    return NextResponse.json(
      {
        message:
          "Gagal menghapus peserta. Periksa apakah peserta sudah memiliki jadwal atau presensi.",
      },
      { status: 500 }
    );
  }
}
