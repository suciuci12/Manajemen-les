
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";


const FOLDER_FOTO = path.join(
  process.cwd(),
  "public",
  "uploads",
  "presensi"
);

const MAKS_FOTO = 5 * 1024 * 1024;

const TIPE_FOTO = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

async function hapusFileFoto(urlFoto) {
  if (!urlFoto || !urlFoto.startsWith("/uploads/presensi/")) {
    return;
  }

  const namaFile = path.basename(urlFoto);
  const lokasiFile = path.join(FOLDER_FOTO, namaFile);

  try {
    await fs.unlink(lokasiFile);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Gagal menghapus foto:", error);
    }
  }
}

async function simpanFoto(file) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!TIPE_FOTO[file.type]) {
    throw new Error("Foto harus berformat JPG, PNG, atau WebP.");
  }

  if (file.size > MAKS_FOTO) {
    throw new Error("Ukuran foto maksimal 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Memeriksa tanda awal berkas agar tidak hanya bergantung
  // pada tipe MIME yang dikirim browser.
  const validJpeg =
    file.type === "image/jpeg" &&
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  const validPng =
    file.type === "image/png" &&
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    );

  const validWebp =
    file.type === "image/webp" &&
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  if (!validJpeg && !validPng && !validWebp) {
    throw new Error("Isi berkas bukan gambar yang valid.");
  }

  await fs.mkdir(FOLDER_FOTO, { recursive: true });

  const namaFile = `${randomUUID()}${TIPE_FOTO[file.type]}`;
  await fs.writeFile(path.join(FOLDER_FOTO, namaFile), buffer);

  return `/uploads/presensi/${namaFile}`;
}

function teksForm(formData, nama, maksimal) {
  const nilai = formData.get(nama);

  if (typeof nilai !== "string") {
    return "";
  }

  const hasil = nilai.trim();

  if (hasil.length > maksimal) {
    throw new Error(`${nama} maksimal ${maksimal} karakter.`);
  }

  return hasil;
}

async function ambilJadwalTutor(jadwalId, tutorId) {
  const [rows] = await db.execute(
    `SELECT id, peserta_id
     FROM jadwal_les
     WHERE id = ? AND tutor_user_id = ?
     LIMIT 1`,
    [jadwalId, tutorId]
  );

  return rows[0] || null;
}

async function ambilPresensiJadwal(jadwalId) {
  const [rows] = await db.execute(
    `SELECT id, jadwal_id, peserta_id, status, catatan,
            foto, materi, kesimpulan
     FROM presensi
     WHERE jadwal_id = ?
     LIMIT 1`,
    [jadwalId]
  );

  return rows[0] || null;
}

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "tutor") {
      return NextResponse.json(
        { success: false, message: "Akses hanya untuk tutor." },
        { status: 403 }
      );
    }

    const [rows] = await db.execute(
      `SELECT
         pr.id AS presensi_id,
         pr.jadwal_id,
         pr.peserta_id,
         pr.status,
         pr.catatan,
         pr.foto,
         pr.materi,
         pr.kesimpulan,
         jl.tutor_user_id
       FROM presensi pr
       INNER JOIN jadwal_les jl ON jl.id = pr.jadwal_id
       WHERE jl.tutor_user_id = ?
       ORDER BY pr.id DESC`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET presensi tutor:", error);

    return NextResponse.json(
      { success: false, message: "Gagal mengambil data presensi." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let fotoBaru = null;

  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "tutor") {
      return NextResponse.json(
        { success: false, message: "Akses hanya untuk tutor." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const jadwalId = Number(formData.get("jadwal_id"));
    const status = teksForm(formData, "status", 20);
    const catatan = teksForm(formData, "catatan", 1000);
    const materi = teksForm(formData, "materi", 5000);
    const kesimpulan = teksForm(formData, "kesimpulan", 5000);
    const file = formData.get("foto");

    if (!Number.isInteger(jadwalId) || jadwalId <= 0) {
      return NextResponse.json(
        { success: false, message: "Jadwal les tidak valid." },
        { status: 400 }
      );
    }

    if (!["Hadir", "Izin", "Sakit", "Alpa"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Status presensi tidak valid." },
        { status: 400 }
      );
    }

    const jadwal = await ambilJadwalTutor(jadwalId, user.id);

    if (!jadwal) {
      return NextResponse.json(
        { success: false, message: "Jadwal tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    const presensiLama = await ambilPresensiJadwal(jadwalId);

    if (presensiLama) {
      return NextResponse.json(
        { success: false, message: "Presensi untuk jadwal ini sudah ada. Gunakan fitur Edit." },
        { status: 409 }
      );
    }

    if (file instanceof File && file.size > 0) {
      fotoBaru = await simpanFoto(file);
    }

    await db.execute(
      `INSERT INTO presensi
        (jadwal_id, peserta_id, status, catatan, foto,
         materi, kesimpulan, dicatat_oleh, dicatat_pada)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        jadwalId,
        jadwal.peserta_id,
        status,
        catatan,
        fotoBaru,
        materi,
        kesimpulan,
        user.id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Presensi berhasil ditambahkan.",
    });
  } catch (error) {
    if (fotoBaru) await hapusFileFoto(fotoBaru);

    console.error("POST presensi tutor:", error);

    const pesan = error.message || "Presensi gagal disimpan.";
    const kesalahanValidasi = /maksimal|berformat|bukan gambar/i.test(pesan);

    return NextResponse.json(
      {
        success: false,
        message: kesalahanValidasi
          ? pesan
          : "Presensi gagal disimpan. Periksa struktur tabel dan log server.",
      },
      { status: kesalahanValidasi ? 400 : 500 }
    );
  }
}

export async function PUT(request) {
  let fotoBaru = null;

  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "tutor") {
      return NextResponse.json(
        { success: false, message: "Akses hanya untuk tutor." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const jadwalId = Number(formData.get("jadwal_id"));
    const status = teksForm(formData, "status", 20);
    const catatan = teksForm(formData, "catatan", 1000);
    const materi = teksForm(formData, "materi", 5000);
    const kesimpulan = teksForm(formData, "kesimpulan", 5000);
    const file = formData.get("foto");
    const hapusFoto = formData.get("hapus_foto") === "true";

    if (!Number.isInteger(jadwalId) || jadwalId <= 0) {
      return NextResponse.json(
        { success: false, message: "Jadwal les tidak valid." },
        { status: 400 }
      );
    }

    if (!["Hadir", "Izin", "Sakit", "Alpa"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Status presensi tidak valid." },
        { status: 400 }
      );
    }

    const jadwal = await ambilJadwalTutor(jadwalId, user.id);

    if (!jadwal) {
      return NextResponse.json(
        { success: false, message: "Jadwal tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    const presensiLama = await ambilPresensiJadwal(jadwalId);

    if (!presensiLama) {
      return NextResponse.json(
        { success: false, message: "Data presensi tidak ditemukan." },
        { status: 404 }
      );
    }

    if (file instanceof File && file.size > 0) {
      fotoBaru = await simpanFoto(file);
    }

    const fotoAkhir = fotoBaru
      ? fotoBaru
      : hapusFoto
        ? null
        : presensiLama.foto;

    await db.execute(
      `UPDATE presensi
       SET status = ?, catatan = ?, foto = ?,
           materi = ?, kesimpulan = ?
       WHERE id = ? AND jadwal_id = ?`,
      [
        status,
        catatan,
        fotoAkhir,
        materi,
        kesimpulan,
        presensiLama.id,
        jadwalId,
      ]
    );

    if (fotoBaru || hapusFoto) {
      await hapusFileFoto(presensiLama.foto);
    }

    return NextResponse.json({
      success: true,
      message: "Presensi berhasil diperbarui.",
    });
  } catch (error) {
    if (fotoBaru) await hapusFileFoto(fotoBaru);

    console.error("PUT presensi tutor:", error);

    const pesan = error.message || "Presensi gagal diperbarui.";
    const kesalahanValidasi = /maksimal|berformat|bukan gambar/i.test(pesan);

    return NextResponse.json(
      {
        success: false,
        message: kesalahanValidasi
          ? pesan
          : "Presensi gagal diperbarui. Periksa struktur tabel dan log server.",
      },
      { status: kesalahanValidasi ? 400 : 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "tutor") {
      return NextResponse.json(
        { success: false, message: "Akses hanya untuk tutor." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jadwalId = Number(searchParams.get("jadwal_id"));

    if (!Number.isInteger(jadwalId) || jadwalId <= 0) {
      return NextResponse.json(
        { success: false, message: "Jadwal les tidak valid." },
        { status: 400 }
      );
    }

    const jadwal = await ambilJadwalTutor(jadwalId, user.id);

    if (!jadwal) {
      return NextResponse.json(
        { success: false, message: "Jadwal tidak ditemukan atau bukan milik Anda." },
        { status: 404 }
      );
    }

    const presensi = await ambilPresensiJadwal(jadwalId);

    if (!presensi) {
      return NextResponse.json(
        { success: false, message: "Data presensi tidak ditemukan." },
        { status: 404 }
      );
    }

    await db.execute(
      "DELETE FROM presensi WHERE id = ? AND jadwal_id = ?",
      [presensi.id, jadwalId]
    );

    await hapusFileFoto(presensi.foto);

    return NextResponse.json({
      success: true,
      message: "Presensi berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE presensi tutor:", error);

    return NextResponse.json(
      { success: false, message: "Presensi gagal dihapus." },
      { status: 500 }
    );
  }
}
