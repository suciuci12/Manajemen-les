
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./orang-tua.css";

const formAwal = {
  nama: "",
  email: "",
  password: "",
};

async function bacaRespons(response) {
  const teks = await response.text();

  let hasil;

  try {
    hasil = teks ? JSON.parse(teks) : {};
  } catch {
    console.error("Respons API bukan JSON:", teks);
    throw new Error(
      "Respons server tidak valid. Periksa terminal Next.js."
    );
  }

  if (!response.ok) {
    throw new Error(
      hasil.message || `Permintaan gagal (${response.status}).`
    );
  }

  return hasil;
}

export default function OrangTuaPage() {
  const router = useRouter();

  const [data, setData] = useState([]);
  const [pencarian, setPencarian] = useState("");
  const [form, setForm] = useState(formAwal);
  const [editId, setEditId] = useState(null);
  const [modalBuka, setModalBuka] = useState(false);
  const [memuat, setMemuat] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState("");
  const [jenisPesan, setJenisPesan] = useState("error");

  const tampilkanPesan = (teks, jenis = "error") => {
    setPesan(teks);
    setJenisPesan(jenis);
  };

  const ambilData = useCallback(async () => {
    setMemuat(true);

    try {
      const response = await fetch("/api/admin/orang-tua", {
        cache: "no-store",
      });

      const hasil = await bacaRespons(response);
      setData(Array.isArray(hasil.data) ? hasil.data : []);
    } catch (error) {
      tampilkanPesan(
        error.message || "Tidak dapat mengambil data orang tua."
      );
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    ambilData();
  }, [ambilData]);

  const dataTampil = useMemo(() => {
    const kata = pencarian.trim().toLowerCase();

    if (!kata) return data;

    return data.filter(
      (item) =>
        String(item.nama || "").toLowerCase().includes(kata) ||
        String(item.email || "").toLowerCase().includes(kata)
    );
  }, [data, pencarian]);

  const totalAnak = data.reduce(
    (jumlah, item) => jumlah + Number(item.total_anak || 0),
    0
  );

  const akunBelumTerhubung = data.filter(
    (item) => Number(item.total_anak || 0) === 0
  ).length;

  function bukaTambah() {
    setForm({ ...formAwal });
    setEditId(null);
    setPesan("");
    setModalBuka(true);
  }

  function bukaEdit(item) {
    setForm({
      nama: item.nama || "",
      email: item.email || "",
      password: "",
    });

    setEditId(item.id);
    setPesan("");
    setModalBuka(true);
  }

  function tutupModal() {
    if (menyimpan) return;

    setModalBuka(false);
    setForm({ ...formAwal });
    setEditId(null);
    setPesan("");
  }

  function ubahForm(event) {
    const { name, value } = event.target;

    setForm((sebelumnya) => ({
      ...sebelumnya,
      [name]: value,
    }));
  }

  async function simpanData(event) {
    event.preventDefault();
    setPesan("");

    const nama = form.nama.trim();
    const email = form.email.trim().toLowerCase();

    if (!nama || !email) {
      tampilkanPesan("Nama dan email wajib diisi.");
      return;
    }

    if (!editId && !form.password) {
      tampilkanPesan("Kata sandi wajib diisi untuk akun baru.");
      return;
    }

    if (form.password && form.password.length < 8) {
      tampilkanPesan("Kata sandi minimal 8 karakter.");
      return;
    }

    setMenyimpan(true);

    try {
      const payload = {
        nama,
        email,
        password: form.password,
      };

      let method = "POST";

      if (editId) {
        method = "PUT";
        payload.id = editId;
      }

      const response = await fetch("/api/admin/orang-tua", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const hasil = await bacaRespons(response);

      setPesan("");
      setModalBuka(false);
      setForm({ ...formAwal });
      setEditId(null);

      tampilkanPesan(
        hasil.message || "Data berhasil disimpan.",
        "success"
      );

      await ambilData();
    } catch (error) {
      tampilkanPesan(
        error.message || "Gagal menyimpan data orang tua."
      );
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <main className="ortu-page">
      {/* Judul halaman dan navigasi */}
      <section className="ortu-heading">
        <div className="ortu-heading-info">
          <button
            type="button"
            className="ortu-back-btn"
            onClick={() => router.push("/admin")}
          >
            <span className="ortu-back-arrow">←</span>
            Kembali ke Dashboard
          </button>

          <p className="ortu-eyebrow">MANAJEMEN MANULI</p>

          <h1>Data Orang Tua</h1>

          <p className="ortu-subtitle">
            Kelola informasi dan akun masuk orang tua peserta les.
          </p>
        </div>

        <button
          type="button"
          className="ortu-btn ortu-btn-primary"
          onClick={bukaTambah}
        >
          <span className="ortu-btn-icon">＋</span>
          Tambah Orang Tua
        </button>
      </section>

      {/* Pesan hasil operasi */}
      {pesan && !modalBuka && (
        <div
          className={`ortu-alert ${
            jenisPesan === "success" ? "ortu-alert-success" : ""
          }`}
          role="status"
        >
          <span>{jenisPesan === "success" ? "✓" : "!"}</span>
          <p>{pesan}</p>

          <button
            type="button"
            onClick={() => setPesan("")}
            aria-label="Tutup pesan"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistik */}
      <section className="ortu-stat-grid">
        <article className="ortu-stat-card">
          <div className="ortu-stat-icon ortu-icon-purple">♙</div>

          <div>
            <p>Total Orang Tua</p>
            <h2>{data.length}</h2>
            <span>Akun terdaftar</span>
          </div>
        </article>

        <article className="ortu-stat-card">
          <div className="ortu-stat-icon ortu-icon-pink">♡</div>

          <div>
            <p>Total Anak Terhubung</p>
            <h2>{totalAnak}</h2>
            <span>Peserta yang terhubung</span>
          </div>
        </article>

        <article className="ortu-stat-card">
          <div className="ortu-stat-icon ortu-icon-mint">✓</div>

          <div>
            <p>Akun Belum Terhubung</p>
            <h2>{akunBelumTerhubung}</h2>
            <span>Belum terhubung dengan peserta</span>
          </div>
        </article>
      </section>

      {/* Tabel data */}
      <section className="ortu-panel">
        <div className="ortu-panel-heading">
          <div>
            <h2>Daftar Orang Tua</h2>
            <p>
              Informasi akun orang tua yang terdaftar di Manuli.
            </p>
          </div>

          <div className="ortu-search">
            <span className="ortu-search-icon">⌕</span>

            <input
              type="search"
              placeholder="Cari nama atau email..."
              value={pencarian}
              onChange={(event) => setPencarian(event.target.value)}
              aria-label="Cari nama atau email orang tua"
            />
          </div>
        </div>

        <div className="ortu-table-wrap">
          <table className="ortu-table">
            <thead>
              <tr>
                <th>ORANG TUA</th>
                <th>EMAIL</th>
                <th>JUMLAH ANAK</th>
                <th>STATUS</th>
                <th className="ortu-action-column">AKSI</th>
              </tr>
            </thead>

            <tbody>
              {memuat ? (
                <tr>
                  <td colSpan={5} className="ortu-empty">
                    <span className="ortu-spinner" />
                    <p>Memuat data orang tua...</p>
                  </td>
                </tr>
              ) : dataTampil.length === 0 ? (
                <tr>
                  <td colSpan={5} className="ortu-empty">
                    <div className="ortu-empty-icon">♧</div>

                    <strong>
                      {pencarian
                        ? "Data tidak ditemukan"
                        : "Belum ada data orang tua"}
                    </strong>

                    <p>
                      {pencarian
                        ? "Coba gunakan kata pencarian lain."
                        : "Klik Tambah Orang Tua untuk membuat akun baru."}
                    </p>
                  </td>
                </tr>
              ) : (
                dataTampil.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="ortu-person">
                        <div className="ortu-avatar">
                          {String(item.nama || "?")
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="ortu-person-info">
                          <strong>{item.nama}</strong>
                          <span>ID akun: {item.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="ortu-email">{item.email}</td>

                    <td>
                      <span className="ortu-child-count">
                        {Number(item.total_anak || 0)} anak
                      </span>
                    </td>

                    <td>
                      <span className="ortu-status">
                        <span />
                        Terdaftar
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="ortu-edit-btn"
                        onClick={() => bukaEdit(item)}
                      >
                        <span>✎</span>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ortu-table-footer">
          <span>
            Menampilkan {dataTampil.length} dari {data.length} akun
          </span>

          <button
            type="button"
            className="ortu-refresh-btn"
            onClick={ambilData}
            disabled={memuat}
          >
            ↻ Perbarui Data
          </button>
        </div>
      </section>

      {/* Modal tambah dan edit */}
      {modalBuka && (
        <div
          className="ortu-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              tutupModal();
            }
          }}
        >
          <section
            className="ortu-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ortu-modal-title"
          >
            <div className="ortu-modal-heading">
              <div>
                <p className="ortu-eyebrow">PENGELOLAAN AKUN</p>

                <h2 id="ortu-modal-title">
                  {editId ? "Edit Orang Tua" : "Tambah Orang Tua"}
                </h2>

                <p>
                  {editId
                    ? "Perbarui informasi akun orang tua."
                    : "Buat akun agar orang tua dapat masuk ke Manuli."}
                </p>
              </div>

              <button
                type="button"
                className="ortu-close-btn"
                onClick={tutupModal}
                disabled={menyimpan}
                aria-label="Tutup formulir"
              >
                ×
              </button>
            </div>

            {pesan && modalBuka && (
              <div className="ortu-alert ortu-modal-alert" role="alert">
                <span>!</span>
                <p>{pesan}</p>
              </div>
            )}

            <form onSubmit={simpanData}>
              <div className="ortu-form-group">
                <label htmlFor="ortu-nama">Nama lengkap</label>

                <input
                  id="ortu-nama"
                  name="nama"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={form.nama}
                  onChange={ubahForm}
                  required
                  maxLength={100}
                  autoComplete="name"
                />
              </div>

              <div className="ortu-form-group">
                <label htmlFor="ortu-email">Alamat email</label>

                <input
                  id="ortu-email"
                  name="email"
                  type="email"
                  placeholder="contoh@email.com"
                  value={form.email}
                  onChange={ubahForm}
                  required
                  maxLength={190}
                  autoComplete="email"
                />
              </div>

              <div className="ortu-form-group">
                <label htmlFor="ortu-password">
                  Kata sandi {editId ? "(opsional)" : ""}
                </label>

                <input
                  id="ortu-password"
                  name="password"
                  type="password"
                  placeholder={
                    editId
                      ? "Kosongkan jika tidak ingin mengganti"
                      : "Minimal 8 karakter"
                  }
                  value={form.password}
                  onChange={ubahForm}
                  required={!editId}
                  minLength={8}
                  autoComplete="new-password"
                />

                <small>
                  {editId
                    ? "Kata sandi hanya berubah jika kolom ini diisi."
                    : "Gunakan kata sandi yang aman dan sampaikan kepada pemilik akun secara pribadi."}
                </small>
              </div>

              <div className="ortu-form-note">
                <span>ⓘ</span>

                <p>
                  Akun ini dibuat dengan peran orang tua. Untuk
                  menghubungkan akun dengan anak, atur hubungan tersebut
                  melalui data peserta.
                </p>
              </div>

              <div className="ortu-modal-actions">
                <button
                  type="button"
                  className="ortu-btn ortu-btn-secondary"
                  onClick={tutupModal}
                  disabled={menyimpan}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="ortu-btn ortu-btn-primary"
                  disabled={menyimpan}
                >
                  {menyimpan
                    ? "Menyimpan..."
                    : editId
                    ? "Simpan Perubahan"
                    : "Simpan Akun"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
