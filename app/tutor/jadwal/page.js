
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./jadwal.css";

const FORM_AWAL = {
  id: "",
  tanggal: "",
  jam_mulai: "",
  jam_selesai: "",
  alasan: "",
};

export default function JadwalTutorPage() {
  const router = useRouter();

  const [jadwal, setJadwal] = useState([]);
  const [form, setForm] = useState(FORM_AWAL);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);
  const [pesan, setPesan] = useState("");
  const [jenisPesan, setJenisPesan] = useState("");
  const [pencarian, setPencarian] = useState("");

  async function muatJadwal() {
    setSedangMemuat(true);

    try {
      const response = await fetch("/api/tutor/jadwal", {
        cache: "no-store",
      });

      const hasil = await response.json();

      if (!response.ok) {
        throw new Error(
          hasil.message || "Gagal mengambil jadwal."
        );
      }

      setJadwal(hasil.data || []);
    } catch (error) {
      setPesan(error.message);
      setJenisPesan("error");
    } finally {
      setSedangMemuat(false);
    }
  }

  useEffect(() => {
    muatJadwal();
  }, []);

  function mulaiEdit(item) {
    setForm({
      id: String(item.id),
      tanggal: String(item.tanggal).slice(0, 10),
      jam_mulai: String(item.jam_mulai).slice(0, 5),
      jam_selesai: String(item.jam_selesai).slice(0, 5),
      alasan: "",
    });

    setPesan("");
    setJenisPesan("");

    document
      .getElementById("form-perubahan-jadwal")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  function ubahForm(event) {
    const { name, value } = event.target;

    setForm((sebelumnya) => ({
      ...sebelumnya,
      [name]: value,
    }));
  }

  async function simpanPerubahan(event) {
    event.preventDefault();

    setPesan("");
    setJenisPesan("");

    if (!form.id) {
      setPesan("Pilih jadwal yang ingin diubah terlebih dahulu.");
      setJenisPesan("error");
      return;
    }

    if (!form.tanggal) {
      setPesan("Tanggal jadwal wajib diisi.");
      setJenisPesan("error");
      return;
    }

    if (!form.jam_mulai || !form.jam_selesai) {
      setPesan("Jam mulai dan jam selesai wajib diisi.");
      setJenisPesan("error");
      return;
    }

    if (form.jam_mulai >= form.jam_selesai) {
      setPesan("Jam selesai harus setelah jam mulai.");
      setJenisPesan("error");
      return;
    }

    if (!form.alasan.trim()) {
      setPesan("Alasan perubahan wajib diisi.");
      setJenisPesan("error");
      return;
    }

    setSedangMenyimpan(true);

    try {
      const response = await fetch("/api/tutor/jadwal", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: form.id,
          tanggal: form.tanggal,
          jam_mulai: form.jam_mulai,
          jam_selesai: form.jam_selesai,
          alasan: form.alasan.trim(),
        }),
      });

      const hasil = await response.json();

      if (!response.ok) {
        throw new Error(
          hasil.message || "Gagal mengubah jadwal."
        );
      }

      setPesan(
        hasil.message ||
          "Jadwal berhasil diubah dan riwayat telah disimpan."
      );
      setJenisPesan("success");
      setForm(FORM_AWAL);

      await muatJadwal();
    } catch (error) {
      setPesan(error.message);
      setJenisPesan("error");
    } finally {
      setSedangMenyimpan(false);
    }
  }

  function formatTanggal(value) {
    if (!value) return "-";

    const tanggal = String(value).slice(0, 10);
    const [tahun, bulan, hari] = tanggal.split("-");

    return `${hari}/${bulan}/${tahun}`;
  }

  const daftarFilter = jadwal.filter((item) => {
    const kata = pencarian.trim().toLowerCase();

    return (
      String(item.nama_peserta || "")
        .toLowerCase()
        .includes(kata) ||
      String(item.nama_mata_pelajaran || "")
        .toLowerCase()
        .includes(kata) ||
      String(item.tanggal || "")
        .includes(kata)
    );
  });

  return (
    <main className="jadwal-tutor">
      {/* HEADER */}
      <header className="jadwal-header">
        <div className="jadwal-header-content">
          <button
            type="button"
            className="jadwal-back-btn"
            onClick={() => router.push("/tutor")}
          >
            <span aria-hidden="true">←</span>
            Kembali ke Dashboard
          </button>

          <p className="jadwal-eyebrow">
            MANAJEMEN LES MANULI
          </p>

          <h1>Jadwal Les Saya</h1>

          <p className="jadwal-subtitle">
            Lihat jadwal mengajar dan ubah waktu jika diperlukan.
          </p>
        </div>

        <div className="jadwal-total">
          <span>Total jadwal</span>
          <strong>{jadwal.length}</strong>
        </div>
      </header>

      {/* PESAN */}
      {pesan && (
        <div
          className={`jadwal-alert ${jenisPesan}`}
          role={jenisPesan === "error" ? "alert" : "status"}
        >
          <span>{pesan}</span>

          <button
            type="button"
            onClick={() => {
              setPesan("");
              setJenisPesan("");
            }}
            aria-label="Tutup pesan"
          >
            ×
          </button>
        </div>
      )}

      {/* DAFTAR JADWAL */}
      <section className="jadwal-panel">
        <div className="jadwal-panel-heading">
          <div>
            <h2>Daftar Jadwal</h2>
            <p>
              Pilih jadwal yang ingin diubah tanggal atau waktunya.
            </p>
          </div>

          <input
            className="jadwal-search"
            type="search"
            placeholder="Cari peserta atau mata pelajaran..."
            value={pencarian}
            onChange={(event) =>
              setPencarian(event.target.value)
            }
            aria-label="Cari jadwal"
          />
        </div>

        {sedangMemuat ? (
          <div className="jadwal-kosong">
            Memuat jadwal...
          </div>
        ) : daftarFilter.length === 0 ? (
          <div className="jadwal-kosong">
            <span className="jadwal-kosong-icon">▤</span>
            <strong>Jadwal tidak ditemukan</strong>
            <p>
              Belum ada jadwal yang sesuai dengan pencarianmu.
            </p>
          </div>
        ) : (
          <div className="jadwal-table-wrap">
            <table className="jadwal-table">
              <thead>
                <tr>
                  <th>Peserta</th>
                  <th>Mata Pelajaran</th>
                  <th>Tanggal</th>
                  <th>Waktu</th>
                  <th>Lokasi</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {daftarFilter.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Peserta">
                      <strong>
                        {item.nama_peserta || "-"}
                      </strong>
                    </td>

                    <td data-label="Mata Pelajaran">
                      {item.nama_mata_pelajaran || "-"}
                    </td>

                    <td data-label="Tanggal">
                      {formatTanggal(item.tanggal)}
                    </td>

                    <td data-label="Waktu">
                      <span className="jadwal-waktu">
                        {String(item.jam_mulai).slice(0, 5)}
                        {" – "}
                        {String(item.jam_selesai).slice(0, 5)}
                      </span>
                    </td>

                    <td data-label="Lokasi">
                      {item.lokasi || "-"}
                    </td>

                    <td data-label="Aksi">
                      <button
                        type="button"
                        className="jadwal-edit-btn"
                        onClick={() => mulaiEdit(item)}
                      >
                        <span aria-hidden="true">✎</span>
                        Ubah Jadwal
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="jadwal-table-footer">
          Menampilkan {daftarFilter.length} dari {jadwal.length} jadwal
        </div>
      </section>

      {/* FORM PERUBAHAN */}
      <section
        className="jadwal-panel jadwal-form-panel"
        id="form-perubahan-jadwal"
      >
        <div className="jadwal-panel-heading">
          <div>
            <h2>Perubahan Jadwal</h2>
            <p>
              Perubahan disimpan setelah lolos pemeriksaan bentrok.
            </p>
          </div>

          <span className="jadwal-form-badge">
            <span aria-hidden="true">✦</span>
            Pengaturan Jadwal
          </span>
        </div>

        {!form.id ? (
          <div className="jadwal-pilih-info">
            <span className="jadwal-info-icon">✎</span>

            <strong>Belum ada jadwal dipilih</strong>

            <p>
              Klik tombol <b>Ubah Jadwal</b> pada daftar di atas
              untuk mulai mengubah tanggal dan waktu les.
            </p>
          </div>
        ) : (
          <form
            onSubmit={simpanPerubahan}
            className="jadwal-form"
          >
            <div className="jadwal-edit-info">
              <span className="jadwal-info-icon">✦</span>

              <div>
                <strong>Ubah jadwal #{form.id}</strong>
                <p>
                  Isi tanggal, waktu baru, dan alasan perubahan.
                </p>
              </div>
            </div>

            <div className="jadwal-form-grid">
              <label>
                Tanggal Les Baru
                <input
                  type="date"
                  name="tanggal"
                  value={form.tanggal}
                  onChange={ubahForm}
                  required
                />
              </label>

              <label>
                Jam Mulai
                <input
                  type="time"
                  name="jam_mulai"
                  value={form.jam_mulai}
                  onChange={ubahForm}
                  required
                />
              </label>

              <label>
                Jam Selesai
                <input
                  type="time"
                  name="jam_selesai"
                  value={form.jam_selesai}
                  onChange={ubahForm}
                  required
                />
              </label>

              <label className="jadwal-alasan">
                Alasan Perubahan
                <textarea
                  name="alasan"
                  value={form.alasan}
                  onChange={ubahForm}
                  placeholder="Contoh: tutor berhalangan pada jadwal semula..."
                  rows={4}
                  maxLength={1000}
                  required
                />

                <span className="jadwal-karakter">
                  {form.alasan.length}/1000 karakter
                </span>
              </label>
            </div>

            <div className="jadwal-peringatan">
              <span aria-hidden="true">ⓘ</span>

              <p>
                Sistem akan menolak perubahan jika jadwal baru
                berbenturan dengan jadwal tutor atau peserta lainnya.
              </p>
            </div>

            <div className="jadwal-form-actions">
              <button
                type="button"
                className="jadwal-cancel-btn"
                disabled={sedangMenyimpan}
                onClick={() => {
                  setForm(FORM_AWAL);
                  setPesan("");
                  setJenisPesan("");
                }}
              >
                Batal
              </button>

              <button
                type="submit"
                className="jadwal-save-btn"
                disabled={sedangMenyimpan}
              >
                {sedangMenyimpan ? (
                  <>
                    <span className="jadwal-spinner" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">✓</span>
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>

            <p className="jadwal-catatan">
              Setelah perubahan tersimpan, pastikan admin dan
              orang tua menerima informasi jadwal terbaru.
            </p>
          </form>
        )}
      </section>

      {/* TOMBOL KEMBALI DI BAGIAN BAWAH */}
      <div className="jadwal-footer">
        <button
          type="button"
          className="jadwal-back-bottom"
          onClick={() => router.push("/tutor")}
        >
          ← Kembali ke Dashboard Tutor
        </button>

        <p>Manuli · Manajemen Jadwal Les</p>
      </div>
    </main>
  );
}
