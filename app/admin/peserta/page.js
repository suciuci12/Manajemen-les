
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import "./peserta.css";

export default function PesertaPage() {
  const [peserta, setPeserta] = useState([]);
  const [daftarOrangTua, setDaftarOrangTua] = useState([]);
  const [loadingOrangTua, setLoadingOrangTua] = useState(false);
  const [pencarian, setPencarian] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editTerbuka, setEditTerbuka] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const [menghapusId, setMenghapusId] = useState(null);

  const [membuatLinkId, setMembuatLinkId] = useState(null);
  const [tautanPeserta, setTautanPeserta] = useState({});

  const [formEdit, setFormEdit] = useState({
    id: "",
    nama: "",
    tanggal_lahir: "",
    sekolah: "",
    parent_user_id: "",
  });

  // Mengambil data peserta
  const ambilPeserta = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/peserta", {
        cache: "no-store",
        credentials: "include",
      });

      const hasil = await response.json();

      if (!response.ok) {
        throw new Error(
          hasil.message ||
            hasil.error ||
            "Gagal mengambil data peserta."
        );
      }

      const daftar = Array.isArray(hasil)
        ? hasil
        : Array.isArray(hasil.data)
          ? hasil.data
          : Array.isArray(hasil.peserta)
            ? hasil.peserta
            : [];

      setPeserta(daftar);
    } catch (err) {
      setError(
        err.message || "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Mengambil daftar akun orang tua
  const ambilOrangTua = useCallback(async () => {
    setLoadingOrangTua(true);

    try {
      const response = await fetch(
        "/api/admin/orang-tua/pilihan",
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const hasil = await response.json();

      if (!response.ok) {
        throw new Error(
          hasil.message || "Gagal mengambil daftar orang tua."
        );
      }

      setDaftarOrangTua(
        Array.isArray(hasil.data) ? hasil.data : []
      );
    } catch (err) {
      console.error("Gagal mengambil daftar orang tua:", err);
    } finally {
      setLoadingOrangTua(false);
    }
  }, []);

  useEffect(() => {
    ambilPeserta();
    ambilOrangTua();
  }, [ambilPeserta, ambilOrangTua]);

  // Pencarian peserta
  const pesertaTersaring = peserta.filter((item) => {
    const kata = pencarian.toLowerCase().trim();

    return (
      String(item.nama || "").toLowerCase().includes(kata) ||
      String(item.sekolah || "").toLowerCase().includes(kata) ||
      String(item.nama_orang_tua || "")
        .toLowerCase()
        .includes(kata) ||
      String(item.email_orang_tua || "")
        .toLowerCase()
        .includes(kata)
    );
  });

  // Format tanggal
  function formatTanggal(tanggal) {
    if (!tanggal) return "-";

    const nilai = String(tanggal).slice(0, 10);
    const bagian = nilai.split("-");

    if (bagian.length !== 3) return nilai;

    return `${bagian[2]}/${bagian[1]}/${bagian[0]}`;
  }

  function formatTanggalBerlaku(tanggal) {
    if (!tanggal) return "-";

    const nilai = new Date(tanggal);

    if (Number.isNaN(nilai.getTime())) return "-";

    return nilai.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Membuka modal edit
  function bukaEdit(item) {
    setFormEdit({
      id: item.id,
      nama: item.nama || "",
      tanggal_lahir: item.tanggal_lahir
        ? String(item.tanggal_lahir).slice(0, 10)
        : "",
      sekolah: item.sekolah || "",
      parent_user_id:
        item.parent_user_id != null
          ? String(item.parent_user_id)
          : "",
    });

    setError("");
    setEditTerbuka(true);
  }

  // Menyimpan perubahan peserta
  async function simpanEdit(event) {
    event.preventDefault();

    if (menyimpan) return;

    setMenyimpan(true);
    setError("");

    try {
      const response = await fetch("/api/admin/peserta", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          ...formEdit,
          parent_user_id: formEdit.parent_user_id || null,
        }),
      });

      const hasil = await response.json();

      if (!response.ok) {
        throw new Error(
          hasil.message || "Gagal memperbarui data peserta."
        );
      }

      setEditTerbuka(false);
      await ambilPeserta();

      window.alert("Data peserta berhasil diperbarui.");
    } catch (err) {
      window.alert(
        err.message || "Gagal memperbarui data peserta."
      );
    } finally {
      setMenyimpan(false);
    }
  }

  // Menghapus peserta
  async function hapusPeserta(item) {
    if (menghapusId !== null) return;

    const yakin = window.confirm(
      `Apakah kamu yakin ingin menghapus peserta "${item.nama}"?`
    );

    if (!yakin) return;

    setMenghapusId(item.id);

    try {
      const response = await fetch("/api/admin/peserta", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ id: item.id }),
      });

      const hasil = await response.json();

      if (!response.ok) {
        throw new Error(
          hasil.message || "Gagal menghapus peserta."
        );
      }

      setTautanPeserta((sebelumnya) => {
        const baru = { ...sebelumnya };
        delete baru[item.id];
        return baru;
      });

      await ambilPeserta();
      window.alert("Data peserta berhasil dihapus.");
    } catch (err) {
      window.alert(
        err.message || "Gagal menghapus data peserta."
      );
    } finally {
      setMenghapusId(null);
    }
  }

  // Membuat tautan akses orang tua
  async function buatLinkOrangTua(item) {
    if (!item.parent_user_id) {
      window.alert(
        "Peserta ini belum terhubung dengan akun orang tua.\n\n" +
          "Klik Edit, kemudian pilih akun orang tua terlebih dahulu."
      );
      return;
    }

    if (membuatLinkId !== null) return;

    const yakin = window.confirm(
      `Buat tautan akses orang tua untuk ${item.nama}?\n\n` +
        "Jika tautan baru dibuat, tautan sebelumnya untuk peserta ini akan dinonaktifkan."
    );

    if (!yakin) return;

    setMembuatLinkId(item.id);

    try {
      const response = await fetch(
        "/api/admin/orang-tua/tautan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            pesertaId: item.id,
          }),
        }
      );

      const hasil = await response.json();

      if (!response.ok || !hasil.success) {
        throw new Error(
          hasil.message || "Gagal membuat tautan orang tua."
        );
      }

      setTautanPeserta((sebelumnya) => ({
        ...sebelumnya,
        [item.id]: {
          link: hasil.link,
          whatsappUrl: hasil.whatsappUrl,
          berlakuSampai: hasil.berlakuSampai,
        },
      }));

      window.alert(
        `Tautan akses untuk ${item.nama} berhasil dibuat.\n\n` +
          "Gunakan tombol Salin Link atau Kirim WhatsApp."
      );
    } catch (err) {
      window.alert(
        err.message || "Terjadi kesalahan saat membuat tautan."
      );
    } finally {
      setMembuatLinkId(null);
    }
  }

  // Menyalin tautan
  async function salinLinkOrangTua(item) {
    const tautan = tautanPeserta[item.id]?.link;

    if (!tautan) return;

    try {
      await navigator.clipboard.writeText(tautan);
      window.alert("Tautan berhasil disalin.");
    } catch {
      window.prompt("Salin tautan berikut:", tautan);
    }
  }

  // Membuka WhatsApp dengan pesan yang disiapkan API
  function kirimWhatsAppOrangTua(item) {
    const tautan = tautanPeserta[item.id];

    if (!tautan?.whatsappUrl) return;

    window.open(
      tautan.whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="peserta-page">
      <div className="peserta-glow peserta-glow-satu" />
      <div className="peserta-glow peserta-glow-dua" />

      <div className="peserta-container">
        <header className="peserta-heading">
          <div>
            <p className="peserta-eyebrow">
              <span className="peserta-live-dot" />
              MANAJEMEN LES MANULI
            </p>

            <h1>Data Peserta</h1>

            <p className="peserta-subtitle">
              Kelola data peserta, hubungkan akun orang tua, dan
              bagikan akses presensi melalui tautan khusus.
            </p>
          </div>

          <Link href="/admin" className="peserta-back-button">
            <span aria-hidden="true">←</span>
            Kembali ke Dashboard
          </Link>
        </header>

        <section className="peserta-stat-card">
          <div className="peserta-stat-icon" aria-hidden="true">
            ♙
          </div>

          <div>
            <p>Total Peserta</p>
            <h2>{loading ? "..." : peserta.length}</h2>
          </div>

          <span className="peserta-stat-caption">
            Data peserta terdaftar
          </span>
        </section>

        <section className="peserta-table-card">
          <div className="peserta-table-heading">
            <div>
              <h2>Daftar Peserta Les</h2>
              <p>
                Kelola peserta dan buat tautan akses untuk orang tua.
              </p>
            </div>

            <Link
              href="/admin/peserta/tambah"
              className="peserta-add-button"
            >
              <span aria-hidden="true">＋</span>
              Tambah Peserta
            </Link>
          </div>

          <div className="peserta-toolbar">
            <label
              className="peserta-search"
              htmlFor="cari-peserta"
            >
              <span aria-hidden="true">⌕</span>

              <input
                id="cari-peserta"
                type="search"
                placeholder="Cari nama, sekolah, atau orang tua..."
                value={pencarian}
                onChange={(event) =>
                  setPencarian(event.target.value)
                }
              />
            </label>

            <button
              type="button"
              className="peserta-refresh-button"
              onClick={() => {
                ambilPeserta();
                ambilOrangTua();
              }}
              disabled={loading}
            >
              ↻ {loading ? "Memuat..." : "Perbarui"}
            </button>
          </div>

          {error && (
            <div className="peserta-alert" role="alert">
              <p>{error}</p>

              <button type="button" onClick={ambilPeserta}>
                Coba lagi
              </button>
            </div>
          )}

          <div className="peserta-table-wrapper">
            <table className="peserta-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Nama Peserta</th>
                  <th>Tanggal Lahir</th>
                  <th>Sekolah</th>
                  <th>Nama Orang Tua</th>
                  <th>Email Orang Tua</th>
                  <th>Tindakan</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="peserta-empty">
                      <span className="peserta-spinner" />
                      Memuat data peserta...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="peserta-empty">
                      Data belum dapat ditampilkan.
                    </td>
                  </tr>
                ) : pesertaTersaring.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="peserta-empty">
                      <span className="peserta-empty-icon">♧</span>

                      <strong>
                        {pencarian
                          ? "Peserta tidak ditemukan"
                          : "Belum ada data peserta"}
                      </strong>

                      <span>
                        {pencarian
                          ? "Coba gunakan kata kunci lain."
                          : "Tambahkan peserta pertama untuk mulai mengelola data."}
                      </span>
                    </td>
                  </tr>
                ) : (
                  pesertaTersaring.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>

                      <td>
                        <div className="peserta-name-cell">
                          <span className="peserta-avatar">
                            {String(item.nama || "?")
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          <strong>{item.nama || "-"}</strong>
                        </div>
                      </td>

                      <td>{formatTanggal(item.tanggal_lahir)}</td>
                      <td>{item.sekolah || "-"}</td>
                      <td>{item.nama_orang_tua || "-"}</td>
                      <td>{item.email_orang_tua || "-"}</td>

                      <td>
                        <div className="peserta-actions">
                          <button
                            type="button"
                            className="peserta-edit-button"
                            onClick={() => bukaEdit(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="peserta-delete-button"
                            onClick={() => hapusPeserta(item)}
                            disabled={menghapusId !== null}
                          >
                            {menghapusId === item.id
                              ? "Menghapus..."
                              : "Hapus"}
                          </button>

                          <button
                            type="button"
                            className="peserta-link-button"
                            onClick={() => buatLinkOrangTua(item)}
                            disabled={
                              membuatLinkId !== null ||
                              menghapusId !== null ||
                              !item.parent_user_id
                            }
                            title={
                              !item.parent_user_id
                                ? "Hubungkan akun orang tua melalui tombol Edit terlebih dahulu."
                                : "Buat tautan akses orang tua"
                            }
                          >
                            {membuatLinkId === item.id
                              ? "Membuat..."
                              : "Buat Link"}
                          </button>

                          {tautanPeserta[item.id] && (
                            <>
                              <button
                                type="button"
                                className="peserta-copy-link-button"
                                onClick={() =>
                                  salinLinkOrangTua(item)
                                }
                              >
                                Salin Link
                              </button>

                              <button
                                type="button"
                                className="peserta-whatsapp-button"
                                onClick={() =>
                                  kirimWhatsAppOrangTua(item)
                                }
                              >
                                Kirim WhatsApp
                              </button>
                            </>
                          )}
                        </div>

                        {!item.parent_user_id && (
                          <small className="peserta-link-hint">
                            Hubungkan akun orang tua melalui Edit.
                          </small>
                        )}

                        {tautanPeserta[item.id]?.berlakuSampai && (
                          <small className="peserta-link-hint">
                            Berlaku sampai{" "}
                            {formatTanggalBerlaku(
                              tautanPeserta[item.id].berlakuSampai
                            )}
                          </small>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && !error && peserta.length > 0 && (
            <footer className="peserta-table-footer">
              Menampilkan {pesertaTersaring.length} dari{" "}
              {peserta.length} peserta
            </footer>
          )}
        </section>

        {editTerbuka && (
          <div
            className="peserta-modal-overlay"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !menyimpan
              ) {
                setEditTerbuka(false);
              }
            }}
          >
            <section
              className="peserta-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="judul-edit-peserta"
            >
              <div className="peserta-modal-heading">
                <div>
                  <h2 id="judul-edit-peserta">
                    Edit Data Peserta
                  </h2>
                  <p>Perbarui informasi peserta les.</p>
                </div>

                <button
                  type="button"
                  className="peserta-modal-close"
                  onClick={() => setEditTerbuka(false)}
                  disabled={menyimpan}
                  aria-label="Tutup formulir"
                >
                  ×
                </button>
              </div>

              <form onSubmit={simpanEdit}>
                <label className="peserta-form-field">
                  Nama Peserta
                  <input
                    type="text"
                    value={formEdit.nama}
                    maxLength={100}
                    required
                    onChange={(event) =>
                      setFormEdit({
                        ...formEdit,
                        nama: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="peserta-form-field">
                  Tanggal Lahir
                  <input
                    type="date"
                    value={formEdit.tanggal_lahir}
                    onChange={(event) =>
                      setFormEdit({
                        ...formEdit,
                        tanggal_lahir: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="peserta-form-field">
                  Sekolah
                  <input
                    type="text"
                    value={formEdit.sekolah}
                    maxLength={150}
                    onChange={(event) =>
                      setFormEdit({
                        ...formEdit,
                        sekolah: event.target.value,
                      })
                    }
                  />
                </label>

                <label className="peserta-form-field">
                  Nama Orang Tua
                  <select
                    value={String(formEdit.parent_user_id ?? "")}
                    onChange={(event) =>
                      setFormEdit({
                        ...formEdit,
                        parent_user_id: event.target.value,
                      })
                    }
                    disabled={loadingOrangTua}
                  >
                    <option value="">
                      {loadingOrangTua
                        ? "Memuat daftar orang tua..."
                        : "Belum dihubungkan"}
                    </option>

                    {daftarOrangTua.map((ortu) => (
                      <option
                        key={ortu.id}
                        value={String(ortu.id)}
                      >
                        {ortu.nama} — {ortu.email}
                      </option>
                    ))}
                  </select>

                  <small>
                    Pilih akun orang tua yang akan dihubungkan
                    dengan peserta.
                  </small>
                </label>

                <div className="peserta-modal-actions">
                  <button
                    type="button"
                    className="peserta-cancel-button"
                    onClick={() => setEditTerbuka(false)}
                    disabled={menyimpan}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="peserta-save-button"
                    disabled={menyimpan}
                  >
                    {menyimpan
                      ? "Menyimpan..."
                      : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        <footer className="peserta-page-footer">
          <span>Manuli · Sistem Manajemen Les</span>

          <span>
            Dikembangkan oleh <strong>Suci Indah Sari</strong> ·
            Founder Manuli
          </span>
        </footer>
      </div>
    </main>
  );
}
