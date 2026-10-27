
"use client";

import { useMemo, useState } from "react";
import "./dashboard.css";

function tanggalLokal(value) {
  if (!value) return "";

  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const text = String(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);

  return match ? match[1] : "";
}

function formatTanggal(value) {
  const dateText = tanggalLokal(value);
  if (!dateText) return "-";

  const date = new Date(`${dateText}T12:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatJam(value) {
  return value ? String(value).slice(0, 5) : "-";
}

function normalisasiStatus(status) {
  const value = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  if (["hadir", "present"].includes(value)) return "hadir";
  if (["izin", "excused"].includes(value)) return "izin";
  if (value === "sakit") return "sakit";

  if (
    ["alfa", "alpa", "alpha", "absent", "tidak hadir"].includes(value)
  ) {
    return "alfa";
  }

  return "belum";
}

function statusLabel(status) {
  return {
    hadir: "Hadir",
    izin: "Izin",
    sakit: "Sakit",
    alfa: "Tidak hadir",
    belum: "Belum diisi",
  }[normalisasiStatus(status)];
}

function fotoValid(path) {
  if (!path) return null;

  const value = String(path).trim();

  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }

  try {
    const url = new URL(value);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch {
    return null;
  }

  return null;
}

function namaPelajaran(item) {
  return item?.mata_pelajaran || item?.nama_pelajaran || "-";
}

function cocokKata(item, keyword) {
  if (!keyword.trim()) return true;

  const text = [
    namaPelajaran(item),
    item.nama_tutor,
    item.lokasi,
    item.catatan,
    item.materi,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return text.includes(keyword.trim().toLowerCase());
}

function dalamRentang(item, mulai, selesai) {
  const date = tanggalLokal(item.tanggal);
  if (!date) return false;

  return (!mulai || date >= mulai) && (!selesai || date <= selesai);
}

function tanggalHariIni() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (key) => parts.find((p) => p.type === key)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function tanggalPendek(value) {
  const dateText = tanggalLokal(value);
  if (!dateText) return "-";

  const date = new Date(`${dateText}T12:00:00+07:00`);

  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(date);
}

export default function DashboardView({
  namaAnak = "Peserta",
  namaOrangTua = "Orang Tua",
  peserta = null,
  jadwal = [],
  riwayat = [],
  statistik = {},
}) {
  const [tab, setTab] = useState("ringkasan");

  const [kataJadwal, setKataJadwal] = useState("");
  const [tanggalJadwalMulai, setTanggalJadwalMulai] = useState("");
  const [tanggalJadwalSelesai, setTanggalJadwalSelesai] = useState("");
  const [jenisJadwal, setJenisJadwal] = useState("semua");

  const [kataRiwayat, setKataRiwayat] = useState("");
  const [tanggalRiwayatMulai, setTanggalRiwayatMulai] = useState("");
  const [tanggalRiwayatSelesai, setTanggalRiwayatSelesai] = useState("");
  const [statusRiwayat, setStatusRiwayat] = useState("semua");

  const [detail, setDetail] = useState(null);
  const [fotoBesar, setFotoBesar] = useState(false);

  const daftarJadwal = Array.isArray(jadwal) ? jadwal : [];
  const daftarRiwayat = Array.isArray(riwayat) ? riwayat : [];

  const nama = String(namaAnak || "Peserta");
  const inisial =
    nama.trim().split(/\s+/).slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "A";

  const angka = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  const total = angka(statistik.total);
  const hadir = angka(statistik.hadir);
  const izin = angka(statistik.izin);
  const sakit = angka(statistik.sakit);
  const alfa = angka(statistik.tidakHadir ?? statistik.alfa);

  const jadwalTerfilter = useMemo(() => {
    const today = tanggalHariIni();

    return daftarJadwal
      .filter((item) => dalamRentang(item, tanggalJadwalMulai, tanggalJadwalSelesai))
      .filter((item) => cocokKata(item, kataJadwal))
      .filter((item) => {
        const date = tanggalLokal(item.tanggal);

        if (jenisJadwal === "lampau") return date < today;
        if (jenisJadwal === "mendatang") return date >= today;

        return true;
      })
      .sort((a, b) => {
        const first = `${tanggalLokal(a.tanggal)} ${a.jam_mulai || ""}`;
        const second = `${tanggalLokal(b.tanggal)} ${b.jam_mulai || ""}`;

        return first.localeCompare(second);
      });
  }, [
    daftarJadwal,
    tanggalJadwalMulai,
    tanggalJadwalSelesai,
    kataJadwal,
    jenisJadwal,
  ]);

  const riwayatTerfilter = useMemo(() => {
    return daftarRiwayat
      .filter((item) =>
        dalamRentang(item, tanggalRiwayatMulai, tanggalRiwayatSelesai)
      )
      .filter((item) => cocokKata(item, kataRiwayat))
      .filter((item) => {
        if (statusRiwayat === "semua") return true;
        return normalisasiStatus(item.status) === statusRiwayat;
      })
      .sort((a, b) => {
        const first = `${tanggalLokal(a.tanggal)} ${a.jam_mulai || ""}`;
        const second = `${tanggalLokal(b.tanggal)} ${b.jam_mulai || ""}`;

        return second.localeCompare(first);
      });
  }, [
    daftarRiwayat,
    tanggalRiwayatMulai,
    tanggalRiwayatSelesai,
    kataRiwayat,
    statusRiwayat,
  ]);

  function bukaDetail(item) {
    setDetail(item);
    setFotoBesar(false);
  }

  function tutupDetail() {
    setDetail(null);
    setFotoBesar(false);
  }

  function resetJadwal() {
    setKataJadwal("");
    setTanggalJadwalMulai("");
    setTanggalJadwalSelesai("");
    setJenisJadwal("semua");
  }

  function resetRiwayat() {
    setKataRiwayat("");
    setTanggalRiwayatMulai("");
    setTanggalRiwayatSelesai("");
    setStatusRiwayat("semua");
  }

  return (
    <main className="ortu-dashboard">
      <aside className="ortu-sidebar">
        <a href="#beranda" className="ortu-brand">
          <span className="ortu-brand-logo">M</span>
          <span className="ortu-brand-copy">
            <strong>manuli</strong>
            <small>Teman belajar keluarga</small>
          </span>
        </a>

        <div className="ortu-profile-mini">
          <div className="ortu-avatar">{inisial}</div>
          <div className="ortu-profile-info">
            <strong>{namaOrangTua || "Orang Tua"}</strong>
            <span>Pemantau belajar</span>
          </div>
        </div>

        <p className="ortu-menu-title">MENU UTAMA</p>

        <nav className="ortu-nav">
          {[
            ["ringkasan", "⌂", "Ringkasan"],
            ["jadwal", "▦", "Jadwal les"],
            ["riwayat", "✓", "Riwayat kehadiran"],
          ].map(([value, icon, label]) => (
            <button
              type="button"
              key={value}
              className={`ortu-nav-link ${tab === value ? "aktif" : ""}`}
              onClick={() => setTab(value)}
            >
              <span className="ortu-nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="ortu-sidebar-note">
          <span className="ortu-note-symbol">♡</span>
          <strong>Belajar tumbuh bersama</strong>
          <p>Pantau perkembangan anak dalam satu tempat.</p>
        </div>

        <div className="ortu-sidebar-footer">
          <span className="ortu-online-dot" />
          Akses orang tua aktif
        </div>
      </aside>

      <section className="ortu-main" id="beranda">
        <header className="ortu-topbar">
          <div>
            <span className="ortu-eyebrow">DASHBOARD ORANG TUA</span>
            <h1>Halo, Ayah/Bunda! 👋</h1>
            <p>Pantau perjalanan belajar {nama} dengan mudah.</p>
          </div>

          <div className="ortu-date-chip">
            <span>◷</span>
            <div>
              <small>Hari ini</small>
              <strong>{tanggalPendek(tanggalHariIni())}</strong>
            </div>
          </div>
        </header>

        {tab === "ringkasan" && (
          <>
            <section className="ortu-welcome-card">
              <div className="ortu-welcome-content">
                <span className="ortu-welcome-label">RUANG BELAJAR MANULI</span>
                <h2>Langkah kecil hari ini, bekal besar untuk masa depan.</h2>
                <p>
                  Periksa jadwal, lihat catatan kehadiran, dan buka foto
                  kegiatan belajar {nama}.
                </p>
                <div className="ortu-welcome-actions">
                  <button
                    type="button"
                    className="ortu-primary-button"
                    onClick={() => setTab("jadwal")}
                  >
                    Cari jadwal <span>→</span>
                  </button>
                  <button
                    type="button"
                    className="ortu-secondary-button"
                    onClick={() => setTab("riwayat")}
                  >
                    Lihat kehadiran
                  </button>
                </div>
              </div>
              <div className="ortu-welcome-art" aria-hidden="true">
                <div className="ortu-art-circle">
                  <span>📚</span>
                  <i>✦</i>
                </div>
              </div>
            </section>

            <section className="ortu-section">
              <div className="ortu-section-heading">
                <div>
                  <h2>Ringkasan kehadiran</h2>
                  <p>Rekap dari catatan presensi yang sudah dibuat.</p>
                </div>
                <button
                  type="button"
                  className="ortu-text-button"
                  onClick={() => setTab("riwayat")}
                >
                  Lihat semua →
                </button>
              </div>

              <div className="ortu-stat-grid">
                <article className="ortu-stat-card stat-purple">
                  <span className="ortu-stat-icon">▦</span>
                  <span>Total presensi</span>
                  <strong>{total}</strong>
                  <small>Catatan kehadiran</small>
                </article>

                <article className="ortu-stat-card stat-green">
                  <span className="ortu-stat-icon">✓</span>
                  <span>Hadir</span>
                  <strong>{hadir}</strong>
                  <small>Pertemuan dihadiri</small>
                </article>

                <article className="ortu-stat-card stat-yellow">
                  <span className="ortu-stat-icon">♡</span>
                  <span>Izin dan sakit</span>
                  <strong>{izin + sakit}</strong>
                  <small>Izin {izin} · Sakit {sakit}</small>
                </article>

                <article className="ortu-stat-card stat-pink">
                  <span className="ortu-stat-icon">!</span>
                  <span>Tidak hadir</span>
                  <strong>{alfa}</strong>
                  <small>Tanpa kehadiran</small>
                </article>
              </div>
            </section>

            <section className="ortu-section">
              <div className="ortu-section-heading">
                <div>
                  <h2>Profil anak</h2>
                  <p>Peserta yang terhubung dengan akses ini.</p>
                </div>
              </div>

              <article className="ortu-child-card">
                <div className="ortu-child-avatar">{inisial}</div>
                <div className="ortu-child-info">
                  <span>NAMA PESERTA</span>
                  <h3>{nama}</h3>
                  <p>{peserta?.sekolah || "Peserta les Manuli"}</p>
                </div>
                <span className="ortu-status status-hadir">Terhubung</span>
              </article>
            </section>

            <section className="ortu-section">
              <div className="ortu-section-heading">
                <div>
                  <h2>Jadwal terdekat</h2>
                  <p>Jadwal yang akan datang.</p>
                </div>
                <button
                  type="button"
                  className="ortu-text-button"
                  onClick={() => setTab("jadwal")}
                >
                  Cari jadwal →
                </button>
              </div>

              {daftarJadwal.filter((item) => tanggalLokal(item.tanggal) >= tanggalHariIni()).length === 0 ? (
                <div className="ortu-empty-state">
                  <span className="ortu-empty-icon">▦</span>
                  <h3>Belum ada jadwal mendatang</h3>
                  <p>Jadwal baru akan terlihat setelah ditambahkan oleh admin.</p>
                </div>
              ) : (
                <div className="ortu-schedule-list">
                  {daftarJadwal
                    .filter((item) => tanggalLokal(item.tanggal) >= tanggalHariIni())
                    .sort((a, b) =>
                      `${tanggalLokal(a.tanggal)} ${a.jam_mulai || ""}`.localeCompare(
                        `${tanggalLokal(b.tanggal)} ${b.jam_mulai || ""}`
                      )
                    )
                    .slice(0, 3)
                    .map((item, index) => (
                      <article
                        className="ortu-schedule-card"
                        key={item.id ?? item.jadwal_id ?? index}
                      >
                        <div className="ortu-schedule-date">
                          <strong>{tanggalPendek(item.tanggal)}</strong>
                          <span>{formatJam(item.jam_mulai)}</span>
                        </div>
                        <div className="ortu-schedule-info">
                          <h3>{namaPelajaran(item)}</h3>
                          <p>Tutor: {item.nama_tutor || "-"}</p>
                          <p>
                            {formatJam(item.jam_mulai)}–{formatJam(item.jam_selesai)}
                            {item.lokasi ? ` · ${item.lokasi}` : ""}
                          </p>
                        </div>
                        <span className="ortu-status status-belum">Terjadwal</span>
                      </article>
                    ))}
                </div>
              )}
            </section>
          </>
        )}

        {tab === "jadwal" && (
          <section className="ortu-section">
            <div className="ortu-page-heading">
              <div>
                <span className="ortu-eyebrow">AGENDA BELAJAR</span>
                <h2>Cari jadwal les</h2>
                <p>Temukan jadwal sebelumnya maupun yang akan datang.</p>
              </div>
            </div>

            <div className="ortu-search-panel">
              <div className="ortu-search-field ortu-search-keyword">
                <label htmlFor="kata-jadwal">Kata kunci</label>
                <input
                  id="kata-jadwal"
                  value={kataJadwal}
                  onChange={(e) => setKataJadwal(e.target.value)}
                  placeholder="Mata pelajaran, tutor, atau lokasi..."
                />
              </div>

              <div className="ortu-search-field">
                <label htmlFor="jadwal-mulai">Tanggal mulai</label>
                <input
                  id="jadwal-mulai"
                  type="date"
                  value={tanggalJadwalMulai}
                  onChange={(e) => setTanggalJadwalMulai(e.target.value)}
                />
              </div>

              <div className="ortu-search-field">
                <label htmlFor="jadwal-selesai">Tanggal selesai</label>
                <input
                  id="jadwal-selesai"
                  type="date"
                  value={tanggalJadwalSelesai}
                  onChange={(e) => setTanggalJadwalSelesai(e.target.value)}
                  min={tanggalJadwalMulai || undefined}
                />
              </div>

              <div className="ortu-search-field">
                <label htmlFor="jenis-jadwal">Periode</label>
                <select
                  id="jenis-jadwal"
                  value={jenisJadwal}
                  onChange={(e) => setJenisJadwal(e.target.value)}
                >
                  <option value="semua">Semua jadwal</option>
                  <option value="lampau">Jadwal sebelumnya</option>
                  <option value="mendatang">Jadwal mendatang</option>
                </select>
              </div>

              <button
                type="button"
                className="ortu-secondary-button"
                onClick={resetJadwal}
              >
                Reset pencarian
              </button>
            </div>

            <div className="ortu-results-heading">
              <strong>{jadwalTerfilter.length} jadwal ditemukan</strong>
              <span>Data jadwal peserta {nama}</span>
            </div>

            {jadwalTerfilter.length === 0 ? (
              <div className="ortu-empty-state">
                <span className="ortu-empty-icon">⌕</span>
                <h3>Jadwal tidak ditemukan</h3>
                <p>Coba kata kunci atau rentang tanggal yang berbeda.</p>
              </div>
            ) : (
              <div className="ortu-schedule-list">
                {jadwalTerfilter.map((item, index) => {
                  const past = tanggalLokal(item.tanggal) < tanggalHariIni();

                  return (
                    <article
                      className="ortu-schedule-card"
                      key={item.id ?? item.jadwal_id ?? index}
                    >
                      <div className="ortu-schedule-date">
                        <strong>{tanggalPendek(item.tanggal)}</strong>
                        <span>
                          {formatJam(item.jam_mulai)}–{formatJam(item.jam_selesai)}
                        </span>
                      </div>
                      <div className="ortu-schedule-info">
                        <h3>{namaPelajaran(item)}</h3>
                        <p>Tutor: {item.nama_tutor || "-"}</p>
                        <p>Lokasi: {item.lokasi || "-"}</p>
                      </div>
                      <span className={`ortu-status ${past ? "status-belum" : "status-hadir"}`}>
                        {past ? "Sudah berlalu" : "Akan datang"}
                      </span>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === "riwayat" && (
          <section className="ortu-section">
            <div className="ortu-page-heading">
              <div>
                <span className="ortu-eyebrow">CATATAN PRESENSI</span>
                <h2>Riwayat kehadiran</h2>
                <p>Cari catatan berdasarkan tanggal dan lihat foto presensi anak.</p>
              </div>
            </div>

            <div className="ortu-search-panel">
              <div className="ortu-search-field ortu-search-keyword">
                <label htmlFor="kata-riwayat">Kata kunci</label>
                <input
                  id="kata-riwayat"
                  value={kataRiwayat}
                  onChange={(e) => setKataRiwayat(e.target.value)}
                  placeholder="Mata pelajaran, tutor, atau catatan..."
                />
              </div>

              <div className="ortu-search-field">
                <label htmlFor="riwayat-mulai">Tanggal mulai</label>
                <input
                  id="riwayat-mulai"
                  type="date"
                  value={tanggalRiwayatMulai}
                  onChange={(e) => setTanggalRiwayatMulai(e.target.value)}
                />
              </div>

              <div className="ortu-search-field">
                <label htmlFor="riwayat-selesai">Tanggal selesai</label>
                <input
                  id="riwayat-selesai"
                  type="date"
                  value={tanggalRiwayatSelesai}
                  onChange={(e) => setTanggalRiwayatSelesai(e.target.value)}
                  min={tanggalRiwayatMulai || undefined}
                />
              </div>

              <div className="ortu-search-field">
                <label htmlFor="status-riwayat">Status kehadiran</label>
                <select
                  id="status-riwayat"
                  value={statusRiwayat}
                  onChange={(e) => setStatusRiwayat(e.target.value)}
                >
                  <option value="semua">Semua status</option>
                  <option value="hadir">Hadir</option>
                  <option value="izin">Izin</option>
                  <option value="sakit">Sakit</option>
                  <option value="alfa">Tidak hadir</option>
                  <option value="belum">Belum diisi</option>
                </select>
              </div>

              <button
                type="button"
                className="ortu-secondary-button"
                onClick={resetRiwayat}
              >
                Reset pencarian
              </button>
            </div>

            <div className="ortu-results-heading">
              <strong>{riwayatTerfilter.length} catatan ditemukan</strong>
              <span>Urutan tanggal terbaru ke terlama</span>
            </div>

            {riwayatTerfilter.length === 0 ? (
              <div className="ortu-empty-state">
                <span className="ortu-empty-icon">◷</span>
                <h3>Catatan tidak ditemukan</h3>
                <p>Ubah tanggal, kata kunci, atau status untuk mencoba lagi.</p>
              </div>
            ) : (
              <div className="ortu-attendance-list">
                {riwayatTerfilter.map((item, index) => {
                  const foto = fotoValid(item.foto_presensi);

                  return (
                    <article
                      className="ortu-attendance-card"
                      key={item.presensi_id ?? item.id ?? index}
                    >
                      <div className={`ortu-attendance-icon ${normalisasiStatus(item.status)}`}>
                        {normalisasiStatus(item.status) === "hadir" ? "✓" : "◷"}
                      </div>

                      <div className="ortu-attendance-content">
                        <div className="ortu-attendance-heading">
                          <h3>{namaPelajaran(item)}</h3>
                          <span className={`ortu-status status-${normalisasiStatus(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        </div>

                        <p>{formatTanggal(item.tanggal)}</p>
                        <p>
                          {formatJam(item.jam_mulai)}–{formatJam(item.jam_selesai)}
                          {" · "}Tutor: {item.nama_tutor || "-"}
                        </p>

                        {item.catatan && (
                          <p className="ortu-attendance-note">{item.catatan}</p>
                        )}

                        <button
                          type="button"
                          className="ortu-text-button"
                          onClick={() => bukaDetail(item)}
                        >
                          Lihat detail pertemuan →
                        </button>
                      </div>

                      {foto ? (
                        <button
                          type="button"
                          className="ortu-photo-preview"
                          onClick={() => bukaDetail(item)}
                          aria-label="Lihat foto presensi"
                        >
                          <img src={foto} alt="Foto presensi anak" loading="lazy" />
                          <span>Foto presensi</span>
                        </button>
                      ) : (
                        <div className="ortu-photo-missing">
                          <span>▧</span>
                          <small>Belum ada foto</small>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <footer className="ortu-footer">
          <strong>manuli ♡</strong>
          <span>Teman belajar, tumbuh bersama.</span>
        </footer>
      </section>

      {detail && (
        <div
          className="ortu-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) tutupDetail();
          }}
        >
          <section
            className="ortu-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-judul"
          >
            <div className="ortu-modal-header">
              <div>
                <span className="ortu-eyebrow">DETAIL PERTEMUAN</span>
                <h2 id="detail-judul">{namaPelajaran(detail)}</h2>
                <p>{formatTanggal(detail.tanggal)}</p>
              </div>

              <button
                type="button"
                className="ortu-modal-close"
                onClick={tutupDetail}
                aria-label="Tutup detail"
              >
                ×
              </button>
            </div>

            <div className="ortu-detail-status-row">
              <span className={`ortu-status status-${normalisasiStatus(detail.status)}`}>
                {statusLabel(detail.status)}
              </span>
            </div>

            {fotoValid(detail.foto_presensi) ? (
              <div className="ortu-detail-photo">
                <button
                  type="button"
                  className="ortu-detail-photo-button"
                  onClick={() => setFotoBesar(true)}
                >
                  <img
                    src={fotoValid(detail.foto_presensi)}
                    alt={`Foto presensi ${nama}`}
                  />
                  <span>Perbesar foto ↗</span>
                </button>
              </div>
            ) : (
              <div className="ortu-photo-missing ortu-photo-missing-large">
                <span>▧</span>
                <strong>Foto belum tersedia</strong>
                <small>Foto akan terlihat jika tutor atau admin sudah mengunggahnya.</small>
              </div>
            )}

            <div className="ortu-detail-grid">
              <div>
                <span>Nama peserta</span>
                <strong>{nama}</strong>
              </div>
              <div>
                <span>Tanggal</span>
                <strong>{formatTanggal(detail.tanggal)}</strong>
              </div>
              <div>
                <span>Waktu</span>
                <strong>
                  {formatJam(detail.jam_mulai)}–{formatJam(detail.jam_selesai)}
                </strong>
              </div>
              <div>
                <span>Nama tutor</span>
                <strong>{detail.nama_tutor || "-"}</strong>
              </div>
              <div>
                <span>Lokasi</span>
                <strong>{detail.lokasi || "-"}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{statusLabel(detail.status)}</strong>
              </div>
            </div>

            <div className="ortu-detail-note">
              <span>Materi yang dipelajari</span>
              <p>{detail.materi || "Belum ada materi yang dicatat."}</p>
            </div>

            <div className="ortu-detail-note">
              <span>Kesimpulan pemahaman</span>
              <p>{detail.kesimpulan || "Belum ada kesimpulan yang dicatat."}</p>
            </div>

            {detail.catatan && (
              <div className="ortu-detail-note">
                <span>Catatan tutor</span>
                <p>{detail.catatan}</p>
              </div>
            )}

            <div className="ortu-modal-actions">
              <button
                type="button"
                className="ortu-primary-button"
                onClick={tutupDetail}
              >
                Tutup detail
              </button>
            </div>
          </section>
        </div>
      )}

      {fotoBesar && detail && fotoValid(detail.foto_presensi) && (
        <div
          className="ortu-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Foto presensi ukuran besar"
          onClick={() => setFotoBesar(false)}
        >
          <button
            type="button"
            className="ortu-lightbox-close"
            onClick={() => setFotoBesar(false)}
            aria-label="Tutup foto"
          >
            ×
          </button>
          <img
            src={fotoValid(detail.foto_presensi)}
            alt={`Foto presensi ${nama}`}
            onClick={(event) => event.stopPropagation()}
          />
          <p>{nama} · {formatTanggal(detail.tanggal)}</p>
        </div>
      )}
    </main>
  );
}
