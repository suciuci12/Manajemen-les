
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { verifyParentAccess } from "@/lib/verify-parent-access";
import DashboardView from "./DashboardView";

export default async function DashboardContent() {
  const akses = await verifyParentAccess();

  if (!akses || !akses.peserta_id) {
    redirect("/login");
  }

  const pesertaId = Number(akses.peserta_id);

  // 1. Ambil data peserta
  const [pesertaRows] = await db.execute(
    `SELECT
       id,
       nama,
       tanggal_lahir,
       sekolah,
       parent_user_id
     FROM peserta
     WHERE id = ?
     LIMIT 1`,
    [pesertaId]
  );

  if (pesertaRows.length === 0) {
    return (
      <main className="ortu-dashboard">
        <h1>Data peserta tidak ditemukan</h1>
        <p>Silakan hubungi administrator Manuli.</p>
      </main>
    );
  }

  const peserta = pesertaRows[0];

  // 2. Ambil semua jadwal les peserta
  const [jadwalRows] = await db.execute(
    `SELECT
       jl.id AS jadwal_id,
       jl.tanggal,
       jl.jam_mulai,
       jl.jam_selesai,
       jl.lokasi,
       mp.nama AS nama_pelajaran,
       t.nama AS nama_tutor,
       pr.id AS presensi_id,
       pr.status
     FROM jadwal_les AS jl
     LEFT JOIN mata_pelajaran AS mp
       ON mp.id = jl.mata_pelajaran_id
     LEFT JOIN tutor AS t
       ON t.user_id = jl.tutor_user_id
     LEFT JOIN presensi AS pr
       ON pr.jadwal_id = jl.id
       AND pr.peserta_id = jl.peserta_id
     WHERE jl.peserta_id = ?
     ORDER BY jl.tanggal ASC, jl.jam_mulai ASC`,
    [pesertaId]
  );

  // 3. Ambil riwayat presensi beserta foto dan detail pembelajaran
  const [riwayatRows] = await db.execute(
    `SELECT
       pr.id AS presensi_id,
       pr.jadwal_id,
       pr.peserta_id,
       pr.status,
       pr.catatan,
       pr.dicatat_pada,

       COALESCE(
         NULLIF(pr.foto, ''),
         NULLIF(pr.bukti_foto, '')
       ) AS foto_presensi,

       COALESCE(
         NULLIF(pr.materi, ''),
         NULLIF(pr.materi_diajarkan, '')
       ) AS materi,

       COALESCE(
         NULLIF(pr.kesimpulan, ''),
         NULLIF(pr.kesimpulan_pemahaman, '')
       ) AS kesimpulan,

       jl.tanggal,
       jl.jam_mulai,
       jl.jam_selesai,
       jl.lokasi,
       mp.nama AS nama_pelajaran,
       t.nama AS nama_tutor

     FROM presensi AS pr
     INNER JOIN jadwal_les AS jl
       ON jl.id = pr.jadwal_id
     LEFT JOIN mata_pelajaran AS mp
       ON mp.id = jl.mata_pelajaran_id
     LEFT JOIN tutor AS t
       ON t.user_id = jl.tutor_user_id

     WHERE pr.peserta_id = ?
     ORDER BY
       jl.tanggal DESC,
       jl.jam_mulai DESC,
       pr.dicatat_pada DESC`,
    [pesertaId]
  );

  // 4. Normalisasi nilai agar dapat dikirim ke Client Component
  const ubahTanggal = (nilai) => {
    if (!nilai) return null;

    if (nilai instanceof Date) {
      const tahun = nilai.getFullYear();
      const bulan = String(nilai.getMonth() + 1).padStart(2, "0");
      const hari = String(nilai.getDate()).padStart(2, "0");

      return `${tahun}-${bulan}-${hari}`;
    }

    return String(nilai).slice(0, 10);
  };

  const ubahJam = (nilai) => {
    if (!nilai) return "";

    return String(nilai).slice(0, 5);
  };

  const ubahJadwal = jadwalRows.map((item) => ({
    jadwal_id: Number(item.jadwal_id),
    tanggal: ubahTanggal(item.tanggal),
    jam_mulai: ubahJam(item.jam_mulai),
    jam_selesai: ubahJam(item.jam_selesai),
    lokasi: item.lokasi || "",
    nama_pelajaran: item.nama_pelajaran || "Pelajaran",
    nama_tutor: item.nama_tutor || "Tutor",
    presensi_id:
      item.presensi_id == null ? null : Number(item.presensi_id),
    status: item.status || null,
  }));

  const ubahRiwayat = riwayatRows.map((item) => ({
    presensi_id: Number(item.presensi_id),
    jadwal_id: Number(item.jadwal_id),
    tanggal: ubahTanggal(item.tanggal),
    jam_mulai: ubahJam(item.jam_mulai),
    jam_selesai: ubahJam(item.jam_selesai),
    lokasi: item.lokasi || "",
    nama_pelajaran: item.nama_pelajaran || "Pelajaran",
    nama_tutor: item.nama_tutor || "Tutor",
    status: item.status,
    foto_presensi: item.foto_presensi || null,
    materi: item.materi || "",
    kesimpulan: item.kesimpulan || "",
    catatan: item.catatan || "",
  }));

  // 5. Statistik kehadiran
  const statistik = {
    total: ubahRiwayat.length,
    hadir: ubahRiwayat.filter(
      (item) => item.status === "hadir"
    ).length,
    izin: ubahRiwayat.filter(
      (item) => item.status === "izin"
    ).length,
    sakit: ubahRiwayat.filter(
      (item) => item.status === "sakit"
    ).length,
    alfa: ubahRiwayat.filter(
      (item) => item.status === "alfa"
    ).length,
  };

  return (
    <DashboardView
      namaAnak={peserta.nama}
      jadwal={ubahJadwal}
      riwayat={ubahRiwayat}
      statistik={statistik}
    />
  );
}
