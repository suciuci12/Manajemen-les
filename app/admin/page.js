
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "./admin.css";

const navigation = [
  { icon: "⌂", label: "Dashboard", href: "/admin", active: true },
  { icon: "♙", label: "Data Peserta", href: "/admin/peserta" },
    {
    icon: "♙♙",
    label: "Data Orang Tua",
    href: "/admin/orang-tua",
  },
  
  { icon: "♧", label: "Data Tutor", href: "/admin/tutor" },
  { icon: "▦", label: "Jadwal Les", href: "/admin/jadwal" },
  { icon: "✓", label: "Presensi", href: "/admin/presensi" },
];

const quickActions = [
  {
    icon: "＋",
    title: "Tambah Peserta",
    description: "Daftarkan peserta les baru",
    href: "/admin/peserta/tambah",
    theme: "action-purple",
  },
  {
    icon: "♙",
    title: "Data Peserta",
    description: "Lihat daftar peserta les",
    href: "/admin/peserta",
    theme: "action-blue",
  },
    {
    icon: "♧",
    title: "Data Orang Tua",
    description: "Kelola data dan akun login orang tua peserta les.",
    href: "/admin/orang-tua",
    theme: "purple",
  },
  {
    icon: "♧",
    title: "Data Tutor",
    description: "Kelola informasi tutor",
    href: "/admin/tutor",
    theme: "action-orange",
  },

  {
    icon: "▦",
    title: "Jadwal Les",
    description: "Atur jadwal pembelajaran",
    href: "/admin/jadwal",
    theme: "action-green",
  },
];

function getCount(data, keys) {
  for (const key of keys) {
    const value = data?.[key];

    if (typeof value === "number") {
      return value;
    }

    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }

    if (Array.isArray(value) && value.length > 0) {
      const nested = value[0]?.total ?? value[0]?.jumlah;

      if (
        nested !== undefined &&
        Number.isFinite(Number(nested))
      ) {
        return Number(nested);
      }
    }
  }

  return null;
}

export default function AdminDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState({
    peserta: null,
    tutor: null,
    orangTua: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      try {
        const response = await fetch("/api/admin/summary", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Gagal memuat statistik."
          );
        }

        const data = result.data ?? result;

        if (active) {
          setStats({
            peserta: getCount(data, [
              "peserta",
              "totalPeserta",
              "jumlahPeserta",
            ]),
            tutor: getCount(data, [
              "tutor",
              "totalTutor",
              "jumlahTutor",
            ]),
            orangTua: getCount(data, [
              "orangTua",
              "orang_tua",
              "totalOrangTua",
              "jumlahOrangTua",
            ]),
          });

          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || "Statistik belum dapat ditampilkan."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const cards = [
    {
      label: "Total Peserta",
      value: stats.peserta,
      icon: "♙",
      theme: "purple",
      description: "Peserta terdaftar",
      href: "/admin/peserta",
    },
    {
      label: "Total Tutor",
      value: stats.tutor,
      icon: "♧",
      theme: "green",
      description: "Tutor dalam sistem",
      href: "/admin/tutor",
    },
    {
      label: "Total Orang Tua",
      value: stats.orangTua,
      icon: "♡",
      theme: "orange",
      description: "Akun orang tua",
      href: "/admin/peserta",
    },
  ];

  function closeMobileSidebar() {
    setMobileOpen(false);
  }

  // Fungsi logout
 
async function handleLogout() {
  if (loggingOut) return;

  const yakin = window.confirm("Apakah Anda yakin ingin keluar dari akun?");
  if (!yakin) return;

  setLoggingOut(true);

  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Gagal keluar dari akun.");
    }

    router.replace("/login");
    router.refresh();
  } catch (error) {
    alert(error.message || "Terjadi kesalahan saat keluar.");
  } finally {
    setLoggingOut(false);
  }
}


  return (
    <div
      className={`manuli-layout ${
        collapsed ? "sidebar-collapsed" : ""
      } ${mobileOpen ? "mobile-sidebar-open" : ""}`}
    >
      {/* OVERLAY SIDEBAR MOBILE */}
      <button
        type="button"
        className="sidebar-overlay"
        aria-label="Tutup menu navigasi"
        onClick={closeMobileSidebar}
        tabIndex={mobileOpen ? 0 : -1}
      />

      {/* SIDEBAR MENGAMBANG */}
      <aside
        className={`manuli-sidebar ${
          collapsed ? "is-collapsed" : ""
        } ${mobileOpen ? "is-mobile-open" : ""}`}
        aria-label="Navigasi utama"
      >
        <div className="sidebar-glass-highlight" />

        <div className="sidebar-header">
          <Link
            href="/admin"
            className="manuli-brand"
            onClick={closeMobileSidebar}
            aria-label="Manuli Dashboard"
          >
            <span className="brand-mark">M</span>

            <span className="brand-copy">
              <strong>manuli</strong>
              <small>LEARNING SPACE</small>
            </span>
          </Link>

          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => {
              setCollapsed((previous) => !previous);
              setMobileOpen(false);
            }}
            aria-label={
              collapsed
                ? "Perluas sidebar"
                : "Ciutkan sidebar"
            }
            title={
              collapsed
                ? "Perluas sidebar"
                : "Ciutkan sidebar"
            }
          >
            <span className="toggle-chevron">
              {collapsed ? "›" : "‹"}
            </span>
          </button>
        </div>

        <div className="sidebar-caption">
          <span className="sidebar-caption-text">
            MENU UTAMA
          </span>
          <span className="sidebar-caption-line" />
        </div>

        <nav className="sidebar-navigation">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={item.active ? "page" : undefined}
              onClick={closeMobileSidebar}
              className={`sidebar-link ${
                item.active ? "sidebar-link-active" : ""
              }`}
            >
              <span
                className="sidebar-link-icon"
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <span className="sidebar-link-label">
                {item.label}
              </span>

              {item.active && (
                <span className="sidebar-active-indicator" />
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help-icon">?</div>

          <div className="sidebar-help-copy">
            <strong>Butuh bantuan?</strong>

            <p>
              Kelola kegiatan belajar dengan lebih mudah.
            </p>

            <Link
              href="/admin/peserta"
              className="sidebar-help-link"
              onClick={closeMobileSidebar}
            >
              Jelajahi menu <span>→</span>
            </Link>
          </div>

          {/* TOMBOL KELUAR */}
          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? "Keluar" : undefined}
          >
            <span
              className="sidebar-logout-icon"
              aria-hidden="true"
            >
              ↪
            </span>

            <span className="sidebar-logout-label">
              {loggingOut ? "Sedang keluar..." : "Keluar"}
            </span>
          </button>
        </div>

        <div className="sidebar-brand-footer">
          <span className="sidebar-footer-dot" />

          <span className="sidebar-footer-text">
            Manuli Admin Panel
          </span>
        </div>
      </aside>

      {/* AREA KONTEN */}
      <main className="manuli-main">
        <header className="manuli-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              aria-label="Buka menu navigasi"
              onClick={() => setMobileOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>

            <div className="topbar-breadcrumb">
              <span>Manuli</span>
              <span className="breadcrumb-divider">/</span>
              <strong>Dashboard</strong>
            </div>
          </div>

          <div className="topbar-right">
            <span className="topbar-status">
              <span className="topbar-status-dot" />
              Panel Administrasi
            </span>

            <div className="topbar-divider" />

            <div className="admin-profile">
              <div className="admin-avatar">S</div>

              <div className="admin-profile-copy">
                <strong>Suci Indah Sari</strong>
                <span>Administrator</span>
              </div>

              <span className="profile-chevron">⌄</span>
            </div>
          </div>
        </header>

        <div className="manuli-content">
          {/* HERO */}
          <section className="dashboard-hero">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="hero-badge-dot" />
                RUANG ADMINISTRASI MANULI
              </div>

              <h1>
                Halo, Admin!
                <br />
                <span>Selamat datang kembali.</span>
              </h1>

              <p>
                Semua yang kamu butuhkan untuk mengelola
                kegiatan belajar ada di sini. Yuk, buat
                pengalaman belajar menjadi lebih teratur!
              </p>

              <div className="hero-actions">
                <Link
                  href="/admin/peserta/tambah"
                  className="hero-primary-button"
                >
                  <span>＋</span>
                  Tambah Peserta
                  <span className="hero-button-arrow">→</span>
                </Link>

                <Link
                  href="/admin/peserta"
                  className="hero-secondary-button"
                >
                  Lihat Data <span>↗</span>
                </Link>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="hero-orbit hero-orbit-one" />
              <div className="hero-orbit hero-orbit-two" />
              <div className="hero-orbit hero-orbit-three" />

              <div className="hero-floating-card floating-card-top">
                <span className="floating-card-icon">✦</span>

                <div>
                  <strong>Belajar</strong>
                  <small>Jadi lebih teratur</small>
                </div>
              </div>

              <div className="hero-logo-circle">
                <span>M</span>
              </div>

              <div className="hero-floating-card floating-card-bottom">
                <span className="floating-check">✓</span>

                <div>
                  <strong>Manuli</strong>
                  <small>Learn & grow</small>
                </div>
              </div>

              <span className="hero-spark hero-spark-one">✦</span>
              <span className="hero-spark hero-spark-two">✧</span>
              <span className="hero-spark hero-spark-three">✦</span>
            </div>

            <div className="hero-bottom-decoration" />
          </section>

          {/* STATISTIK */}
          <section className="dashboard-section">
            <div className="section-title-row">
              <div>
                <span className="section-overline">
                  GAMBARAN UMUM
                </span>

                <h2>Ringkasan Dashboard</h2>

                <p>
                  Pantau informasi utama sistem Manuli.
                </p>
              </div>

              <span className="section-updated">
                <span />
                Data dari sistem
              </span>
            </div>

            <div className="modern-stats-grid">
              {cards.map((card, index) => (
                <Link
                  href={card.href}
                  key={card.label}
                  className={`modern-stat-card modern-stat-${card.theme}`}
                  style={{
                    animationDelay: `${index * 90}ms`,
                  }}
                >
                  <div className="modern-stat-top">
                    <span className="modern-stat-label">
                      {card.label}
                    </span>

                    <span
                      className="modern-stat-icon"
                      aria-hidden="true"
                    >
                      {card.icon}
                    </span>
                  </div>

                  <div className="modern-stat-value">
                    {loading ? (
                      <span
                        className="stat-loading"
                        aria-label="Memuat statistik"
                      />
                    ) : card.value === null ? (
                      "—"
                    ) : (
                      card.value.toLocaleString("id-ID")
                    )}
                  </div>

                  <div className="modern-stat-footer">
                    <span className="stat-footer-dot" />
                    {card.description}
                  </div>

                  <span className="modern-stat-arrow">↗</span>
                </Link>
              ))}
            </div>

            {error && (
              <div
                className="modern-dashboard-alert"
                role="alert"
              >
                <span className="alert-symbol">!</span>

                <div>
                  <strong>Statistik belum tersedia</strong>

                  <p>
                    {error} Periksa kembali endpoint
                    {" "}/api/admin/summary.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* AKSI CEPAT */}
          <section className="dashboard-section quick-section">
            <div className="section-title-row">
              <div>
                <span className="section-overline">
                  NAVIGASI PRAKTIS
                </span>

                <h2>Apa yang ingin kamu lakukan?</h2>

                <p>
                  Buka fitur yang kamu perlukan dalam satu klik.
                </p>
              </div>

              <span className="quick-section-symbol">✳</span>
            </div>

            <div className="modern-quick-grid">
              {quickActions.map((item, index) => (
                <Link
                  href={item.href}
                  key={item.title}
                  onClick={closeMobileSidebar}
                  className="modern-quick-card"
                  style={{
                    animationDelay: `${index * 70}ms`,
                  }}
                >
                  <span
                    className={`quick-action-icon ${item.theme}`}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>

                  <div className="quick-action-copy">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>

                  <span className="quick-action-arrow">↗</span>
                </Link>
              ))}
            </div>
          </section>

          {/* BANNER */}
          <section className="dashboard-bottom-banner">
            <div className="bottom-banner-content">
              <span className="bottom-banner-kicker">
                <span>✦</span> TUMBUH BERSAMA MANULI
              </span>

              <h2>
                Pendidikan yang baik dimulai
                <br className="banner-break" /> dari pengelolaan
                yang teratur.
              </h2>

              <p>
                Ciptakan pengalaman belajar yang lebih nyaman
                bagi peserta, tutor, dan orang tua.
              </p>

              <Link
                href="/admin/peserta"
                className="bottom-banner-link"
              >
                Kelola peserta sekarang <span>→</span>
              </Link>
            </div>

            <div
              className="bottom-banner-art"
              aria-hidden="true"
            >
              <div className="banner-art-circle banner-art-circle-one" />
              <div className="banner-art-circle banner-art-circle-two" />
              <div className="banner-art-book">▤</div>

              <span className="banner-art-star banner-art-star-one">
                ✦
              </span>

              <span className="banner-art-star banner-art-star-two">
                ✧
              </span>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="manuli-footer">
            <span>© 2026 Manuli Learning Space</span>

            <div className="footer-credit">
              <span>Dikembangkan dengan</span>
              <span className="footer-heart">♥</span>
              <strong>Suci Indah Sari</strong>
              <span className="footer-founder-badge">
                FOUNDER
              </span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
