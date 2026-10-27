
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

async function ambilDaftarOrangTua() {
  const [rows] = await db.execute(`
    SELECT id, nama, email
    FROM users
    WHERE role = 'orang_tua'
    ORDER BY nama ASC
  `);

  return rows;
}

async function adminDiizinkan() {
  const user = await getSession();
  return Boolean(user && user.role === "admin");
}

function tanggalValid(tanggal) {
  if (!tanggal) return true;
  if (typeof tanggal !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return false;

  const date = new Date(`${tanggal}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === tanggal
  );
}

function idValid(id) {
  const angka = Number(id);
  return Number.isSafeInteger(angka) && angka > 0;
}

async function orangTuaValid(parentUserId) {
  if (parentUserId === null) return true;

  const [rows] = await db.execute(
    "SELECT id FROM users WHERE id = ? AND role = 'orang_tua' LIMIT 1",
    [parentUserId]
  );

  return rows.length > 0;
}

// MENAMPILKAN DATA PESERTA
export async function GET() {
  try {
    if (!(await adminDiizinkan())) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const [rows] = await db.execute(`
      SELECT
        p.id,
        p.nama,
        p.tanggal_lahir,
        p.sekolah,
        p.parent_user_id,
        u.nama AS nama_orang_tua,
        u.email AS email_orang_tua
      FROM peserta p
      LEFT JOIN users u ON p.parent_user_id = u.id
      ORDER BY p.id DESC
    `);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("GET peserta:", error.message);

    return NextResponse.json(
      { message: "Gagal mengambil data peserta." },
      { status: 500 }
    );
  }
}

// MENAMBAHKAN PESERTA
export async function POST(request) {
  try {
    if (!(await adminDiizinkan())) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const nama =
      typeof body.nama === "string" ? body.nama.trim() : "";

    const sekolah =
      typeof body.sekolah === "string" ? body.sekolah.trim() : "";

    const tanggalLahir = body.tanggal_lahir || "";

    const parentUserId =
      body.parent_user_id === "" ||
      body.parent_user_id === null ||
      body.parent_user_id === undefined
        ? null
        : Number(body.parent_user_id);

    if (!nama || nama.length > 100) {
      return NextResponse.json(
        { message: "Nama wajib diisi, maksimal 100 karakter." },
        { status: 400 }
      );
    }

    if (sekolah.length > 150) {
      return NextResponse.json(
        { message: "Nama sekolah maksimal 150 karakter." },
        { status: 400 }
      );
    }

    if (!tanggalValid(tanggalLahir)) {
      return NextResponse.json(
        { message: "Tanggal lahir tidak valid." },
        { status: 400 }
      );
    }

    if (
      parentUserId !== null &&
      (!idValid(parentUserId) || !(await orangTuaValid(parentUserId)))
    ) {
      return NextResponse.json(
        { message: "Akun orang tua tidak valid atau tidak ditemukan." },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      `INSERT INTO peserta
        (nama, tanggal_lahir, sekolah, parent_user_id)
       VALUES (?, ?, ?, ?)`,
      [nama, tanggalLahir || null, sekolah || null, parentUserId]
    );

    return NextResponse.json(
      {
        message: "Peserta berhasil ditambahkan.",
        id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST peserta:", error.message);

    return NextResponse.json(
      { message: "Gagal menambahkan peserta." },
      { status: 500 }
    );
  }
}

// MEMPERBARUI PESERTA
export async function PUT(request) {
  try {
    if (!(await adminDiizinkan())) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const id = Number(body.id);

    const nama =
      typeof body.nama === "string" ? body.nama.trim() : "";

    const sekolah =
      typeof body.sekolah === "string" ? body.sekolah.trim() : "";

    const tanggalLahir = body.tanggal_lahir || "";

    const parentUserId =
      body.parent_user_id === "" ||
      body.parent_user_id === null ||
      body.parent_user_id === undefined
        ? null
        : Number(body.parent_user_id);

    if (!idValid(id)) {
      return NextResponse.json(
        { message: "ID peserta tidak valid." },
        { status: 400 }
      );
    }

    if (!nama || nama.length > 100) {
      return NextResponse.json(
        { message: "Nama wajib diisi, maksimal 100 karakter." },
        { status: 400 }
      );
    }

    if (sekolah.length > 150) {
      return NextResponse.json(
        { message: "Nama sekolah maksimal 150 karakter." },
        { status: 400 }
      );
    }

    if (!tanggalValid(tanggalLahir)) {
      return NextResponse.json(
        { message: "Tanggal lahir tidak valid." },
        { status: 400 }
      );
    }

    if (
      parentUserId !== null &&
      (!idValid(parentUserId) || !(await orangTuaValid(parentUserId)))
    ) {
      return NextResponse.json(
        { message: "Akun orang tua tidak valid atau tidak ditemukan." },
        { status: 400 }
      );
    }

    const [existing] = await db.execute(
      "SELECT id FROM peserta WHERE id = ? LIMIT 1",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { message: "Data peserta tidak ditemukan." },
        { status: 404 }
      );
    }

    await db.execute(
      `UPDATE peserta
       SET nama = ?, tanggal_lahir = ?, sekolah = ?, parent_user_id = ?
       WHERE id = ?`,
      [nama, tanggalLahir || null, sekolah || null, parentUserId, id]
    );

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

// MENGHAPUS PESERTA
export async function DELETE(request) {
  try {
    if (!(await adminDiizinkan())) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const id = Number(body.id);

    if (!idValid(id)) {
      return NextResponse.json(
        { message: "ID peserta tidak valid." },
        { status: 400 }
      );
    }

    const [existing] = await db.execute(
      "SELECT id FROM peserta WHERE id = ? LIMIT 1",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { message: "Data peserta tidak ditemukan." },
        { status: 404 }
      );
    }

    await db.execute("DELETE FROM peserta WHERE id = ?", [id]);

    return NextResponse.json({
      message: "Data peserta berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE peserta:", error.message);

    return NextResponse.json(
      {
        message:
          "Gagal menghapus peserta. Periksa apakah data peserta masih digunakan oleh jadwal atau presensi.",
      },
      { status: 500 }
    );
  }
}
