
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "../tutor.css";
import TutorSidebar from "../TutorSidebar";

export default function PesertaTutorPage() {
  const [peserta, setPeserta] = useState([]);
  const [pencarian, setPencarian] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [pesan, setPesan] = useState("");
  const [tahunSekarang, setTahunSekarang] = useState(null);

  useEffect(() => {
    setTahunSekarang(new Date().getFullYear());
  }, []);

  useEffect(() => {
    let aktif = true;

    async function ambilPeserta() {
      try {
        const response = await fetch("/api/tutor/peserta", {
          cache: "no-store",
        });

        const hasil = await response.json();

        if (!response.ok) {
          throw new Error(
            hasil.message || "Data peserta gagal dimuat."
          );
        }

        if (aktif) {
          setPeserta(Array.isArray(hasil.data) ? hasil.data : []);
          setPesan("");
        }
      } catch (error) {
        if (aktif) {
          setPesan(error.message || "Terjadi kesalahan.");
        }
      } finally {
        if (aktif) {
          setMemuat(false);
        }
      }
    }

    ambilPeserta();

    return () => {
      aktif = false;
    };
  }, []);

  const pesertaTersaring = useMemo(() => {
    const kata = pencarian.trim().toLowerCase();

    if (!kata) return peserta;

    return peserta.filter((item) =>
      [item.nama, item.sekolah, item.id].some((nilai) =>
        String(nilai ?? "").toLowerCase().includes(kata)
      )
    );
  }, [peserta, pencarian]);

  function formatTanggal(value) {
    if (!value) return "-";

    const teks = String(value).slice(0, 10);
    const cocok = teks.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!cocok) return "-";

    const [, tahun, bulan, hari] = cocok;

    const tanggal = new Date(
      Date.UTC(
        Number(tahun),
        Number(bulan) - 1,
        Number(hari)
      )
    );

    if (
      tanggal.getUTCFullYear() !== Number(tahun) ||
      tanggal.getUTCMonth() !== Number(bulan) - 1 ||
      tanggal.getUTCDate() !== Number(hari)
    ) {
      return "-";
    }

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(tanggal);
  }

  return (
    <main className="tutor-dashboard">
      {/* SIDEBAR BERSAMA */}
      <TutorSidebar />

      {/* KONTEN UTAMA */}
      <section className="tutor-main">
        <header className="tutor-topbar">
          <div>
            <span className="tutor-eyebrow">
              RUANG MENGAJAR
            </span>
            <h1>Data Peserta</h1>
            <p>
              Lihat informasi peserta yang terhubung dengan
              kegiatan mengajar Anda.
            </p>
          </div>

          <div className="tutor-topbar-actions">
            <Link
              href="/tutor"
              className="tutor-back-button"
            >
              <span>←</span>
              Dashboard
            </Link>
          </div>
        </header>

        {/* BANNER */}
        <section className="tutor-welcome">
          <div className="tutor-welcome-content">
            <span className="tutor-welcome-label">
              DATA PEMBELAJARAN ✨
            </span>

            <h2>Kenali peserta les Anda.</h2>

            <p>
              Temukan informasi peserta dengan mudah dan
              persiapkan kegiatan belajar dengan lebih baik.
            </p>

            <Link
              href="/tutor/jadwal"
              className="tutor-primary-button"
            >
              Lihat Jadwal Les <span>→</span>
            </Link>
          </div>

          <div className="tutor-welcome-art" aria-hidden="true">
            <div className="tutor-art-circle">
              <span className="tutor-art-star tutor-star-one">
                ✦
              </span>

              <span className="tutor-art-star tutor-star-two">
                ✧
              </span>

              <div className="tutor-art-book">📚</div>
              <div className="tutor-art-pencil">✎</div>
              <div className="tutor-art-heart">♡</div>
            </div>
          </div>
        </section>

        {/* RINGKASAN */}
        <section className="tutor-section">
          <div className="tutor-section-heading">
            <div>
              <h2>Ringkasan Peserta</h2>
              <p>
                Informasi peserta berdasarkan data yang tersedia.
              </p>
            </div>

            <span className="tutor-section-tag">
              DATA PESERTA
            </span>
          </div>

          <div
            className="tutor-stats-grid"
            style={{
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            }}
          >
            <article className="tutor-stat-card stat-purple">
              <div className="tutor-stat-top">
                <span>Total Peserta</span>
                <span className="tutor-stat-icon">♙</span>
              </div>

              <strong>{memuat ? "—" : peserta.length}</strong>

              <p>Jumlah peserta yang dikembalikan API</p>
            </article>

            <article className="tutor-stat-card stat-green">
              <div className="tutor-stat-top">
                <span>Hasil Pencarian</span>
                <span className="tutor-stat-icon">⌕</span>
              </div>

              <strong>
                {memuat ? "—" : pesertaTersaring.length}
              </strong>

              <p>Peserta yang sesuai dengan kata kunci</p>
            </article>
          </div>
        </section>

        {/* DAFTAR PESERTA */}
        <section className="tutor-section">
          <div className="tutor-section-heading">
            <div>
              <h2>Daftar Peserta</h2>
              <p>
                Cari berdasarkan nama, sekolah, atau ID peserta.
              </p>
            </div>
          </div>

          <div className="tutor-schedule-toolbar">
            <label className="tutor-search-box">
              <span>⌕</span>

              <input
                type="search"
                placeholder="Cari nama, sekolah, atau ID peserta..."
                value={pencarian}
                onChange={(event) =>
                  setPencarian(event.target.value)
                }
                aria-label="Cari peserta"
              />
            </label>
          </div>

          {memuat ? (
            <div className="tutor-empty-card">
              <div className="tutor-empty-icon">◌</div>
              <h3>Memuat data peserta...</h3>
              <p>Mohon tunggu sebentar.</p>
            </div>
          ) : pesan ? (
            <div className="tutor-empty-card tutor-error-card">
              <div className="tutor-empty-icon">!</div>
              <h3>Data belum dapat dimuat</h3>
              <p>{pesan}</p>

              <button
                type="button"
                className="tutor-secondary-button"
                onClick={() => window.location.reload()}
              >
                Muat ulang <span>↻</span>
              </button>
            </div>
          ) : pesertaTersaring.length === 0 ? (
            <div className="tutor-empty-card">
              <div className="tutor-empty-icon">♙</div>

              <h3>
                {peserta.length === 0
                  ? "Belum ada peserta"
                  : "Peserta tidak ditemukan"}
              </h3>

              <p>
                {peserta.length === 0
                  ? "Peserta akan ditampilkan jika API mengembalikan data untuk akun tutor Anda."
                  : "Coba gunakan kata kunci pencarian lain."}
              </p>
            </div>
          ) : (
            <div className="tutor-table-wrapper">
              <table className="tutor-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Nama Peserta</th>
                    <th>Tanggal Lahir</th>
                    <th>Sekolah</th>
                    <th>ID Peserta</th>
                  </tr>
                </thead>

                <tbody>
                  {pesertaTersaring.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>

                      <td>
                        <div className="tutor-person-cell">
                          <span className="tutor-person-avatar">
                            {String(item.nama || "P")
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          <strong>{item.nama || "-"}</strong>
                        </div>
                      </td>

                      <td>
                        {formatTanggal(item.tanggal_lahir)}
                      </td>

                      <td>{item.sekolah || "-"}</td>

                      <td>
                        <span className="tutor-id-badge">
                          {item.id ?? "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="tutor-footer">
          <span className="tutor-footer-brand">manuli ♡</span>
          <span>
            © {tahunSekarang ?? "2026"} Manuli. Teman belajar,
            tumbuh bersama.
          </span>
        </footer>
      </section>
    </main>
  );
}
