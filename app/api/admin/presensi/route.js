
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

const STATUS_VALID = ["hadir", "izin", "sakit", "alfa"];

async function cekAdmin() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    return null;
  }

  return session;
}

function bersihkanTeks(value, batas = 10000) {
  if (value === null || value === undefined) return null;

  const teks = String(value).trim();

  if (!teks) return null;

  return teks.slice(0, batas);
}

function normalisasiStatus(value) {
  const status = String(value || "").trim().toLowerCase();

  if (status === "alpa") return "alfa";

  return STATUS_VALID.includes(status) ? status : null;
}

function validasiInput(body) {
  const jadwalId = Number(body.jadwal_id);
  const pesertaId = Number(body.peserta_id);
  const status = normalisasiStatus(body.status);

  if (!Number.isInteger(jadwalId) || jadwalId < 1) {
    return { error: "Jadwal les wajib dipilih." };
  }

  if (!Number.isInteger(pesertaId) || pesertaId < 1) {
    return { error: "Peserta wajib dipilih." };
  }

  if (!status) {
    return { error: "Status presensi tidak valid." };
  }

  const buktiFoto = bersihkanTeks(body.bukti_foto, 255);

  if (
    buktiFoto &&
    !/^\/uploads\/presensi\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(
      buktiFoto
    )
  ) {
    return { error: "Lokasi bukti foto tidak valid." };
  }

  return {
    data: {
      jadwalId,
      pesertaId,
      status,
      catatan: bersihkanTeks(body.catatan, 255),
      buktiFoto,
      materi: bersihkanTeks(body.materi_diajarkan),
      kesimpulan: bersihkanTeks(body.kesimpulan_pemahaman),
    },
  };
}

async function jadwalCocok(jadwalId, pesertaId) {
  const [rows] = await db.execute(
    `SELECT id
     FROM jadwal_les
     WHERE id = ? AND peserta_id = ?
     LIMIT 1`,
    [jadwalId, pesertaId]
  );

  return rows.length > 0;
}

function responsGagal(pesan, status = 400) {
  return NextResponse.json(
    { success: false, message: pesan },
    { status }
  );
}

// ==========================================
// GET: Mengambil data presensi untuk Admin
// ==========================================
export async function GET(request) {
  try {
    const session = await cekAdmin();

    if (!session) {
      return responsGagal("Akses ditolak.", 403);
    }

    const { searchParams } = new URL(request.url);
    const tanggal = searchParams.get("tanggal") || "";
    const statusInput = searchParams.get("status") || "";
    const pesertaId = searchParams.get("peserta_id") || "";

    const statusFilter = statusInput
      ? normalisasiStatus(statusInput)
      : "";

    let sql = `
      SELECT
        pr.id,
        pr.jadwal_id,
        pr.peserta_id,
        LOWER(pr.status) AS status_asli,
        pr.catatan,
        pr.bukti_foto,
        pr.materi_diajarkan,
        pr.kesimpulan_pemahaman,
        pr.dicatat_oleh,
        pr.dicatat_pada,
        p.nama AS nama_peserta,
        jl.tanggal,
        jl.jam_mulai,
        jl.jam_selesai,
        jl.lokasi,
        mp.nama AS nama_pelajaran,
        COALESCE(t.nama, u.nama, '-') AS nama_tutor
      FROM presensi pr
      INNER JOIN jadwal_les jl ON jl.id = pr.jadwal_id
      INNER JOIN peserta p ON p.id = pr.peserta_id
      LEFT JOIN mata_pelajaran mp
        ON mp.id = jl.mata_pelajaran_id
      LEFT JOIN tutor t
        ON t.user_id = jl.tutor_user_id
      LEFT JOIN users u
        ON u.id = jl.tutor_user_id
      WHERE 1 = 1
    `;

    const params = [];

    if (tanggal) {
      sql += " AND DATE(jl.tanggal) = ?";
      params.push(tanggal);
    }

    if (statusInput && statusFilter) {
      sql += " AND LOWER(pr.status) IN (?, ?)";
      params.push(
        statusFilter,
        statusFilter === "alfa" ? "alpa" : statusFilter
      );
    }

    if (pesertaId && Number.isInteger(Number(pesertaId))) {
      sql += " AND pr.peserta_id = ?";
      params.push(Number(pesertaId));
    }

    sql += `
      ORDER BY jl.tanggal DESC, jl.jam_mulai DESC, pr.id DESC
      LIMIT 500
    `;

    const [rows] = await db.execute(sql, params);

    const data = rows.map((row) => {
      const { status_asli, ...item } = row;

      return {
        ...item,
        status: normalisasiStatus(status_asli) || status_asli,
        // Alias untuk kompatibilitas halaman yang masih memakai nama lama.
        foto: row.bukti_foto,
        materi: row.materi_diajarkan,
        kesimpulan: row.kesimpulan_pemahaman,
      };
    });

    const [peserta] = await db.execute(
      `SELECT id, nama
       FROM peserta
       ORDER BY nama ASC`
    );

    const [jadwal] = await db.execute(`
      SELECT
        jl.id,
        jl.peserta_id,
        jl.tanggal,
        jl.jam_mulai,
        jl.jam_selesai,
        jl.lokasi,
        p.nama AS nama_peserta,
        mp.nama AS nama_pelajaran,
        COALESCE(t.nama, u.nama, '-') AS nama_tutor
      FROM jadwal_les jl
      INNER JOIN peserta p ON p.id = jl.peserta_id
      LEFT JOIN mata_pelajaran mp
        ON mp.id = jl.mata_pelajaran_id
      LEFT JOIN tutor t
        ON t.user_id = jl.tutor_user_id
      LEFT JOIN users u
        ON u.id = jl.tutor_user_id
      ORDER BY jl.tanggal DESC, jl.jam_mulai DESC
      LIMIT 500
    `);

    return NextResponse.json({
      success: true,
      data,
      peserta,
      jadwal,
      statistik: {
        total: data.length,
        hadir: data.filter((x) => x.status === "hadir").length,
        izin: data.filter((x) => x.status === "izin").length,
        sakit: data.filter((x) => x.status === "sakit").length,
        alfa: data.filter((x) => x.status === "alfa").length,
      },
    });
  } catch (error) {
    console.error("GET presensi admin:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data presensi.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// POST: Menambahkan presensi oleh Admin
// ==========================================
export async function POST(request) {
  try {
    const session = await cekAdmin();

    if (!session) {
      return responsGagal("Akses ditolak.", 403);
    }

    const body = await request.json();
    const hasil = validasiInput(body);

    if (hasil.error) {
      return responsGagal(hasil.error);
    }

    const input = hasil.data;

    if (!(await jadwalCocok(input.jadwalId, input.pesertaId))) {
      return responsGagal(
        "Peserta tidak sesuai dengan jadwal yang dipilih."
      );
    }

    const [duplikat] = await db.execute(
      `SELECT id
       FROM presensi
       WHERE jadwal_id = ? AND peserta_id = ?
       LIMIT 1`,
      [input.jadwalId, input.pesertaId]
    );

    if (duplikat.length) {
      return responsGagal(
        "Presensi untuk peserta dan jadwal tersebut sudah ada.",
        409
      );
    }

    const [result] = await db.execute(
      `INSERT INTO presensi (
        jadwal_id,
        peserta_id,
        status,
        catatan,
        dicatat_oleh,
        bukti_foto,
        materi_diajarkan,
        kesimpulan_pemahaman
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.jadwalId,
        input.pesertaId,
        input.status,
        input.catatan,
        session.id,
        input.buktiFoto,
        input.materi,
        input.kesimpulan,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Presensi berhasil ditambahkan.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("POST presensi admin:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan presensi.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// PUT: Memperbarui presensi oleh Admin
// ==========================================
export async function PUT(request) {
  try {
    const session = await cekAdmin();

    if (!session) {
      return responsGagal("Akses ditolak.", 403);
    }

    const body = await request.json();
    const id = Number(body.id);

    if (!Number.isInteger(id) || id < 1) {
      return responsGagal("ID presensi tidak valid.");
    }

    const hasil = validasiInput(body);

    if (hasil.error) {
      return responsGagal(hasil.error);
    }

    const input = hasil.data;

    if (!(await jadwalCocok(input.jadwalId, input.pesertaId))) {
      return responsGagal(
        "Peserta tidak sesuai dengan jadwal yang dipilih."
      );
    }

    const [duplikat] = await db.execute(
      `SELECT id
       FROM presensi
       WHERE jadwal_id = ?
         AND peserta_id = ?
         AND id <> ?
       LIMIT 1`,
      [input.jadwalId, input.pesertaId, id]
    );

    if (duplikat.length) {
      return responsGagal(
        "Presensi untuk jadwal tersebut sudah ada.",
        409
      );
    }

    const [result] = await db.execute(
      `UPDATE presensi
       SET jadwal_id = ?,
           peserta_id = ?,
           status = ?,
           catatan = ?,
           bukti_foto = ?,
           materi_diajarkan = ?,
           kesimpulan_pemahaman = ?
       WHERE id = ?`,
      [
        input.jadwalId,
        input.pesertaId,
        input.status,
        input.catatan,
        input.buktiFoto,
        input.materi,
        input.kesimpulan,
        id,
      ]
    );

    if (!result.affectedRows) {
      return responsGagal(
        "Data presensi tidak ditemukan.",
        404
      );
    }

    return NextResponse.json({
      success: true,
      message: "Presensi berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PUT presensi admin:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal memperbarui presensi.",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE: Menghapus presensi oleh Admin
// ==========================================
export async function DELETE(request) {
  try {
    const session = await cekAdmin();

    if (!session) {
      return responsGagal("Akses ditolak.", 403);
    }

    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isInteger(id) || id < 1) {
      return responsGagal("ID presensi tidak valid.");
    }

    const [result] = await db.execute(
      "DELETE FROM presensi WHERE id = ?",
      [id]
    );

    if (!result.affectedRows) {
      return responsGagal(
        "Data presensi tidak ditemukan.",
        404
      );
    }

    return NextResponse.json({
      success: true,
      message: "Presensi berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE presensi admin:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghapus presensi.",
      },
      { status: 500 }
    );
  }
}
