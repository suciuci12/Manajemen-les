
import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardContent() {
  await connection();

  const user = await getSession();

  if (!user) redirect("/login");
  if (user.role !== "tutor") redirect("/login");

  const namaTutor = user.nama || "Tutor";

  const inisial = namaTutor
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase())
    .join("");

  const tanggal = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  let statistik = {
    totalJadwal: 0,
    totalPeserta: 0,
    sudahPresensi: 0,
    belumPresensi: 0,
  };

  let jadwal = [];
  let gagalMemuat = false;

  try {
    // Mengambil jumlah jadwal milik tutor yang sedang login.
    const [hasilStatistik] = await db.execute(
      `SELECT
        COUNT(DISTINCT jl.id) AS total_jadwal,
        COUNT(DISTINCT jl.peserta_id) AS total_peserta,
        COUNT(DISTINCT pr.jadwal_id) AS sudah_presensi
      FROM jadwal_les jl
      LEFT JOIN presensi pr ON pr.jadwal_id = jl.id
      WHERE jl.tutor_user_id = ?`,
      [user.id]
    );

    const dataStatistik = hasilStatistik[0] || {};

    statistik.totalJadwal = Number(dataStatistik.total_jadwal || 0);
    statistik.totalPeserta = Number(dataStatistik.total_peserta || 0);
    statistik.sudahPresensi = Number(dataStatistik.sudah_presensi || 0);
    statistik.belumPresensi = Math.max(
      0,
      statistik.totalJadwal - statistik.sudahPresensi
    );

    // Mengambil jadwal dan nama peserta untuk ditampilkan.
    const [hasilJadwal] = await db.execute(
      `SELECT
        jl.id AS jadwal_id,
        jl.peserta_id,
        jl.tanggal,
        jl.jam_mulai,
        jl.jam_selesai,
        jl.lokasi,
        p.nama AS nama_peserta,
        mp.nama AS nama_mata_pelajaran,
        pr.status AS status_presensi,
        pr.id AS presensi_id
      FROM jadwal_les jl
      LEFT JOIN peserta p ON p.id = jl.peserta_id
      LEFT JOIN mata_pelajaran mp ON mp.id = jl.mata_pelajaran_id
      LEFT JOIN presensi pr ON pr.jadwal_id = jl.id
      WHERE jl.tutor_user_id = ?
      ORDER BY
        CASE WHEN jl.tanggal >= CURDATE() THEN 0 ELSE 1 END,
        CASE WHEN jl.tanggal >= CURDATE() THEN jl.tanggal END ASC,
        CASE WHEN jl.tanggal < CURDATE() THEN jl.tanggal END DESC,
        jl.jam_mulai ASC
      LIMIT 5`,
      [user.id]
    );

    jadwal = hasilJadwal;
  } catch (error) {
    console.error("Gagal memuat dashboard tutor:", error);
    gagalMemuat = true;
  }

  function formatTanggal(nilai) {
    if (!nilai) return "-";

    const tanggalObj = new Date(nilai);
    if (Number.isNaN(tanggalObj.getTime())) return "-";

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(tanggalObj);
  }

  function formatJam(nilai) {
    if (!nilai) return "--:--";

    if (typeof nilai === "string") {
      return nilai.slice(0, 5);
    }

    return String(nilai).slice(0, 5);
  }

  return (
    <main className="tutor-dashboard">
      <aside className="tutor-sidebar">
        <Link href="/tutor" className="tutor-brand">
          <span className="tutor-brand-logo">M</span>
          <span className="tutor-brand-text">
            <strong>manuli</strong>
            <small>Ruang mengajar</small>
          </span>
        </Link>

        <div className="tutor-profile">
          <div className="tutor-avatar">{inisial}</div>
          <div className="tutor-profile-info">
            <strong>{namaTutor}</strong>
            <span>Tutor Manuli</span>
          </div>
          <span className="tutor-profile-dot" />
        </div>

        <p className="tutor-menu-label">MENU UTAMA</p>

        <nav className="tutor-navigation">
          <Link href="/tutor" className="tutor-nav-item active">
            <span className="tutor-nav-icon">⌂</span>
            <span>Dashboard</span>
          </Link>

          <Link href="/tutor/jadwal" className="tutor-nav-item">
            <span className="tutor-nav-icon">▦</span>
            <span>Jadwal Les</span>
          </Link>

          <Link href="/tutor/peserta" className="tutor-nav-item">
            <span className="tutor-nav-icon">♙</span>
            <span>Data Peserta</span>
          </Link>

          <Link href="/tutor/presensi" className="tutor-nav-item">
            <span className="tutor-nav-icon">✓</span>
            <span>Presensi</span>
          </Link>
        </nav>

        <div className="tutor-sidebar-note">
          <div className="tutor-note-icon">✦</div>
          <strong>Menjadi tutor inspiratif</strong>
          <p>
            Bantu setiap peserta berkembang melalui proses belajar
            yang menyenangkan.
          </p>
        </div>

        <div className="tutor-sidebar-footer">
          <span className="tutor-online-dot" />
          Akun tutor aktif
        </div>
      </aside>

      <section className="tutor-main">
        <header className="tutor-topbar">
          <div>
            <span className="tutor-eyebrow">RUANG MENGAJAR</span>
            <h1>Dashboard Tutor</h1>
            <p>Kelola kegiatan mengajar dan kehadiran peserta.</p>
          </div>

          <div className="tutor-topbar-actions">
            <div className="tutor-date-chip">
              <span>▦</span>
              {tanggal}
            </div>
            <div className="tutor-logout">
              <LogoutButton />
            </div>
          </div>
        </header>

        <section className="tutor-welcome">
          <div className="tutor-welcome-content">
            <span className="tutor-welcome-label">
              SELAMAT DATANG, TUTOR! ✨
            </span>
            <h2>Halo, {namaTutor}!</h2>
            <p>
              Siap menemani peserta belajar hari ini? Pantau jadwal
              mengajar dan pastikan kehadiran peserta tercatat dengan baik.
            </p>
            <Link href="/tutor/jadwal" className="tutor-primary-button">
              Lihat jadwal mengajar <span>→</span>
            </Link>
          </div>

          <div className="tutor-welcome-art" aria-hidden="true">
            <div className="tutor-art-circle">
              <span className="tutor-art-star tutor-star-one">✦</span>
              <span className="tutor-art-star tutor-star-two">✧</span>
              <div className="tutor-art-book">📚</div>
              <div className="tutor-art-pencil">✎</div>
              <div className="tutor-art-heart">♡</div>
            </div>
          </div>
        </section>

        <section className="tutor-section">
          <div className="tutor-section-heading">
            <div>
              <h2>Ringkasan Mengajar</h2>
              <p>Gambaran kegiatan mengajar kamu.</p>
            </div>
            <span className="tutor-section-tag">AKTIVITAS</span>
          </div>

          <div className="tutor-stats-grid">
            <article className="tutor-stat-card stat-purple">
              <div className="tutor-stat-top">
                <span>Jadwal Mengajar</span>
                <span className="tutor-stat-icon">▦</span>
              </div>
              <strong>{statistik.totalJadwal}</strong>
              <p>Total jadwal mengajar</p>
            </article>

            <article className="tutor-stat-card stat-green">
              <div className="tutor-stat-top">
                <span>Peserta Diajar</span>
                <span className="tutor-stat-icon">♙</span>
              </div>
              <strong>{statistik.totalPeserta}</strong>
              <p>Peserta berbeda</p>
            </article>

            <article className="tutor-stat-card stat-orange">
              <div className="tutor-stat-top">
                <span>Presensi Terisi</span>
                <span className="tutor-stat-icon">✓</span>
              </div>
              <strong>{statistik.sudahPresensi}</strong>
              <p>Jadwal sudah dipresensi</p>
            </article>

            <article className="tutor-stat-card stat-pink">
              <div className="tutor-stat-top">
                <span>Belum Presensi</span>
                <span className="tutor-stat-icon">◷</span>
              </div>
              <strong>{statistik.belumPresensi}</strong>
              <p>Jadwal belum dipresensi</p>
            </article>
          </div>

          {gagalMemuat && (
            <p role="alert">
              Sebagian data dashboard gagal dimuat. Periksa terminal
              server untuk melihat detail kesalahannya.
            </p>
          )}
        </section>

        <section className="tutor-section">
          <div className="tutor-section-heading">
            <div>
              <h2>Jadwal Mengajar</h2>
              <p>Informasi pertemuan les yang perlu kamu persiapkan.</p>
            </div>
            <Link href="/tutor/jadwal" className="tutor-text-link">
              Lihat semua <span>→</span>
            </Link>
          </div>

          {jadwal.length > 0 ? (
            <div className="tutor-dashboard-schedule-list">
              {jadwal.map((item) => (
                <article
                  className="tutor-presensi-card tutor-dashboard-schedule"
                  key={item.jadwal_id}
                >
                  <div className="tutor-presensi-icon">▦</div>

                  <div className="tutor-presensi-content">
                    <h3>{item.nama_peserta || "Peserta les"}</h3>
                    <p>
                      {item.nama_mata_pelajaran || "Mata pelajaran belum diisi"}
                    </p>
                    <p>
                      {formatTanggal(item.tanggal)} ·{" "}
                      {formatJam(item.jam_mulai)}–{formatJam(item.jam_selesai)}
                    </p>
                    {item.lokasi && <p>Lokasi: {item.lokasi}</p>}
                    <p>
                      Status presensi:{" "}
                      {item.presensi_id
                        ? item.status_presensi || "Sudah dicatat"
                        : "Belum diisi"}
                    </p>
                  </div>

                  <Link
                    href="/tutor/presensi"
                    className="tutor-secondary-button"
                  >
                    Buka presensi <span>→</span>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="tutor-empty-card">
              <div className="tutor-empty-icon">▦</div>
              <h3>
                {gagalMemuat
                  ? "Jadwal belum dapat dimuat"
                  : "Belum ada jadwal untuk ditampilkan"}
              </h3>
              <p>
                {gagalMemuat
                  ? "Periksa koneksi database dan struktur tabel jadwal."
                  : "Jadwal mengajar akan muncul setelah jadwal ditambahkan dan ditautkan ke akun tutor ini."}
              </p>
            </div>
          )}
        </section>

        <section className="tutor-section">
          <div className="tutor-section-heading">
            <div>
              <h2>Presensi Peserta</h2>
              <p>Catat kehadiran peserta pada setiap pertemuan les.</p>
            </div>
            <Link href="/tutor/presensi" className="tutor-text-link">
              Buka presensi <span>→</span>
            </Link>
          </div>

          <div className="tutor-presensi-card">
            <div className="tutor-presensi-icon">✓</div>
            <div className="tutor-presensi-content">
              <h3>Kehadiran peserta itu penting</h3>
              <p>
                Isi presensi sesuai kondisi peserta agar orang tua
                dapat memantau kehadiran anak melalui Manuli.
              </p>
            </div>
            <Link
              href="/tutor/presensi"
              className="tutor-secondary-button"
            >
              Isi presensi <span>→</span>
            </Link>
          </div>
        </section>

        <footer className="tutor-footer">
          <span className="tutor-footer-brand">manuli ♡</span>
          <span>Teman belajar, tumbuh bersama.</span>
        </footer>
      </section>
    </main>
  );
}
