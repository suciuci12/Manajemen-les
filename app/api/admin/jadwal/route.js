
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

async function periksaAdmin() {
  const session = await getSession();
  return Boolean(session && session.role === "admin");
}

function kirimError(pesan, status = 400) {
  return NextResponse.json({ pesan }, { status });
}

function nilaiAngkaValid(nilai) {
  return nilai !== undefined && nilai !== null && String(nilai).trim() !== ""
    && Number.isInteger(Number(nilai)) && Number(nilai) > 0;
}

function waktuKeMenit(waktu) {
  if (!waktu) return -1;

  const bagian = String(waktu).slice(0, 5).split(":");
  if (bagian.length !== 2) return -1;

  const jam = Number(bagian[0]);
  const menit = Number(bagian[1]);

  if (
    !Number.isInteger(jam) ||
    !Number.isInteger(menit) ||
    jam < 0 ||
    jam > 23 ||
    menit < 0 ||
    menit > 59
  ) {
    return -1;
  }

  return jam * 60 + menit;
}

function validasiForm(data) {
  const {
    peserta_id,
    tutor_user_id,
    mata_pelajaran_id,
    tanggal,
    jam_mulai,
    jam_selesai,
    lokasi,
  } = data;

  if (
    !nilaiAngkaValid(peserta_id) ||
    !nilaiAngkaValid(tutor_user_id) ||
    !nilaiAngkaValid(mata_pelajaran_id) ||
    !tanggal ||
    !jam_mulai ||
    !jam_selesai
  ) {
    return "Peserta, tutor, mata pelajaran, tanggal, dan waktu wajib diisi.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(tanggal))) {
    return "Format tanggal tidak valid.";
  }

  const mulai = waktuKeMenit(jam_mulai);
  const selesai = waktuKeMenit(jam_selesai);

  if (mulai < 0 || selesai < 0) {
    return "Format jam tidak valid.";
  }

  if (selesai <= mulai) {
    return "Jam selesai harus lebih besar dari jam mulai.";
  }

  if (lokasi && String(lokasi).length > 150) {
    return "Lokasi maksimal 150 karakter.";
  }

  return null;
}

async function ambilPilihan() {
  const [peserta] = await db.query(`
    SELECT id, nama
    FROM peserta
    ORDER BY nama ASC
  `);

  /*
   * tutor_user_id pada jadwal_les menggunakan users.id.
   * Karena itu, tutor harus memiliki akun users dengan role tutor.
   *
   * LEFT JOIN tetap memungkinkan akun tutor tampil meskipun profil
   * tutor belum ditemukan, selama akun tersebut ber-role tutor.
   * Jika profilnya ada dan statusnya Tidak Aktif, tutor tidak ditampilkan.
   */
  const [tutor] = await db.query(`
    SELECT
      u.id,
      COALESCE(NULLIF(t.nama, ''), u.nama) AS nama
    FROM users u
    LEFT JOIN tutor t ON t.user_id = u.id
    WHERE u.role = 'tutor'
      AND (t.id IS NULL OR t.status = 'Aktif')
    ORDER BY COALESCE(NULLIF(t.nama, ''), u.nama) ASC
  `);

  const [mataPelajaran] = await db.query(`
    SELECT id, nama
    FROM mata_pelajaran
    ORDER BY nama ASC
  `);

  return { peserta, tutor, mataPelajaran };
}

async function ambilDaftarJadwal() {
  const [data] = await db.query(`
    SELECT
      j.id,
      j.peserta_id,
      j.tutor_user_id,
      j.mata_pelajaran_id,
      DATE_FORMAT(j.tanggal, '%Y-%m-%d') AS tanggal,
      TIME_FORMAT(j.jam_mulai, '%H:%i') AS jam_mulai,
      TIME_FORMAT(j.jam_selesai, '%H:%i') AS jam_selesai,
      j.lokasi,
      p.nama AS nama_peserta,
      COALESCE(NULLIF(t.nama, ''), u.nama) AS nama_tutor,
      mp.nama AS nama_mata_pelajaran
    FROM jadwal_les j
    INNER JOIN peserta p ON p.id = j.peserta_id
    INNER JOIN users u ON u.id = j.tutor_user_id
    LEFT JOIN tutor t ON t.user_id = u.id
    INNER JOIN mata_pelajaran mp ON mp.id = j.mata_pelajaran_id
    ORDER BY j.tanggal DESC, j.jam_mulai DESC
  `);

  return data;
}

async function validasiRelasi(data) {
  const [daftarPeserta] = await db.query(
    "SELECT id FROM peserta WHERE id = ? LIMIT 1",
    [Number(data.peserta_id)]
  );

  if (daftarPeserta.length === 0) {
    return "Peserta yang dipilih tidak ditemukan.";
  }

  const [daftarTutor] = await db.query(
    `
      SELECT u.id
      FROM users u
      LEFT JOIN tutor t ON t.user_id = u.id
      WHERE u.id = ?
        AND u.role = 'tutor'
        AND (t.id IS NULL OR t.status = 'Aktif')
      LIMIT 1
    `,
    [Number(data.tutor_user_id)]
  );

  if (daftarTutor.length === 0) {
    return "Tutor tidak ditemukan, tidak memiliki peran tutor, atau sedang tidak aktif.";
  }

  const [daftarMapel] = await db.query(
    "SELECT id FROM mata_pelajaran WHERE id = ? LIMIT 1",
    [Number(data.mata_pelajaran_id)]
  );

  if (daftarMapel.length === 0) {
    return "Mata pelajaran yang dipilih tidak ditemukan.";
  }

  return null;
}

// GET: daftar jadwal dan pilihan untuk formulir.
export async function GET() {
  try {
    if (!(await periksaAdmin())) {
      return kirimError("Akses ditolak. Silakan masuk sebagai admin.", 403);
    }

    const [data, pilihan] = await Promise.all([
      ambilDaftarJadwal(),
      ambilPilihan(),
    ]);

    return NextResponse.json({
      data,
      peserta: pilihan.peserta,
      tutor: pilihan.tutor,
      mataPelajaran: pilihan.mataPelajaran,
    });
  } catch (error) {
    console.error("GET /api/admin/jadwal:", error);
    return kirimError("Gagal mengambil data jadwal. Periksa struktur database.", 500);
  }
}

// POST: tambah jadwal.
export async function POST(request) {
  try {
    if (!(await periksaAdmin())) {
      return kirimError("Akses ditolak. Silakan masuk sebagai admin.", 403);
    }

    const body = await request.json();
    const kesalahan = validasiForm(body);

    if (kesalahan) {
      return kirimError(kesalahan);
    }

    const relasiError = await validasiRelasi(body);

    if (relasiError) {
      return kirimError(relasiError);
    }

    const {
      peserta_id,
      tutor_user_id,
      mata_pelajaran_id,
      tanggal,
      jam_mulai,
      jam_selesai,
      lokasi,
    } = body;

    const [hasil] = await db.query(
      `
        INSERT INTO jadwal_les
          (
            peserta_id,
            tutor_user_id,
            mata_pelajaran_id,
            tanggal,
            jam_mulai,
            jam_selesai,
            lokasi
          )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        Number(peserta_id),
        Number(tutor_user_id),
        Number(mata_pelajaran_id),
        tanggal,
        jam_mulai,
        jam_selesai,
        lokasi ? String(lokasi).trim() : null,
      ]
    );

    return NextResponse.json(
      {
        pesan: "Jadwal berhasil ditambahkan.",
        id: hasil.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/jadwal:", error);

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return kirimError("Data peserta, tutor, atau mata pelajaran tidak sesuai dengan database.", 400);
    }

    return kirimError("Gagal menambahkan jadwal.", 500);
  }
}

// PUT: ubah jadwal.
export async function PUT(request) {
  try {
    if (!(await periksaAdmin())) {
      return kirimError("Akses ditolak. Silakan masuk sebagai admin.", 403);
    }

    const body = await request.json();
    const { id } = body;

    if (!nilaiAngkaValid(id)) {
      return kirimError("ID jadwal tidak valid.");
    }

    const kesalahan = validasiForm(body);

    if (kesalahan) {
      return kirimError(kesalahan);
    }

    const relasiError = await validasiRelasi(body);

    if (relasiError) {
      return kirimError(relasiError);
    }

    const [hasil] = await db.query(
      `
        UPDATE jadwal_les
        SET
          peserta_id = ?,
          tutor_user_id = ?,
          mata_pelajaran_id = ?,
          tanggal = ?,
          jam_mulai = ?,
          jam_selesai = ?,
          lokasi = ?
        WHERE id = ?
      `,
      [
        Number(body.peserta_id),
        Number(body.tutor_user_id),
        Number(body.mata_pelajaran_id),
        body.tanggal,
        body.jam_mulai,
        body.jam_selesai,
        body.lokasi ? String(body.lokasi).trim() : null,
        Number(id),
      ]
    );

    if (hasil.affectedRows === 0) {
      const [ada] = await db.query(
        "SELECT id FROM jadwal_les WHERE id = ? LIMIT 1",
        [Number(id)]
      );

      if (ada.length === 0) {
        return kirimError("Jadwal tidak ditemukan.", 404);
      }
    }

    return NextResponse.json({ pesan: "Jadwal berhasil diperbarui." });
  } catch (error) {
    console.error("PUT /api/admin/jadwal:", error);
    return kirimError("Gagal memperbarui jadwal.", 500);
  }
}

// DELETE: hapus jadwal berdasarkan ID.
export async function DELETE(request) {
  try {
    if (!(await periksaAdmin())) {
      return kirimError("Akses ditolak. Silakan masuk sebagai admin.", 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!nilaiAngkaValid(id)) {
      return kirimError("ID jadwal tidak valid.");
    }

    const [hasil] = await db.query(
      "DELETE FROM jadwal_les WHERE id = ?",
      [Number(id)]
    );

    if (hasil.affectedRows === 0) {
      return kirimError("Jadwal tidak ditemukan.", 404);
    }

    return NextResponse.json({ pesan: "Jadwal berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/admin/jadwal:", error);

    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return kirimError(
        "Jadwal tidak bisa dihapus karena sudah digunakan oleh data presensi.",
        409
      );
    }

    return kirimError("Gagal menghapus jadwal.", 500);
  }
}
