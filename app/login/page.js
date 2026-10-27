
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Login gagal. Periksa email dan kata sandi."
        );
      }

      const destinations = {
        admin: "/admin",
        tutor: "/tutor",
        orang_tua: "/orang-tua",
      };

      const destination = destinations[result.user?.role];

      if (!destination) {
        throw new Error("Jenis akun tidak dikenali.");
      }

      router.replace(destination);
    } catch (err) {
      setError(
        err.message || "Terjadi kesalahan. Silakan coba kembali."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      {/* Cahaya dekoratif latar belakang */}
      <div className="login-background-glow glow-left" />
      <div className="login-background-glow glow-right" />

      <div className="login-card">
        {/* =================================
            BAGIAN KIRI: FORM LOGIN
        ================================== */}
        <section className="login-form-panel">
          <a href="/login" className="login-brand">
            <span className="login-brand-icon">M</span>

            <span className="login-brand-text">
              <strong>MANULI</strong>
              <small>SISTEM MANAJEMEN LES</small>
            </span>
          </a>

          <div className="login-heading">
            <div className="login-eyebrow">
              <span className="status-light" />
              SELAMAT DATANG
            </div>

            <h1>
              Senang bertemu
              <br />
              <span>kembali!</span>
            </h1>

            <p>
              Masuk ke akun Anda dan kelola kegiatan belajar
              bersama Manuli dengan lebih mudah.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email">ALAMAT EMAIL</label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="nama@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">KATA SANDI</label>

              <div className="login-password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Lihat kata sandi"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? "SEMBUNYIKAN" : "LIHAT"}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <span className="error-icon">!</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              <span>
                {loading ? "SEDANG MEMPROSES..." : "MASUK KE AKUN"}
              </span>

              <span className="login-submit-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </form>

          <div className="login-divider">
            <span />
            <small>AKSES PENGGUNA MANULI</small>
            <span />
          </div>

          <div className="login-roles">
            <span className="login-role-item">
              <i className="role-dot role-admin" />
              Admin
            </span>

            <span className="login-role-item">
              <i className="role-dot role-tutor" />
              Tutor
            </span>

            <span className="login-role-item">
              <i className="role-dot role-parent" />
              Orang Tua
            </span>
          </div>

          {/* Kredit pendiri */}
          <div className="login-founder">
            <div className="founder-line" />

            <p>Dirancang dan dikembangkan oleh</p>
            <strong>Suci Indah Sari</strong>

            <span className="founder-title">
              FOUNDER MANULI
            </span>
          </div>

          <p className="login-footer">
            © 2026 Manuli
            <span>✦</span>
            Tumbuh dan belajar bersama
          </p>
        </section>

        {/* =================================
            BAGIAN KANAN: MASKOT ANIMASI
        ================================== */}
        <aside className="login-visual">
          <div className="visual-grid" />

          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />

          <div className="visual-topline">
            <span>RUANG DIGITAL MANULI</span>

            <span className="visual-live">
              <i />
              SIAP DIGUNAKAN
            </span>
          </div>

          <div className="visual-center">
            {/* Maskot */}
            <div className="mascot-stage">
              <div className="mascot-glow" />
              <div className="mascot-halo" />

              <img
                src="/images/manuli-code.jpeg"
                alt="Maskot Manuli Code"
                className="manuli-mascot"
              />

              {/* Efek bintang */}
              <span className="mascot-sparkle sparkle-one">✦</span>
              <span className="mascot-sparkle sparkle-two">✧</span>
              <span className="mascot-sparkle sparkle-three">✦</span>
              <span className="mascot-sparkle sparkle-four">✧</span>

              {/* Titik cahaya */}
              <span className="mascot-dot dot-one" />
              <span className="mascot-dot dot-two" />
              <span className="mascot-dot dot-three" />
            </div>

            <div className="visual-label">
              TEMAN BELAJAR KAMU
            </div>

            <h2>
              Belajar jadi lebih seru,
              <br />
              <span>tumbuh bersama Manuli!</span>
            </h2>

            <p className="visual-description">
              Satu tempat untuk mengelola jadwal les, peserta,
              dan kehadiran dengan lebih mudah.
            </p>

            <div className="visual-features">
              <div className="visual-feature">
                <span className="feature-icon">✓</span>
                <span>Jadwal les lebih teratur</span>
              </div>

              <div className="visual-feature">
                <span className="feature-icon">✓</span>
                <span>Data peserta mudah dikelola</span>
              </div>

              <div className="visual-feature">
                <span className="feature-icon">✓</span>
                <span>Kehadiran mudah dipantau</span>
              </div>
            </div>

            <div className="visual-line">
              <span />
            </div>
          </div>

          <div className="visual-bottom">
            <span>PLATFORM MANAJEMEN PEMBELAJARAN</span>
            <span>MANULI ✦</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
