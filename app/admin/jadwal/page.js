
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./jadwal.css";

const FORM_KOSONG = {
  peserta_id: "",
  tutor_user_id: "",
  mata_pelajaran_id: "",
  tanggal: "",
  jam_mulai: "",
  jam_selesai: "",
  lokasi: "",
};

// Tidak memakai new Date() saat render.
function tanggalLokalHariIni() {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
  const hari = String(sekarang.getDate()).padStart(2, "0");

  return `${tahun}-${bulan}-${hari}`;
}

function ambilTanggal(nilai) {
  if (!nilai) return "";

  if (typeof nilai === "string") {
    return nilai.slice(0, 10);
  }

  return "";
}

function formatTanggal(nilai) {
  const tanggal = ambilTanggal(nilai);
  if (!tanggal) return "-";

  const bagian = tanggal.split("-");
  if (bagian.length !== 3) return tanggal;

  const [tahun, bulan, hari] = bagian;
  const namaBulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const nomorBulan = Number(bulan);
  if (!nomorBulan || nomorBulan > 12) return tanggal;

  return `${Number(hari)} ${namaBulan[nomorBulan - 1]} ${tahun}`;
}

function formatJam(nilai) {
  if (!nilai) return "-";
  return String(nilai).slice(0, 5);
}

function waktuKeMenit(nilai) {
  if (!nilai) return 0;

  const [jam, menit] = String(nilai).slice(0, 5).split(":").map(Number);
  return jam * 60 + menit;
}

export default function JadwalPage() {
  const [jadwal, setJadwal] = useState([]);
  const [peserta, setPeserta] = useState([]);
  const [tutor, setTutor] = useState([]);
  const [mataPelajaran, setMataPelajaran] = useState([]);

  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);
  const [pesanError, setPesanError] = useState("");
  const [pesanSukses, setPesanSukses] = useState("");

  const [kataKunci, setKataKunci] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [tanggalHariIni, setTanggalHariIni] = useState("");

  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [modeEdit, setModeEdit] = useState(false);
  const [idEdit, setIdEdit] = useState(null);
  const [form, setForm] = useState(FORM_KOSONG);

  const ambilData = useCallback(async () => {
    setSedangMemuat(true);
    setPesanError("");

    try {
      const respons = await fetch("/api/admin/jadwal", {
        method: "GET",
        cache: "no-store",
      });

      const hasil = await respons.json();

      if (!respons.ok) {
        throw new Error(hasil.pesan || hasil.message || "Gagal mengambil data jadwal.");
      }

      setJadwal(Array.isArray(hasil.data) ? hasil.data : []);
      setPeserta(Array.isArray(hasil.peserta) ? hasil.peserta : []);
      setTutor(Array.isArray(hasil.tutor) ? hasil.tutor : []);
      setMataPelajaran(
        Array.isArray(hasil.mataPelajaran) ? hasil.mataPelajaran : []
      );
    } catch (error) {
      setPesanError(error.message || "Terjadi kesalahan saat mengambil data.");
    } finally {
      setSedangMemuat(false);
    }
  }, []);

  useEffect(() => {
    // Tanggal saat ini ditentukan setelah komponen dipasang di browser.
    setTanggalHariIni(tanggalLokalHariIni());
    ambilData();
  }, [ambilData]);

  const jadwalTersaring = useMemo(() => {
    const kata = kataKunci.trim().toLowerCase();

    return jadwal.filter((item) => {
      const teks = [
        item.nama_peserta,
        item.nama_tutor,
        item.nama_mata_pelajaran,
        item.lokasi,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const cocokKata = !kata || teks.includes(kata);
      const cocokTanggal =
        !filterTanggal || ambilTanggal(item.tanggal) === filterTanggal;

      return cocokKata && cocokTanggal;
    });
  }, [jadwal, kataKunci, filterTanggal]);

  const jumlahHariIni = useMemo(
    () =>
      jadwal.filter(
        (item) =>
          tanggalHariIni && ambilTanggal(item.tanggal) === tanggalHariIni
      ).length,
    [jadwal, tanggalHariIni]
  );

  const jumlahMendatang = useMemo(
    () =>
      jadwal.filter(
        (item) =>
          tanggalHariIni && ambilTanggal(item.tanggal) > tanggalHariIni
      ).length,
    [jadwal, tanggalHariIni]
  );

  function ubahForm(event) {
    const { name, value } = event.target;

    setForm((sebelumnya) => {
      const berikutnya = { ...sebelumnya, [name]: value };

      if (
        name === "jam_mulai" &&
        berikutnya.jam_selesai &&
        waktuKeMenit(berikutnya.jam_selesai) <= waktuKeMenit(value)
      ) {
        berikutnya.jam_selesai = "";
      }

      return berikutnya;
    });
  }

  function bukaTambah() {
    setModeEdit(false);
    setIdEdit(null);
    setForm({
      ...FORM_KOSONG,
      tanggal: tanggalLokalHariIni(),
    });
    setPesanError("");
    setPesanSukses("");
    setModalTerbuka(true);
  }

  function bukaEdit(item) {
    setModeEdit(true);
    setIdEdit(item.id);
    setForm({
      peserta_id: String(item.peserta_id ?? ""),
      tutor_user_id: String(item.tutor_user_id ?? ""),
      mata_pelajaran_id: String(item.mata_pelajaran_id ?? ""),
      tanggal: ambilTanggal(item.tanggal),
      jam_mulai: formatJam(item.jam_mulai) === "-" ? "" : formatJam(item.jam_mulai),
      jam_selesai:
        formatJam(item.jam_selesai) === "-" ? "" : formatJam(item.jam_selesai),
      lokasi: item.lokasi ?? "",
    });
    setPesanError("");
    setPesanSukses("");
    setModalTerbuka(true);
  }

  function tutupModal() {
    if (sedangMenyimpan) return;
    setModalTerbuka(false);
    setIdEdit(null);
    setForm(FORM_KOSONG);
  }

  async function simpanJadwal(event) {
    event.preventDefault();
    setPesanError("");
    setPesanSukses("");

    if (
      !form.peserta_id ||
      !form.tutor_user_id ||
      !form.mata_pelajaran_id ||
      !form.tanggal ||
      !form.jam_mulai ||
      !form.jam_selesai
    ) {
      setPesanError("Lengkapi semua data wajib terlebih dahulu.");
      return;
    }

    if (waktuKeMenit(form.jam_selesai) <= waktuKeMenit(form.jam_mulai)) {
      setPesanError("Jam selesai harus lebih besar dari jam mulai.");
      return;
    }

    setSedangMenyimpan(true);

    try {
      const respons = await fetch("/api/admin/jadwal", {
        method: modeEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          modeEdit ? { id: idEdit, ...form } : form
        ),
      });

      const hasil = await respons.json();

      if (!respons.ok) {
        throw new Error(hasil.pesan || hasil.message || "Jadwal gagal disimpan.");
      }

      setModalTerbuka(false);
      setForm(FORM_KOSONG);
      setPesanSukses(
        modeEdit ? "Jadwal berhasil diperbarui." : "Jadwal berhasil ditambahkan."
      );

      await ambilData();
    } catch (error) {
      setPesanError(error.message || "Terjadi kesalahan saat menyimpan jadwal.");
    } finally {
      setSedangMenyimpan(false);
    }
  }

  async function hapusJadwal(item) {
    const yakin = window.confirm(
      `Hapus jadwal ${item.nama_peserta || "peserta"} pada ${formatTanggal(item.tanggal)}?`
    );

    if (!yakin) return;

    setPesanError("");
    setPesanSukses("");

    try {
      const respons = await fetch(
        `/api/admin/jadwal?id=${encodeURIComponent(item.id)}`,
        { method: "DELETE" }
      );

      const hasil = await respons.json();

      if (!respons.ok) {
        throw new Error(hasil.pesan || hasil.message || "Jadwal gagal dihapus.");
      }

      setPesanSukses("Jadwal berhasil dihapus.");
      await ambilData();
    } catch (error) {
      setPesanError(error.message || "Terjadi kesalahan saat menghapus jadwal.");
    }
  }

  return (
    <main className="jadwal-halaman">
      <div className="jadwal-latar jadwal-latar-satu" />
      <div className="jadwal-latar jadwal-latar-dua" />

      <section className="jadwal-konten">
        <header className="jadwal-header">
          <div className="jadwal-header-kiri">
            <Link href="/admin" className="jadwal-tombol-kembali">
              <span aria-hidden="true">←</span> Kembali ke Dashboard
            </Link>

            <p className="jadwal-eyebrow">MANAJEMEN MANULI</p>
            <h1>Jadwal Les</h1>
            <p className="jadwal-subjudul">
              Atur jadwal belajar, tutor, mata pelajaran, dan lokasi les.
            </p>
          </div>

          <button
            type="button"
            className="jadwal-tombol-utama"
            onClick={bukaTambah}
          >
            <span aria-hidden="true">＋</span> Tambah Jadwal
          </button>
        </header>

        {pesanError && !modalTerbuka && (
          <div className="jadwal-pesan jadwal-pesan-error" role="alert">
            {pesanError}
            <button type="button" onClick={() => setPesanError("")} aria-label="Tutup pesan">
              ×
            </button>
          </div>
        )}

        {pesanSukses && (
          <div className="jadwal-pesan jadwal-pesan-sukses" role="status">
            {pesanSukses}
            <button type="button" onClick={() => setPesanSukses("")} aria-label="Tutup pesan">
              ×
            </button>
          </div>
        )}

        <section className="jadwal-statistik">
          <article className="jadwal-statistik-kartu jadwal-statistik-ungu">
            <div className="jadwal-statistik-ikon">▦</div>
            <div>
              <p>Total Jadwal</p>
              <strong>{jadwal.length}</strong>
              <span>Semua jadwal les</span>
            </div>
          </article>

          <article className="jadwal-statistik-kartu jadwal-statistik-merahmuda">
            <div className="jadwal-statistik-ikon">◷</div>
            <div>
              <p>Jadwal Hari Ini</p>
              <strong>{jumlahHariIni}</strong>
              <span>Sesuai tanggal hari ini</span>
            </div>
          </article>

          <article className="jadwal-statistik-kartu jadwal-statistik-hijau">
            <div className="jadwal-statistik-ikon">↗</div>
            <div>
              <p>Jadwal Mendatang</p>
              <strong>{jumlahMendatang}</strong>
              <span>Jadwal setelah hari ini</span>
            </div>
          </article>
        </section>

        <section className="jadwal-panel">
          <div className="jadwal-panel-header">
            <div>
              <h2>Daftar Jadwal Les</h2>
              <p>Kelola jadwal les peserta dan tutor.</p>
            </div>
            <span className="jadwal-total-label">
              {jadwalTersaring.length} jadwal
            </span>
          </div>

          <div className="jadwal-filter">
            <label className="jadwal-pencarian">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={kataKunci}
                onChange={(event) => setKataKunci(event.target.value)}
                placeholder="Cari peserta, tutor, mata pelajaran..."
                aria-label="Cari jadwal"
              />
            </label>

            <label className="jadwal-filter-tanggal">
              <span>Filter tanggal</span>
              <input
                type="date"
                value={filterTanggal}
                onChange={(event) => setFilterTanggal(event.target.value)}
              />
            </label>

            {(kataKunci || filterTanggal) && (
              <button
                type="button"
                className="jadwal-tombol-reset"
                onClick={() => {
                  setKataKunci("");
                  setFilterTanggal("");
                }}
              >
                Reset
              </button>
            )}
          </div>

          {sedangMemuat ? (
            <div className="jadwal-kosong">
              <div className="jadwal-memuat" />
              <p>Memuat data jadwal...</p>
            </div>
          ) : jadwalTersaring.length === 0 ? (
            <div className="jadwal-kosong">
              <div className="jadwal-kosong-ikon">▤</div>
              <h3>{jadwal.length === 0 ? "Belum ada jadwal les" : "Jadwal tidak ditemukan"}</h3>
              <p>
                {jadwal.length === 0
                  ? "Tambahkan jadwal pertama untuk mulai mengatur kegiatan belajar."
                  : "Coba ubah kata pencarian atau filter tanggal."}
              </p>
              {jadwal.length === 0 && (
                <button
                  type="button"
                  className="jadwal-tombol-utama"
                  onClick={bukaTambah}
                >
                  ＋ Tambah Jadwal
                </button>
              )}
            </div>
          ) : (
            <div className="jadwal-tabel-bungkus">
              <table className="jadwal-tabel">
                <thead>
                  <tr>
                    <th>Peserta</th>
                    <th>Tutor</th>
                    <th>Mata Pelajaran</th>
                    <th>Tanggal</th>
                    <th>Waktu</th>
                    <th>Lokasi</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {jadwalTersaring.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="jadwal-identitas">
                          <span className="jadwal-avatar jadwal-avatar-ungu">
                            {(item.nama_peserta || "P").charAt(0).toUpperCase()}
                          </span>
                          <strong>{item.nama_peserta || "-"}</strong>
                        </div>
                      </td>
                      <td>{item.nama_tutor || "-"}</td>
                      <td>
                        <span className="jadwal-mata-pelajaran">
                          {item.nama_mata_pelajaran || "-"}
                        </span>
                      </td>
                      <td>{formatTanggal(item.tanggal)}</td>
                      <td>
                        <span className="jadwal-waktu">
                          {formatJam(item.jam_mulai)}–{formatJam(item.jam_selesai)}
                        </span>
                      </td>
                      <td>{item.lokasi || "Belum ditentukan"}</td>
                      <td>
                        <div className="jadwal-aksi">
                          <button
                            type="button"
                            className="jadwal-aksi-edit"
                            onClick={() => bukaEdit(item)}
                            title="Ubah jadwal"
                            aria-label={`Ubah jadwal ${item.nama_peserta || ""}`}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="jadwal-aksi-hapus"
                            onClick={() => hapusJadwal(item)}
                            title="Hapus jadwal"
                            aria-label={`Hapus jadwal ${item.nama_peserta || ""}`}
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {modalTerbuka && (
        <div
          className="jadwal-modal-lapisan"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) tutupModal();
          }}
        >
          <section
            className="jadwal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="jadwal-modal-judul"
          >
            <header className="jadwal-modal-header">
              <div>
                <p className="jadwal-eyebrow">DATA PEMBELAJARAN</p>
                <h2 id="jadwal-modal-judul">
                  {modeEdit ? "Ubah Jadwal Les" : "Tambah Jadwal Les"}
                </h2>
                <p>Lengkapi informasi jadwal di bawah ini.</p>
              </div>
              <button
                type="button"
                className="jadwal-modal-tutup"
                onClick={tutupModal}
                disabled={sedangMenyimpan}
                aria-label="Tutup formulir"
              >
                ×
              </button>
            </header>

            {pesanError && (
              <div className="jadwal-pesan jadwal-pesan-error" role="alert">
                {pesanError}
              </div>
            )}

            <form className="jadwal-form" onSubmit={simpanJadwal}>
              <div className="jadwal-form-grid">
                <label className="jadwal-field">
                  <span>Peserta les <b>*</b></span>
                  <select
                    name="peserta_id"
                    value={form.peserta_id}
                    onChange={ubahForm}
                    required
                  >
                    <option value="">Pilih peserta</option>
                    {peserta.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nama}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="jadwal-field">
                  <span>Tutor <b>*</b></span>
                  <select
                    name="tutor_user_id"
                    value={form.tutor_user_id}
                    onChange={ubahForm}
                    required
                  >
                    <option value="">Pilih tutor</option>
                    {tutor.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nama}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="jadwal-field jadwal-field-penuh">
                  <span>Mata pelajaran <b>*</b></span>
                  <select
                    name="mata_pelajaran_id"
                    value={form.mata_pelajaran_id}
                    onChange={ubahForm}
                    required
                  >
                    <option value="">Pilih mata pelajaran</option>
                    {mataPelajaran.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nama}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="jadwal-field jadwal-field-penuh">
                  <span>Tanggal les <b>*</b></span>
                  <input
                    type="date"
                    name="tanggal"
                    value={form.tanggal}
                    onChange={ubahForm}
                    required
                  />
                </label>

                <label className="jadwal-field">
                  <span>Jam mulai <b>*</b></span>
                  <input
                    type="time"
                    name="jam_mulai"
                    value={form.jam_mulai}
                    onChange={ubahForm}
                    required
                  />
                </label>

                <label className="jadwal-field">
                  <span>Jam selesai <b>*</b></span>
                  <input
                    type="time"
                    name="jam_selesai"
                    value={form.jam_selesai}
                    min={form.jam_mulai || undefined}
                    onChange={ubahForm}
                    required
                  />
                </label>

                <label className="jadwal-field jadwal-field-penuh">
                  <span>Lokasi les</span>
                  <input
                    type="text"
                    name="lokasi"
                    value={form.lokasi}
                    onChange={ubahForm}
                    placeholder="Contoh: Ruang Belajar / Daring"
                    maxLength={150}
                  />
                </label>
              </div>

              <div className="jadwal-form-catatan">
                <span aria-hidden="true">ⓘ</span>
                Pastikan jadwal dan tutor sudah sesuai sebelum menyimpan.
              </div>

              <footer className="jadwal-form-footer">
                <button
                  type="button"
                  className="jadwal-tombol-batal"
                  onClick={tutupModal}
                  disabled={sedangMenyimpan}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="jadwal-tombol-utama"
                  disabled={sedangMenyimpan}
                >
                  {sedangMenyimpan
                    ? "Menyimpan..."
                    : modeEdit
                      ? "Simpan Perubahan"
                      : "Simpan Jadwal"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
