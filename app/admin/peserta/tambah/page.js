
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import "./tambah.css";

const initialForm = {
  nama: "",
  jenis_kelamin: "",
  tanggal_lahir: "",
  sekolah: "",
  no_hp: "",
  email: "",
  orang_tua_id: "",
};

export default function TambahPesertaPage() {
  const [form, setForm] = useState(initialForm);
  const [orangTua, setOrangTua] = useState([]);
  const [loadingOrangTua, setLoadingOrangTua] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrangTua() {
      try {
        const response = await fetch("/api/admin/orang-tua");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Gagal mengambil data orang tua."
          );
        }

        if (active) {
          const data = result.data ?? result.orangTua ?? result;
          setOrangTua(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Data orang tua gagal dimuat.");
        }
      } finally {
        if (active) setLoadingOrangTua(false);
      }
    }

    loadOrangTua();

    return () => {
      active = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/peserta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          orang_tua_id: form.orang_tua_id || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Data peserta gagal disimpan."
        );
      }

      setSuccess("Data peserta berhasil disimpan.");
      setForm(initialForm);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="peserta-page">
      <div className="peserta-heading">
        <div>
          <div className="peserta-eyebrow">
            <span className="peserta-live-dot" />
            MANAJEMEN PESERTA
          </div>

          <h1>Tambah Peserta</h1>

          <p>
            Lengkapi informasi peserta agar data les tersimpan
            dengan rapi.
          </p>
        </div>

        <Link href="/admin/peserta" className="peserta-back-button">
          <span aria-hidden="true">←</span>
          Kembali ke Data Peserta
        </Link>
      </div>

      <div className="peserta-form-layout">
        <section className="peserta-form-card">
          <div className="peserta-form-card-heading">
            <div className="peserta-form-heading-icon">♙</div>

            <div>
              <h2>Informasi Peserta</h2>
              <p>Isi data sesuai informasi peserta yang sebenarnya.</p>
            </div>
          </div>

          <div className="peserta-form-divider" />

          <form onSubmit={handleSubmit}>
            <div className="peserta-form-section-title">
              <span>01</span>
              Data Pribadi
            </div>

            <div className="peserta-form-grid">
              <div className="peserta-field peserta-field-full">
                <label htmlFor="nama">
                  Nama Lengkap <span>*</span>
                </label>

                <input
                  id="nama"
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap peserta"
                  required
                  maxLength={150}
                />
              </div>

              <div className="peserta-field">
                <label htmlFor="jenis_kelamin">
                  Jenis Kelamin <span>*</span>
                </label>

                <select
                  id="jenis_kelamin"
                  name="jenis_kelamin"
                  value={form.jenis_kelamin}
                  onChange={handleChange}
                  required
                >
                  <option value="">Pilih jenis kelamin</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div className="peserta-field">
                <label htmlFor="tanggal_lahir">
                  Tanggal Lahir
                </label>

                <input
                  id="tanggal_lahir"
                  name="tanggal_lahir"
                  type="date"
                  value={form.tanggal_lahir}
                  onChange={handleChange}
                />
              </div>

              <div className="peserta-field peserta-field-full">
                <label htmlFor="sekolah">Asal Sekolah</label>

                <textarea
                  id="sekolah"
                  name="sekolah"
                  value={form.sekolah}
                  onChange={handleChange}
                  placeholder="Masukkan sekolah tempat tinggal"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="peserta-form-section-title peserta-section-spaced">
              <span>02</span>
              Informasi Kontak
            </div>

            <div className="peserta-form-grid">
              <div className="peserta-field">
                <label htmlFor="no_hp">Nomor HP</label>

                <input
                  id="no_hp"
                  name="no_hp"
                  type="tel"
                  value={form.no_hp}
                  onChange={handleChange}
                  placeholder="Contoh: 081234567890"
                  maxLength={20}
                />
              </div>

              <div className="peserta-field">
                <label htmlFor="email">Email Peserta</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  maxLength={150}
                />
              </div>
            </div>

            <div className="peserta-form-section-title peserta-section-spaced">
              <span>03</span>
              Akun Orang Tua
            </div>

            <div className="peserta-form-grid">
              <div className="peserta-field peserta-field-full">
                <label htmlFor="orang_tua_id">
                  Hubungkan Akun Orang Tua
                </label>

                <select
                  id="orang_tua_id"
                  name="orang_tua_id"
                  value={form.orang_tua_id}
                  onChange={handleChange}
                  disabled={loadingOrangTua}
                >
                  <option value="">
                    {loadingOrangTua
                      ? "Memuat data orang tua..."
                      : "Belum dihubungkan"}
                  </option>

                  {orangTua.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.nama || item.name || item.email}
                      {item.email ? ` — ${item.email}` : ""}
                    </option>
                  ))}
                </select>

                <small>
                  Pilih akun orang tua jika sudah tersedia.
                  Bagian ini boleh dikosongkan.
                </small>
              </div>
            </div>

            {error && (
              <div className="peserta-message peserta-message-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            {success && (
              <div
                className="peserta-message peserta-message-success"
                role="status"
              >
                <span>✓</span>
                {success}
              </div>
            )}

            <div className="peserta-form-actions">
              <button
                type="button"
                className="peserta-reset-button"
                onClick={() => {
                  setForm(initialForm);
                  setError("");
                  setSuccess("");
                }}
                disabled={saving}
              >
                Kosongkan Formulir
              </button>

              <button
                type="submit"
                className="peserta-submit-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="peserta-button-spinner" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Simpan Peserta
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        <aside className="peserta-info-card">
          <div className="peserta-info-art">
            <div className="peserta-info-ring ring-outer" />
            <div className="peserta-info-ring ring-inner" />
            <div className="peserta-info-symbol">M</div>
            <span className="peserta-info-star star-a">✦</span>
            <span className="peserta-info-star star-b">✧</span>
          </div>

          <span className="peserta-info-label">TIPS MANULI</span>

          <h2>Data rapi, belajar lebih nyaman.</h2>

          <p>
            Pastikan informasi peserta benar agar pengelolaan
            jadwal, presensi, dan komunikasi dengan orang tua
            lebih mudah.
          </p>

          <div className="peserta-info-note">
            <span>✦</span>
            <p>
              Kolom dengan tanda bintang (*) wajib diisi.
            </p>
          </div>

          <div className="peserta-info-credit">
            Suci Indah Sari
            <span>Founder Manuli</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
