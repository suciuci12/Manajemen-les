
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import "./tutor.css";

const formAwal = {
  nama: "",
  jenis_kelamin: "",
  nomor_hp: "",
  alamat: "",
  bidang_mengajar: "",
  tanggal_bergabung: "",
  status: "Aktif",
};

export default function TutorPage() {
  const [tutor, setTutor] = useState([]);
  const [pencarian, setPencarian] = useState("");
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);

  const [modalBuka, setModalBuka] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(formAwal);

  const [akunModalBuka, setAkunModalBuka] = useState(false);
  const [tutorTerpilih, setTutorTerpilih] = useState(null);
  const [emailAkun, setEmailAkun] = useState("");
  const [passwordAkun, setPasswordAkun] = useState("");
  const [menyimpanAkun, setMenyimpanAkun] = useState(false);

  const [pesan, setPesan] = useState("");
  const [jenisPesan, setJenisPesan] = useState("sukses");

  const tampilkanPesan = (teks, jenis = "sukses") => {
    setPesan(teks);
    setJenisPesan(jenis);
  };

  const ambilTutor = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/tutor", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengambil data tutor."
        );
      }

      setTutor(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      tampilkanPesan(error.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    ambilTutor();
  }, [ambilTutor]);

  const daftarTutor = tutor.filter((item) => {
    const kata = pencarian.toLowerCase();

    return [
      item.nama,
      item.nomor_hp,
      item.bidang_mengajar,
      item.status,
      item.email_akun,
    ].some((nilai) =>
      String(nilai || "").toLowerCase().includes(kata)
    );
  });

  function bukaTambah() {
    setEditId(null);
    setForm({ ...formAwal });
    setPesan("");
    setModalBuka(true);
  }

  function bukaEdit(item) {
    setEditId(item.id);

    setForm({
      nama: item.nama || "",
      jenis_kelamin: item.jenis_kelamin || "",
      nomor_hp: item.nomor_hp || "",
      alamat: item.alamat || "",
      bidang_mengajar: item.bidang_mengajar || "",
      tanggal_bergabung: item.tanggal_bergabung
        ? String(item.tanggal_bergabung).slice(0, 10)
        : "",
      status: item.status || "Aktif",
    });

    setPesan("");
    setModalBuka(true);
  }

  function ubahForm(event) {
    const { name, value } = event.target;

    setForm((sebelumnya) => ({
      ...sebelumnya,
      [name]: value,
    }));
  }

  async function simpanTutor(event) {
    event.preventDefault();
    setMenyimpan(true);
    setPesan("");

    try {
      const response = await fetch("/api/admin/tutor", {
        method: editId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editId ? { ...form, id: editId } : form
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal menyimpan tutor."
        );
      }

      setModalBuka(false);
      setForm({ ...formAwal });
      setEditId(null);

      tampilkanPesan(
        result.message || "Data tutor berhasil disimpan."
      );

      await ambilTutor();
    } catch (error) {
      tampilkanPesan(error.message, "error");
    } finally {
      setMenyimpan(false);
    }
  }

  async function hapusTutor(item) {
    const yakin = window.confirm(
      `Hapus data tutor "${item.nama}"? Tindakan ini tidak dapat dibatalkan.`
    );

    if (!yakin) return;

    try {
      const response = await fetch("/api/admin/tutor", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: item.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal menghapus tutor."
        );
      }

      tampilkanPesan(
        result.message || "Data tutor berhasil dihapus."
      );

      await ambilTutor();
    } catch (error) {
      tampilkanPesan(error.message, "error");
    }
  }

  function bukaFormAkun(item) {
    setTutorTerpilih(item);
    setEmailAkun("");
    setPasswordAkun("");
    setPesan("");
    setAkunModalBuka(true);
  }

  async function simpanAkunTutor(event) {
    event.preventDefault();

    if (!tutorTerpilih) return;

    setMenyimpanAkun(true);
    setPesan("");

    try {
      const response = await fetch("/api/admin/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aksi: "buat-akun",
          tutor_id: tutorTerpilih.id,
          email: emailAkun.trim(),
          password: passwordAkun,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal membuat akun tutor."
        );
      }

      setAkunModalBuka(false);
      setTutorTerpilih(null);
      setEmailAkun("");
      setPasswordAkun("");

      tampilkanPesan(
        result.message || "Akun tutor berhasil dibuat."
      );

      await ambilTutor();
    } catch (error) {
      tampilkanPesan(error.message, "error");
    } finally {
      setMenyimpanAkun(false);
    }
  }

  function tutupModalAkun() {
    if (menyimpanAkun) return;

    setAkunModalBuka(false);
    setTutorTerpilih(null);
    setEmailAkun("");
    setPasswordAkun("");
  }

  return (
    <div className="tutor-page">
      <div className="tutor-container">
        <header className="tutor-header">
          <div>
            <div className="tutor-breadcrumb">
              <Link href="/admin">Dashboard</Link>
              <span>/</span>
              <strong>Data Tutor</strong>
            </div>

            <span className="tutor-overline">
              MANAJEMEN PENGAJAR
            </span>

            <h1>Data Tutor</h1>

            <p>
              Kelola informasi tutor dan akun login pengajar di
              Manuli.
            </p>
          </div>

          <button
            className="tutor-primary-button"
            onClick={bukaTambah}
            type="button"
          >
            <span>＋</span> Tambah Tutor
          </button>
        </header>

        {pesan && (
          <div
            className={`tutor-alert ${jenisPesan}`}
            role="status"
          >
            <span>
              {jenisPesan === "error" ? "!" : "✓"}
            </span>

            {pesan}

            <button
              type="button"
              onClick={() => setPesan("")}
              aria-label="Tutup pesan"
            >
              ×
            </button>
          </div>
        )}

        <section className="tutor-summary">
          <div className="tutor-summary-icon">♧</div>

          <div>
            <span>Total Tutor</span>
            <strong>{loading ? "…" : tutor.length}</strong>
            <small>Data tutor terdaftar</small>
          </div>

          <div className="tutor-summary-decoration">✦</div>
        </section>

        <section className="tutor-table-card">
          <div className="tutor-table-heading">
            <div>
              <h2>Daftar Tutor</h2>
              <p>
                Kelola biodata dan akun login setiap tutor.
              </p>
            </div>

            <label className="tutor-search">
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                value={pencarian}
                onChange={(event) =>
                  setPencarian(event.target.value)
                }
                placeholder="Cari nama, bidang, atau email..."
                aria-label="Cari tutor"
              />
            </label>
          </div>

          <div className="tutor-table-scroll">
            <table className="tutor-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Nama Tutor</th>
                  <th>Bidang Mengajar</th>
                  <th>Nomor HP</th>
                  <th>Jenis Kelamin</th>
                  <th>Status</th>
                  <th>Akun Login</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="tutor-empty">
                      Memuat data tutor...
                    </td>
                  </tr>
                ) : daftarTutor.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="tutor-empty">
                      <span className="tutor-empty-icon">
                        ♧
                      </span>

                      <strong>
                        {pencarian
                          ? "Tutor tidak ditemukan"
                          : "Belum ada data tutor"}
                      </strong>

                      <p>
                        {pencarian
                          ? "Coba gunakan kata pencarian lain."
                          : "Tambahkan tutor pertama untuk mulai mengelola data."}
                      </p>

                      {!pencarian && (
                        <button
                          type="button"
                          className="tutor-primary-button"
                          onClick={bukaTambah}
                        >
                          ＋ Tambah Tutor
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  daftarTutor.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>

                      <td>
                        <div className="tutor-name-cell">
                          <span className="tutor-avatar">
                            {item.nama?.charAt(0)?.toUpperCase() ||
                              "T"}
                          </span>

                          <div>
                            <strong>{item.nama}</strong>

                            {item.email_akun && (
                              <small className="tutor-email">
                                {item.email_akun}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>{item.bidang_mengajar || "—"}</td>
                      <td>{item.nomor_hp || "—"}</td>
                      <td>{item.jenis_kelamin || "—"}</td>

                      <td>
                        <span
                          className={`tutor-status ${
                            item.status === "Aktif"
                              ? "aktif"
                              : "nonaktif"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        {item.user_id ? (
                          <span className="tutor-status aktif">
                            Sudah dibuat
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="tutor-edit-button"
                            onClick={() => bukaFormAkun(item)}
                          >
                            Buat Akun
                          </button>
                        )}
                      </td>

                      <td>
                        <div className="tutor-actions">
                          <button
                            type="button"
                            className="tutor-edit-button"
                            onClick={() => bukaEdit(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="tutor-delete-button"
                            onClick={() => hapusTutor(item)}
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="tutor-table-footer">
            <span>
              Menampilkan {loading ? "…" : daftarTutor.length}{" "}
              dari {loading ? "…" : tutor.length} tutor
            </span>

            <Link href="/admin">
              ← Kembali ke Dashboard
            </Link>
          </div>
        </section>

        {/* MODAL TAMBAH DAN EDIT BIODATA TUTOR */}
        {modalBuka && (
          <div
            className="tutor-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !menyimpan
              ) {
                setModalBuka(false);
              }
            }}
          >
            <section
              className="tutor-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="tutor-modal-title"
            >
              <div className="tutor-modal-header">
                <div>
                  <span className="tutor-overline">
                    FORMULIR TUTOR
                  </span>

                  <h2 id="tutor-modal-title">
                    {editId ? "Edit Data Tutor" : "Tambah Tutor"}
                  </h2>

                  <p>
                    Lengkapi informasi tutor di bawah ini.
                  </p>
                </div>

                <button
                  type="button"
                  className="tutor-modal-close"
                  onClick={() => setModalBuka(false)}
                  disabled={menyimpan}
                  aria-label="Tutup formulir"
                >
                  ×
                </button>
              </div>

              <form onSubmit={simpanTutor}>
                <div className="tutor-form-grid">
                  <label className="tutor-field tutor-field-full">
                    Nama lengkap *
                    <input
                      name="nama"
                      value={form.nama}
                      onChange={ubahForm}
                      required
                      maxLength={100}
                      placeholder="Masukkan nama lengkap"
                    />
                  </label>

                  <label className="tutor-field">
                    Bidang mengajar *
                    <input
                      name="bidang_mengajar"
                      value={form.bidang_mengajar}
                      onChange={ubahForm}
                      required
                      maxLength={100}
                      placeholder="Contoh: Matematika"
                    />
                  </label>

                  <label className="tutor-field">
                    Nomor HP
                    <input
                      name="nomor_hp"
                      type="tel"
                      value={form.nomor_hp}
                      onChange={ubahForm}
                      maxLength={20}
                      placeholder="08xxxxxxxxxx"
                    />
                  </label>

                  <label className="tutor-field">
                    Jenis kelamin
                    <select
                      name="jenis_kelamin"
                      value={form.jenis_kelamin}
                      onChange={ubahForm}
                    >
                      <option value="">
                        Pilih jenis kelamin
                      </option>
                      <option value="Laki-laki">
                        Laki-laki
                      </option>
                      <option value="Perempuan">
                        Perempuan
                      </option>
                    </select>
                  </label>

                  <label className="tutor-field">
                    Tanggal bergabung
                    <input
                      type="date"
                      name="tanggal_bergabung"
                      value={form.tanggal_bergabung}
                      onChange={ubahForm}
                    />
                  </label>

                  <label className="tutor-field">
                    Status tutor
                    <select
                      name="status"
                      value={form.status}
                      onChange={ubahForm}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Tidak Aktif">
                        Tidak Aktif
                      </option>
                    </select>
                  </label>

                  <label className="tutor-field tutor-field-full">
                    Alamat
                    <textarea
                      name="alamat"
                      value={form.alamat}
                      onChange={ubahForm}
                      rows={3}
                      placeholder="Masukkan alamat tutor"
                    />
                  </label>
                </div>

                <div className="tutor-modal-actions">
                  <button
                    type="button"
                    className="tutor-cancel-button"
                    onClick={() => setModalBuka(false)}
                    disabled={menyimpan}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="tutor-primary-button"
                    disabled={menyimpan}
                  >
                    {menyimpan
                      ? "Menyimpan..."
                      : "Simpan Data"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* MODAL PEMBUATAN AKUN LOGIN TUTOR */}
        {akunModalBuka && tutorTerpilih && (
          <div
            className="tutor-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                tutupModalAkun();
              }
            }}
          >
            <section
              className="tutor-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="akun-modal-title"
            >
              <div className="tutor-modal-header">
                <div>
                  <span className="tutor-overline">
                    AKUN PENGAJAR
                  </span>

                  <h2 id="akun-modal-title">
                    Buat Akun Tutor
                  </h2>

                  <p>
                    Buat akses login untuk {tutorTerpilih.nama}.
                  </p>
                </div>

                <button
                  type="button"
                  className="tutor-modal-close"
                  onClick={tutupModalAkun}
                  disabled={menyimpanAkun}
                  aria-label="Tutup formulir akun"
                >
                  ×
                </button>
              </div>

              <form onSubmit={simpanAkunTutor}>
                <div className="tutor-form-grid">
                  <label className="tutor-field tutor-field-full">
                    Nama tutor
                    <input
                      value={tutorTerpilih.nama}
                      disabled
                    />
                  </label>

                  <label className="tutor-field tutor-field-full">
                    Email untuk login *
                    <input
                      type="email"
                      value={emailAkun}
                      onChange={(event) =>
                        setEmailAkun(event.target.value)
                      }
                      required
                      maxLength={190}
                      autoComplete="email"
                      placeholder="tutor@email.com"
                    />
                  </label>

                  <label className="tutor-field tutor-field-full">
                    Kata sandi *
                    <input
                      type="password"
                      value={passwordAkun}
                      onChange={(event) =>
                        setPasswordAkun(event.target.value)
                      }
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Minimal 8 karakter"
                    />

                    <small>
                      Gunakan minimal 8 karakter. Berikan kata
                      sandi kepada tutor secara aman.
                    </small>
                  </label>
                </div>

                <div className="tutor-modal-actions">
                  <button
                    type="button"
                    className="tutor-cancel-button"
                    onClick={tutupModalAkun}
                    disabled={menyimpanAkun}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="tutor-primary-button"
                    disabled={menyimpanAkun}
                  >
                    {menyimpanAkun
                      ? "Membuat akun..."
                      : "Buat Akun Tutor"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
