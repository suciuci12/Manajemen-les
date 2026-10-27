
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";


function gagal(message, status = 400) {
  return NextResponse.json({ message }, { status });
}

function tanggalValid(value) {
  if (typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

function jamValid(value) {
  return typeof value === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value);
}

function waktu(value) {
  return value.length === 5 ? `${value}:00` : value;
}

async function tutorLogin() {
  const user = await getSession();

  if (!user) {
    return { error: gagal("Silakan login terlebih dahulu.", 401) };
  }

  if (user.role !== "tutor") {
    return { error: gagal("Akses hanya untuk tutor.", 403) };
  }

  return { user };
}

export async function GET() {
  try {
    const auth = await tutorLogin();
    if (auth.error) return auth.error;

    const [rows] = await db.execute(
      `SELECT
         jl.id,
         jl.peserta_id,
         jl.tutor_user_id,
         jl.mata_pelajaran_id,
         DATE_FORMAT(jl.tanggal, '%Y-%m-%d') AS tanggal,
         TIME_FORMAT(jl.jam_mulai, '%H:%i') AS jam_mulai,
         TIME_FORMAT(jl.jam_selesai, '%H:%i') AS jam_selesai,
         jl.lokasi,
         p.nama AS nama_peserta,
         mp.nama AS nama_mata_pelajaran
       FROM jadwal_les jl
       INNER JOIN peserta p ON p.id = jl.peserta_id
       LEFT JOIN mata_pelajaran mp ON mp.id = jl.mata_pelajaran_id
       WHERE jl.tutor_user_id = ?
       ORDER BY jl.tanggal ASC, jl.jam_mulai ASC`,
      [auth.user.id]
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Gagal mengambil jadwal tutor:", error);
    return gagal("Terjadi kesalahan saat mengambil jadwal.", 500);
  }
}

export async function PUT(request) {
  const auth = await tutorLogin();
  if (auth.error) return auth.error;

  let body;

  try {
    body = await request.json();
  } catch {
    return gagal("Data yang dikirim tidak valid.");
  }

  const id = Number(body.id);
  const tanggalBaru = body.tanggal;
  const mulaiBaru = body.jam_mulai;
  const selesaiBaru = body.jam_selesai;
  const alasan = typeof body.alasan === "string"
    ? body.alasan.trim()
    : "";

  if (!Number.isSafeInteger(id) || id < 1) {
    return gagal("ID jadwal tidak valid.");
  }

  if (!tanggalValid(tanggalBaru)) {
    return gagal("Tanggal jadwal tidak valid.");
  }

  if (!jamValid(mulaiBaru) || !jamValid(selesaiBaru)) {
    return gagal("Format jam harus HH:mm.");
  }

  const mulai = waktu(mulaiBaru);
  const selesai = waktu(selesaiBaru);

  if (mulai >= selesai) {
    return gagal("Jam selesai harus setelah jam mulai.");
  }

  if (!alasan || alasan.length > 1000) {
    return gagal("Alasan perubahan wajib diisi, maksimal 1000 karakter.");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Kunci jadwal yang sedang diubah dan pastikan milik tutor login.
    const [jadwalRows] = await connection.execute(
      `SELECT id, peserta_id, tutor_user_id, tanggal,
              jam_mulai, jam_selesai
       FROM jadwal_les
       WHERE id = ? AND tutor_user_id = ?
       FOR UPDATE`,
      [id, auth.user.id]
    );

    if (jadwalRows.length === 0) {
      await connection.rollback();
      return gagal("Jadwal tidak ditemukan atau bukan milik Anda.", 404);
    }

    const lama = jadwalRows[0];
    const tanggalLama =
      typeof lama.tanggal === "string"
        ? lama.tanggal.slice(0, 10)
        : lama.tanggal.toISOString().slice(0, 10);

    const mulaiLama = String(lama.jam_mulai).slice(0, 8);
    const selesaiLama = String(lama.jam_selesai).slice(0, 8);

    const berubah =
      tanggalLama !== tanggalBaru ||
      mulaiLama.slice(0, 5) !== mulai.slice(0, 5) ||
      selesaiLama.slice(0, 5) !== selesai.slice(0, 5);

    if (!berubah) {
      await connection.rollback();
      return gagal("Tidak ada perubahan tanggal atau waktu.");
    }

    // Cek bentrok tutor ATAU peserta pada tanggal dan rentang waktu baru.
    // Kondisi overlap: waktu lama mulai < waktu baru selesai,
    // dan waktu lama selesai > waktu baru mulai.
    const [bentrok] = await connection.execute(
      `SELECT id, tutor_user_id, peserta_id
       FROM jadwal_les
       WHERE id <> ?
         AND tanggal = ?
         AND (tutor_user_id = ? OR peserta_id = ?)
         AND jam_mulai < ?
         AND jam_selesai > ?
       LIMIT 1
       FOR UPDATE`,
      [
        id,
        tanggalBaru,
        auth.user.id,
        lama.peserta_id,
        selesai,
        mulai,
      ]
    );

    if (bentrok.length > 0) {
      await connection.rollback();
      return gagal(
        "Jadwal bentrok dengan jadwal lain milik tutor atau peserta pada waktu tersebut.",
        409
      );
    }

    // Catat nilai lama dan baru dalam transaksi yang sama.
    await connection.execute(
      `INSERT INTO jadwal_les_riwayat (
         jadwal_id,
         tutor_user_id,
         tanggal_lama,
         jam_mulai_lama,
         jam_selesai_lama,
         tanggal_baru,
         jam_mulai_baru,
         jam_selesai_baru,
         alasan
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        auth.user.id,
        tanggalLama,
        mulaiLama,
        selesaiLama,
        tanggalBaru,
        mulai,
        selesai,
        alasan,
      ]
    );

    await connection.execute(
      `UPDATE jadwal_les
       SET tanggal = ?, jam_mulai = ?, jam_selesai = ?
       WHERE id = ? AND tutor_user_id = ?`,
      [tanggalBaru, mulai, selesai, id, auth.user.id]
    );

    await connection.commit();

    return NextResponse.json({
      message: "Jadwal berhasil diubah dan riwayat telah disimpan.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Gagal mengubah jadwal tutor:", error);
    return gagal("Terjadi kesalahan saat menyimpan perubahan jadwal.", 500);
  } finally {
    connection.release();
  }
}
