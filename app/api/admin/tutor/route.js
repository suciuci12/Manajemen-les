
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

async function cekAdmin() {
  const session = await getSession();
  return Boolean(session && session.role === "admin");
}

function validasi(data) {
  if (!data.nama?.trim()) {
    return "Nama tutor wajib diisi.";
  }

  if (!data.bidang_mengajar?.trim()) {
    return "Bidang mengajar wajib diisi.";
  }

  if (
    data.jenis_kelamin &&
    !["Laki-laki", "Perempuan"].includes(data.jenis_kelamin)
  ) {
    return "Jenis kelamin tidak valid.";
  }

  if (
    data.status &&
    !["Aktif", "Tidak Aktif"].includes(data.status)
  ) {
    return "Status tutor tidak valid.";
  }

  if (data.tanggal_bergabung) {
    const tanggal = new Date(data.tanggal_bergabung);

    if (Number.isNaN(tanggal.getTime())) {
      return "Tanggal bergabung tidak valid.";
    }
  }

  return null;
}

function rapikan(data) {
  return {
    nama: String(data.nama || "").trim(),
    jenis_kelamin: data.jenis_kelamin || null,
    nomor_hp: String(data.nomor_hp || "").trim() || null,
    alamat: String(data.alamat || "").trim() || null,
    bidang_mengajar: String(data.bidang_mengajar || "").trim(),
    tanggal_bergabung: data.tanggal_bergabung || null,
    status: data.status || "Aktif",
  };
}

// GET: mengambil daftar tutor beserta status akun login
export async function GET() {
  try {
    if (!(await cekAdmin())) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 401 }
      );
    }

    const [rows] = await pool.query(`
      SELECT
        t.id,
        t.user_id,
        t.nama,
        t.jenis_kelamin,
        t.nomor_hp,
        t.alamat,
        t.bidang_mengajar,
        DATE_FORMAT(t.tanggal_bergabung, '%Y-%m-%d')
          AS tanggal_bergabung,
        t.status,
        t.created_at,
        u.email AS email_akun
      FROM tutor t
      LEFT JOIN users u ON u.id = t.user_id
      ORDER BY t.id DESC
    `);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("GET tutor:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data tutor." },
      { status: 500 }
    );
  }
}

// POST: tambah biodata tutor atau buat akun login tutor
export async function POST(request) {
  let connection;
  let transaksiDimulai = false;

  try {
    if (!(await cekAdmin())) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Membuat akun login untuk tutor yang sudah terdaftar
    if (body.aksi === "buat-akun") {
      const tutorId = Number(body.tutor_id);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!Number.isInteger(tutorId) || tutorId < 1) {
        return NextResponse.json(
          { message: "ID tutor tidak valid." },
          { status: 400 }
        );
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { message: "Format email tidak valid." },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          { message: "Kata sandi minimal 8 karakter." },
          { status: 400 }
        );
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();
      transaksiDimulai = true;

      const [tutorRows] = await connection.query(
        `SELECT id, nama, user_id
         FROM tutor
         WHERE id = ?
         FOR UPDATE`,
        [tutorId]
      );

      if (tutorRows.length === 0) {
        await connection.rollback();
        transaksiDimulai = false;

        return NextResponse.json(
          { message: "Data tutor tidak ditemukan." },
          { status: 404 }
        );
      }

      const tutorData = tutorRows[0];

      if (tutorData.user_id) {
        await connection.rollback();
        transaksiDimulai = false;

        return NextResponse.json(
          { message: "Tutor sudah memiliki akun login." },
          { status: 409 }
        );
      }

      const [emailRows] = await connection.query(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [email]
      );

      if (emailRows.length > 0) {
        await connection.rollback();
        transaksiDimulai = false;

        return NextResponse.json(
          { message: "Email sudah digunakan akun lain." },
          { status: 409 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [userResult] = await connection.query(
        `INSERT INTO users (nama, email, password, role)
         VALUES (?, ?, ?, 'tutor')`,
        [tutorData.nama, email, passwordHash]
      );

      await connection.query(
        "UPDATE tutor SET user_id = ? WHERE id = ?",
        [userResult.insertId, tutorId]
      );

      await connection.commit();
      transaksiDimulai = false;

      return NextResponse.json(
        { message: "Akun tutor berhasil dibuat dan dihubungkan." },
        { status: 201 }
      );
    }

    // Menambahkan biodata tutor seperti sebelumnya
    const data = rapikan(body);
    const pesanValidasi = validasi(data);

    if (pesanValidasi) {
      return NextResponse.json(
        { message: pesanValidasi },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `INSERT INTO tutor
        (nama, jenis_kelamin, nomor_hp, alamat,
         bidang_mengajar, tanggal_bergabung, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nama,
        data.jenis_kelamin,
        data.nomor_hp,
        data.alamat,
        data.bidang_mengajar,
        data.tanggal_bergabung,
        data.status,
      ]
    );

    return NextResponse.json(
      {
        message: "Tutor berhasil ditambahkan.",
        id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection && transaksiDimulai) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback tutor:", rollbackError);
      }
    }

    console.error("POST tutor:", error);

    return NextResponse.json(
      {
        message:
          error.code === "ER_DUP_ENTRY"
            ? "Email sudah digunakan atau terjadi data duplikat."
            : "Gagal memproses data tutor.",
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// PUT: mengedit biodata tutor
export async function PUT(request) {
  try {
    if (!(await cekAdmin())) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { message: "ID tutor tidak valid." },
        { status: 400 }
      );
    }

    const data = rapikan(body);
    const pesanValidasi = validasi(data);

    if (pesanValidasi) {
      return NextResponse.json(
        { message: pesanValidasi },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      `UPDATE tutor
       SET nama = ?,
           jenis_kelamin = ?,
           nomor_hp = ?,
           alamat = ?,
           bidang_mengajar = ?,
           tanggal_bergabung = ?,
           status = ?
       WHERE id = ?`,
      [
        data.nama,
        data.jenis_kelamin,
        data.nomor_hp,
        data.alamat,
        data.bidang_mengajar,
        data.tanggal_bergabung,
        data.status,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      const [rows] = await pool.query(
        "SELECT id FROM tutor WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        return NextResponse.json(
          { message: "Tutor tidak ditemukan." },
          { status: 404 }
        );
      }
    }

    // Jika nama tutor berubah, sinkronkan nama akun login.
    await pool.query(
      `UPDATE users u
       INNER JOIN tutor t ON t.user_id = u.id
       SET u.nama = t.nama
       WHERE t.id = ?`,
      [id]
    );

    return NextResponse.json({
      message: "Data tutor berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PUT tutor:", error);

    return NextResponse.json(
      { message: "Gagal memperbarui data tutor." },
      { status: 500 }
    );
  }
}

// DELETE: menghapus biodata tutor saja, bukan akun pengguna
export async function DELETE(request) {
  try {
    if (!(await cekAdmin())) {
      return NextResponse.json(
        { message: "Akses ditolak." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { message: "ID tutor tidak valid." },
        { status: 400 }
      );
    }

    const [rows] = await pool.query(
      "SELECT id, user_id FROM tutor WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Tutor tidak ditemukan." },
        { status: 404 }
      );
    }

    // Jangan menghapus tutor yang masih direferensikan jadwal.
    const [jadwalRows] = await pool.query(
      "SELECT id FROM jadwal_les WHERE tutor_user_id = ? LIMIT 1",
      [rows[0].user_id || -1]
    );

    if (jadwalRows.length > 0) {
      return NextResponse.json(
        {
          message:
            "Tutor masih memiliki jadwal les. Hapus atau pindahkan jadwalnya terlebih dahulu.",
        },
        { status: 409 }
      );
    }

    await pool.query("DELETE FROM tutor WHERE id = ?", [id]);

    return NextResponse.json({
      message: "Data tutor berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE tutor:", error);

    return NextResponse.json(
      {
        message:
          error.code === "ER_ROW_IS_REFERENCED_2"
            ? "Tutor masih digunakan oleh data lain."
            : "Gagal menghapus data tutor.",
      },
      { status: 500 }
    );
  }
}
