
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "../tutor.css";
import TutorSidebar from "../TutorSidebar";

const STATUS = ["Hadir", "Izin", "Sakit", "Alpa"];
const MAKS_FOTO = 5 * 1024 * 1024;
const TIPE_FOTO = ["image/jpeg", "image/png", "image/webp"];

const FORM_AWAL = {
  jadwal_id: "",
  status: "Hadir",
  catatan: "",
  materi: "",
  kesimpulan: "",
  hapus_foto: false,
};

function normalisasiStatus(value) {
  const status = String(value ?? "").trim().toLowerCase();

  if (status === "hadir") return "Hadir";
  if (status === "izin") return "Izin";
  if (status === "sakit") return "Sakit";
  if (status === "alpa" || status === "alfa") return "Alpa";

  return "";
}

function urlFoto(value) {
  if (!value || typeof value !== "string") return "";

  const path = value.trim();

  if (!path) return "";

  // Data URL hasil pratinjau foto.
  if (path.startsWith("data:image/")) return path;

  // URL lengkap dari server eksternal.
  if (/^https?:\/\//i.test(path)) return path;

  // Tolak URL yang bukan path lokal.
  if (!path.startsWith("/")) return "";

  return path;
}

function formatTanggal(value) {
  if (!value) return "-";

  const teks = String(value).slice(0, 10);
  const cocok = teks.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!cocok) return "-";

  const [, tahun, bulan, hari] = cocok;
  const tanggal = new Date(
    Date.UTC(Number(tahun), Number(bulan) - 1, Number(hari))
  );

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(tanggal);
}

function formatJam(value) {
  return value ? String(value).slice(0, 5) : "-";
}

export default function PresensiTutorPage() {
  const [data, setData] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [pesan, setPesan] = useState("");
  const [sukses, setSukses] = useState("");
  const [pencarian, setPencarian] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [mode, setMode] = useState("tambah");
  const [form, setForm] = useState(FORM_AWAL);
  const [menyimpan, setMenyimpan] = useState(false);
  const [tahunSekarang, setTahunSekarang] = useState(2026);
  const [fileFoto, setFileFoto] = useState(null);
  const [pratinjauFoto, setPratinjauFoto] = useState("");
  const [fotoGagal, setFotoGagal] = useState({});

  useEffect(() => {
    setTahunSekarang(new Date().getFullYear());
  }, []);

  const ambilData = useCallback(async () => {
    setMemuat(true);
    setPesan("");

    try {
      const [responseJadwal, responsePresensi] = await Promise.all([
        fetch("/api/tutor/jadwal", { cache: "no-store" }),
        fetch("/api/tutor/presensi", { cache: "no-store" }),
      ]);

      const bacaJson = async (response) => {
        try {
          return await response.json();
        } catch {
          return {};
        }
      };

      const [hasilJadwal, hasilPresensi] = await Promise.all([
        bacaJson(responseJadwal),
        bacaJson(responsePresensi),
      ]);

      if (!responseJadwal.ok || hasilJadwal.success === false) {
        throw new Error(
          hasilJadwal.message || "Data jadwal tutor gagal dimuat."
        );
      }

      if (!responsePresensi.ok || hasilPresensi.success === false) {
        throw new Error(
          hasilPresensi.message || "Data presensi gagal dimuat."
        );
      }

      const daftarJadwal = Array.isArray(hasilJadwal.data)
        ? hasilJadwal.data
        : [];

      const daftarPresensi = Array.isArray(hasilPresensi.data)
        ? hasilPresensi.data
        : [];

      const presensiPerJadwal = new Map();

      daftarPresensi.forEach((item) => {
        const idJadwal = Number(item.jadwal_id ?? item.id_jadwal);

        if (Number.isFinite(idJadwal) && idJadwal > 0) {
          presensiPerJadwal.set(idJadwal, item);
        }
      });

      const hasilGabungan = daftarJadwal
        .map((jadwal) => {
          const idJadwal = Number(
            jadwal.jadwal_id ?? jadwal.id_jadwal ?? jadwal.id
          );

          const presensi = presensiPerJadwal.get(idJadwal);

          const statusAsli = presensi
            ? presensi.status_presensi ?? presensi.status
            : null;

          const fotoAsli = presensi
            ? presensi.bukti_foto ?? presensi.foto
            : null;

          return {
            ...jadwal,
            jadwal_id: idJadwal,
            peserta_id:
              jadwal.peserta_id ??
              jadwal.id_peserta ??
              jadwal.siswa_id ??
              presensi?.peserta_id ??
              null,
            presensi_id: presensi
              ? presensi.presensi_id ?? presensi.id_presensi ?? presensi.id ?? null
              : null,
            status_presensi: normalisasiStatus(statusAsli),
            catatan: presensi?.catatan ?? "",
            materi:
              presensi?.materi ??
              presensi?.materi_diajarkan ??
              "",
            kesimpulan:
              presensi?.kesimpulan ??
              presensi?.kesimpulan_pemahaman ??
              "",
            foto: urlFoto(fotoAsli),
          };
        })
        .filter(
          (item) =>
            Number.isFinite(item.jadwal_id) && item.jadwal_id > 0
        );

      setData(hasilGabungan);
      setFotoGagal({});
    } catch (error) {
      console.error("Gagal memuat data presensi:", error);
      setPesan(error.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => {
    ambilData();
  }, [ambilData]);

  const jadwalBelumPresensi = useMemo(
    () => data.filter((item) => !item.presensi_id),
    [data]
  );

  const dataPresensi = useMemo(
    () => data.filter((item) => Boolean(item.presensi_id)),
    [data]
  );

  const dataTersaring = useMemo(() => {
    const kata = pencarian.trim().toLowerCase();

    return data.filter((item) => {
      const cocokKata =
        !kata ||
        [
          item.nama_peserta,
          item.nama_mata_pelajaran,
          item.catatan,
          item.materi,
          item.kesimpulan,
          item.jadwal_id,
        ].some((nilai) =>
          String(nilai ?? "").toLowerCase().includes(kata)
        );

      const cocokStatus =
        filterStatus === "Semua" ||
        (filterStatus === "Belum"
          ? !item.presensi_id
          : item.status_presensi === filterStatus);

      const cocokTanggal =
        !filterTanggal ||
        String(item.tanggal ?? "").slice(0, 10) === filterTanggal;

      return cocokKata && cocokStatus && cocokTanggal;
    });
  }, [data, pencarian, filterStatus, filterTanggal]);

  const statistik = useMemo(
    () => ({
      totalJadwal: data.length,
      sudahPresensi: dataPresensi.length,
      belumPresensi: jadwalBelumPresensi.length,
      hadir: dataPresensi.filter(
        (item) => item.status_presensi === "Hadir"
      ).length,
    }),
    [data, dataPresensi, jadwalBelumPresensi]
  );

  function bukaTambah() {
    setPesan("");
    setSukses("");

    if (memuat) {
      setPesan("Data jadwal masih dimuat. Silakan coba beberapa saat lagi.");
      return;
    }

    if (jadwalBelumPresensi.length === 0) {
      setPesan(
        data.length === 0
          ? "Jadwal belum tersedia untuk akun Tutor ini. Pastikan jadwal sudah dibuat dan ditugaskan kepada Anda."
          : "Semua jadwal yang tersedia sudah memiliki presensi."
      );
      return;
    }

    setMode("tambah");
    setForm({
      ...FORM_AWAL,
      jadwal_id: String(jadwalBelumPresensi[0].jadwal_id),
    });
    setFileFoto(null);
    setPratinjauFoto("");
    setModalTerbuka(true);
  }

  function bukaIsiPresensi(item) {
    setPesan("");
    setSukses("");
    setMode("tambah");
    setForm({
      ...FORM_AWAL,
      jadwal_id: String(item.jadwal_id),
    });
    setFileFoto(null);
    setPratinjauFoto("");
    setModalTerbuka(true);
  }

  function bukaEdit(item) {
    setPesan("");
    setSukses("");
    setMode("edit");
    setForm({
      jadwal_id: String(item.jadwal_id),
      status: normalisasiStatus(item.status_presensi) || "Hadir",
      catatan: item.catatan || "",
      materi: item.materi || "",
      kesimpulan: item.kesimpulan || "",
      hapus_foto: false,
    });
    setFileFoto(null);
    setPratinjauFoto(item.foto || "");
    setModalTerbuka(true);
  }

  function tutupModal() {
    if (menyimpan) return;

    setModalTerbuka(false);
    setForm({ ...FORM_AWAL });
    setFileFoto(null);
    setPratinjauFoto("");
    setPesan("");
  }

  function pilihFoto(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!TIPE_FOTO.includes(file.type)) {
      setPesan("Foto harus berformat JPG, PNG, atau WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAKS_FOTO) {
      setPesan("Ukuran foto maksimal 5 MB.");
      event.target.value = "";
      return;
    }

    setPesan("");
    setFileFoto(file);

    setForm((sebelumnya) => ({
      ...sebelumnya,
      hapus_foto: false,
    }));

    const reader = new FileReader();

    reader.onload = () => {
      setPratinjauFoto(
        typeof reader.result === "string" ? reader.result : ""
      );
    };

    reader.onerror = () => {
      setPesan("Foto tidak dapat dibaca. Silakan pilih foto lain.");
    };

    reader.readAsDataURL(file);
  }

  function hapusFotoDariForm() {
    setFileFoto(null);
    setPratinjauFoto("");

    setForm((sebelumnya) => ({
      ...sebelumnya,
      hapus_foto: true,
    }));

    const inputFoto = document.getElementById("foto");
    if (inputFoto) inputFoto.value = "";
  }

  async function simpanPresensi(event) {
    event.preventDefault();
    setPesan("");
    setSukses("");

    if (!form.jadwal_id) {
      setPesan("Silakan pilih jadwal terlebih dahulu.");
      return;
    }

    if (!STATUS.includes(form.status)) {
      setPesan("Pilih status presensi yang valid.");
      return;
    }

    if (form.catatan.length > 1000) {
      setPesan("Catatan maksimal 1000 karakter.");
      return;
    }

    if (form.materi.length > 5000 || form.kesimpulan.length > 5000) {
      setPesan("Materi dan kesimpulan maksimal 5000 karakter.");
      return;
    }

    if (fileFoto) {
      if (!TIPE_FOTO.includes(fileFoto.type)) {
        setPesan("Foto harus berformat JPG, PNG, atau WebP.");
        return;
      }

      if (fileFoto.size > MAKS_FOTO) {
        setPesan("Ukuran foto maksimal 5 MB.");
        return;
      }
    }

    const jadwalTerpilih = data.find(
      (item) => String(item.jadwal_id) === String(form.jadwal_id)
    );

    if (!jadwalTerpilih) {
      setPesan("Jadwal tidak ditemukan. Muat ulang halaman.");
      return;
    }

    if (!jadwalTerpilih.peserta_id) {
      setPesan(
        "ID peserta tidak ditemukan pada data jadwal. Periksa respons API /api/tutor/jadwal agar mengirim peserta_id."
      );
      return;
    }

    setMenyimpan(true);

    try {
      const formData = new FormData();

      formData.append("jadwal_id", String(form.jadwal_id));
      formData.append("peserta_id", String(jadwalTerpilih.peserta_id));
      formData.append("status", form.status.toLowerCase() === "alpa" ? "alfa" : form.status.toLowerCase());
      formData.append("catatan", form.catatan);
      formData.append("materi", form.materi);
      formData.append("kesimpulan", form.kesimpulan);
      formData.append("hapus_foto", String(form.hapus_foto));

      if (fileFoto) {
        formData.append("foto", fileFoto);
      }

      const response = await fetch("/api/tutor/presensi", {
        method: mode === "tambah" ? "POST" : "PUT",
        body: formData,
      });

      let hasil = {};

      try {
        hasil = await response.json();
      } catch {
        throw new Error("Respons API tidak valid. Periksa route presensi Tutor.");
      }

      if (!response.ok || hasil.success === false) {
        throw new Error(
          hasil.message ||
            `Presensi gagal disimpan. Kode respons: ${response.status}.`
        );
      }

      setModalTerbuka(false);
      setForm({ ...FORM_AWAL });
      setFileFoto(null);
      setPratinjauFoto("");

      setSukses(
        hasil.message ||
          (mode === "tambah"
            ? "Presensi berhasil ditambahkan."
            : "Presensi berhasil diperbarui.")
      );

      await ambilData();
    } catch (error) {
      console.error("Gagal menyimpan presensi:", error);
      setPesan(error.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setMenyimpan(false);
    }
  }

  async function hapusPresensi(item) {
    const konfirmasi = window.confirm(
      `Hapus presensi ${item.nama_peserta || "peserta ini"} pada jadwal ${formatTanggal(item.tanggal)}?`
    );

    if (!konfirmasi) return;

    setPesan("");
    setSukses("");

    try {
      const response = await fetch(
        `/api/tutor/presensi?jadwal_id=${encodeURIComponent(item.jadwal_id)}`,
        { method: "DELETE" }
      );

      let hasil = {};

      try {
        hasil = await response.json();
      } catch {
        throw new Error("Respons API penghapusan tidak valid.");
      }

      if (!response.ok || hasil.success === false) {
        throw new Error(hasil.message || "Presensi gagal dihapus.");
      }

      setSukses(hasil.message || "Presensi berhasil dihapus.");
      await ambilData();
    } catch (error) {
      setPesan(error.message || "Terjadi kesalahan saat menghapus.");
    }
  }

  function resetFilter() {
    setPencarian("");
    setFilterStatus("Semua");
    setFilterTanggal("");
  }

  return (
    <main className="tutor-dashboard">
      <TutorSidebar />

      <section className="tutor-main">
        <header className="tutor-topbar">
          <div>
            <span className="tutor-eyebrow">RUANG MENGAJAR</span>
            <h1>Presensi Peserta</h1>
            <p>
              Catat kehadiran peserta sesuai jadwal les yang menjadi
              tanggung jawab Anda.
            </p>
          </div>

          <div className="tutor-topbar-actions">
            <Link href="/tutor" className="tutor-back-button">
              <span>←</span> Dashboard
            </Link>
          </div>
        </header>

        <section className="tutor-welcome">
          <div className="tutor-welcome-content">
            <span className="tutor-welcome-label">
              KEHADIRAN PESERTA ✨
            </span>
            <h2>Catat kehadiran dengan mudah.</h2>
            <p>
              Pilih jadwal, tentukan status kehadiran, unggah foto
              dokumentasi, dan catat perkembangan belajar peserta.
            </p>

            <button
              type="button"
              className="tutor-primary-button"
              onClick={bukaTambah}
              disabled={memuat}
            >
              {memuat ? "Memuat jadwal..." : "+ Tambah Presensi"}
            </button>
          </div>

          <div className="tutor-welcome-art" aria-hidden="true">
            <div className="tutor-art-circle">
              <span className="tutor-art-star tutor-star-one">✦</span>
              <span className="tutor-art-star tutor-star-two">✧</span>
              <div className="tutor-art-book">📋</div>
              <div className="tutor-art-pencil">✓</div>
              <div className="tutor-art-heart">♡</div>
            </div>
          </div>
        </section>

        {pesan && (
          <div className="presensi-alert presensi-alert-error" role="alert">
            <span>!</span>
            <div>
              <strong>Terjadi kendala</strong>
              <p>{pesan}</p>
            </div>
            <button
              type="button"
              onClick={() => setPesan("")}
              aria-label="Tutup pesan"
            >
              ×
            </button>
          </div>
        )}

        {sukses && (
          <div className="presensi-alert presensi-alert-success" role="status">
            <span>✓</span>
            <div>
              <strong>Berhasil</strong>
              <p>{sukses}</p>
            </div>
            <button
              type="button"
              onClick={() => setSukses("")}
              aria-label="Tutup pesan"
            >
              ×
            </button>
          </div>
        )}

        <section className="tutor-section">
          <div className="tutor-section-heading">
            <div>
              <h2>Ringkasan Presensi</h2>
              <p>Ringkasan jadwal dan pencatatan kehadiran Anda.</p>
            </div>
            <span className="tutor-section-tag">STATISTIK</span>
          </div>

          <div className="tutor-stats-grid">
            <article className="tutor-stat-card stat-purple">
              <div className="tutor-stat-top">
                <span>Total Jadwal</span>
                <span className="tutor-stat-icon">▦</span>
              </div>
              <strong>{memuat ? "—" : statistik.totalJadwal}</strong>
              <p>Seluruh jadwal les tutor</p>
            </article>

            <article className="tutor-stat-card stat-green">
              <div className="tutor-stat-top">
                <span>Sudah Presensi</span>
                <span className="tutor-stat-icon">✓</span>
              </div>
              <strong>{memuat ? "—" : statistik.sudahPresensi}</strong>
              <p>Jadwal yang sudah dicatat</p>
            </article>

            <article className="tutor-stat-card stat-pink">
              <div className="tutor-stat-top">
                <span>Belum Presensi</span>
                <span className="tutor-stat-icon">◷</span>
              </div>
              <strong>{memuat ? "—" : statistik.belumPresensi}</strong>
              <p>Jadwal yang perlu dicatat</p>
            </article>

            <article className="tutor-stat-card stat-peach">
              <div className="tutor-stat-top">
                <span>Status Hadir</span>
                <span className="tutor-stat-icon">♡</span>
              </div>
              <strong>{memuat ? "—" : statistik.hadir}</strong>
              <p>Presensi berstatus hadir</p>
            </article>
          </div>
        </section>

        <section className="tutor-section">
          <div className="tutor-section-heading">
            <div>
              <h2>Daftar Presensi</h2>
              <p>
                Jadwal tanpa presensi dapat diisi. Presensi yang sudah
                tersimpan dapat diedit atau dihapus.
              </p>
            </div>
          </div>

          <div className="tutor-schedule-toolbar presensi-toolbar">
            <label className="tutor-search-box">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Cari peserta, mata pelajaran, atau ID jadwal..."
                value={pencarian}
                onChange={(event) => setPencarian(event.target.value)}
                aria-label="Cari presensi"
              />
            </label>

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              aria-label="Filter status presensi"
              className="presensi-filter"
            >
              <option value="Semua">Semua Status</option>
              {STATUS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
              <option value="Belum">Belum Presensi</option>
            </select>

            <input
              type="date"
              value={filterTanggal}
              onChange={(event) => setFilterTanggal(event.target.value)}
              aria-label="Filter tanggal"
              className="presensi-filter presensi-date-filter"
            />

            <button
              type="button"
              className="tutor-secondary-button"
              onClick={resetFilter}
            >
              Reset
            </button>
          </div>

          {memuat ? (
            <div className="tutor-empty-card">
              <div className="tutor-empty-icon">◌</div>
              <h3>Memuat data presensi...</h3>
              <p>Mohon tunggu sebentar.</p>
            </div>
          ) : dataTersaring.length === 0 ? (
            <div className="tutor-empty-card">
              <div className="tutor-empty-icon">▦</div>
              <h3>
                {data.length === 0
                  ? "Belum ada jadwal les"
                  : "Data tidak ditemukan"}
              </h3>
              <p>
                {data.length === 0
                  ? "Pastikan jadwal les sudah dibuat dan ditugaskan kepada akun tutor Anda."
                  : "Coba ubah kata kunci atau filter yang dipilih."}
              </p>

              {data.length > 0 && (
                <button
                  type="button"
                  className="tutor-secondary-button"
                  onClick={resetFilter}
                >
                  Tampilkan semua data
                </button>
              )}
            </div>
          ) : (
            <div className="tutor-table-wrapper">
              <table className="tutor-table presensi-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Peserta</th>
                    <th>Mata Pelajaran</th>
                    <th>Tanggal</th>
                    <th>Waktu</th>
                    <th>Status</th>
                    <th>Foto</th>
                    <th>Materi</th>
                    <th>Kesimpulan</th>
                    <th>Catatan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {dataTersaring.map((item, index) => {
                    const belum = !item.presensi_id;
                    const foto = item.foto;

                    return (
                      <tr key={item.jadwal_id}>
                        <td>{index + 1}</td>

                        <td>
                          <div className="tutor-person-cell">
                            <span className="tutor-person-avatar">
                              {String(item.nama_peserta || "P")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                            <div>
                              <strong>{item.nama_peserta || "-"}</strong>
                              <small>Jadwal #{item.jadwal_id}</small>
                            </div>
                          </div>
                        </td>

                        <td>{item.nama_mata_pelajaran || "-"}</td>
                        <td>{formatTanggal(item.tanggal)}</td>
                        <td>
                          {formatJam(item.jam_mulai)}–
                          {formatJam(item.jam_selesai)}
                        </td>

                        <td>
                          {belum ? (
                            <span className="presensi-status belum">
                              Belum Presensi
                            </span>
                          ) : (
                            <span
                              className={`presensi-status ${
                                String(item.status_presensi || "").toLowerCase() === "hadir"
                                  ? "hadir"
                                  : String(item.status_presensi || "").toLowerCase() === "izin"
                                    ? "izin"
                                    : String(item.status_presensi || "").toLowerCase() === "sakit"
                                      ? "sakit"
                                      : "alpa"
                              }`}
                            >
                              {item.status_presensi || "-"}
                            </span>
                          )}
                        </td>

                        <td>
                          {foto && !fotoGagal[item.jadwal_id] ? (
                            <a
                              href={foto}
                              target="_blank"
                              rel="noreferrer"
                              title="Buka foto presensi"
                            >
                              <img
                                src={foto}
                                alt="Foto bukti presensi"
                                loading="lazy"
                                onError={() =>
                                  setFotoGagal((sebelumnya) => ({
                                    ...sebelumnya,
                                    [item.jadwal_id]: true,
                                  }))
                                }
                                style={{
                                  width: 72,
                                  height: 72,
                                  objectFit: "cover",
                                  borderRadius: 10,
                                  border: "1px solid #e5dff4",
                                }}
                              />
                            </a>
                          ) : (
                            <span>
                              {foto ? "Foto tidak dapat dimuat" : "-"}
                            </span>
                          )}
                        </td>

                        <td>{item.materi || "-"}</td>
                        <td>{item.kesimpulan || "-"}</td>
                        <td className="presensi-catatan">
                          {item.catatan || "-"}
                        </td>

                        <td>
                          <div className="presensi-action-group">
                            {belum ? (
                              <button
                                type="button"
                                className="presensi-action-button isi"
                                onClick={() => bukaIsiPresensi(item)}
                              >
                                Isi Presensi
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="presensi-action-button edit"
                                  onClick={() => bukaEdit(item)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="presensi-action-button hapus"
                                  onClick={() => hapusPresensi(item)}
                                >
                                  Hapus
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="tutor-footer">
          <span className="tutor-footer-brand">manuli ♡</span>
          <span>
            © {tahunSekarang} Manuli. Teman belajar, tumbuh bersama.
          </span>
        </footer>
      </section>

      {modalTerbuka && (
        <div
          className="presensi-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) tutupModal();
          }}
        >
          <section
            className="presensi-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="presensi-modal-title"
          >
            <div className="presensi-modal-header">
              <div>
                <span className="tutor-eyebrow">FORMULIR KEHADIRAN</span>
                <h2 id="presensi-modal-title">
                  {mode === "tambah" ? "Tambah Presensi" : "Edit Presensi"}
                </h2>
                <p>Lengkapi kehadiran dan perkembangan belajar peserta.</p>
              </div>

              <button
                type="button"
                className="presensi-modal-close"
                onClick={tutupModal}
                disabled={menyimpan}
                aria-label="Tutup formulir"
              >
                ×
              </button>
            </div>

            <form onSubmit={simpanPresensi}>
              {pesan && (
                <div className="presensi-form-error" role="alert">
                  {pesan}
                </div>
              )}

              <div className="presensi-form-group">
                <label htmlFor="jadwal_id">Jadwal Les</label>
                <select
                  id="jadwal_id"
                  value={form.jadwal_id}
                  onChange={(event) =>
                    setForm((sebelumnya) => ({
                      ...sebelumnya,
                      jadwal_id: event.target.value,
                    }))
                  }
                  disabled={mode === "edit" || menyimpan}
                  required
                >
                  <option value="">Pilih jadwal les</option>

                  {(mode === "tambah"
                    ? jadwalBelumPresensi
                    : data.filter(
                        (item) =>
                          String(item.jadwal_id) === String(form.jadwal_id)
                      )
                  ).map((item) => (
                    <option
                      key={item.jadwal_id}
                      value={String(item.jadwal_id)}
                    >
                      #{item.jadwal_id} — {item.nama_peserta || "Peserta"} —{" "}
                      {formatTanggal(item.tanggal)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="presensi-form-group">
                <label htmlFor="status">Status Kehadiran</label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(event) =>
                    setForm((sebelumnya) => ({
                      ...sebelumnya,
                      status: event.target.value,
                    }))
                  }
                  disabled={menyimpan}
                  required
                >
                  {STATUS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="presensi-form-group">
                <label htmlFor="foto">Foto Bukti Presensi</label>
                <input
                  id="foto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={pilihFoto}
                  disabled={menyimpan}
                />
                <small>Format JPG, PNG, atau WebP. Maksimal 5 MB.</small>

                {pratinjauFoto && (
                  <div className="presensi-photo-preview">
                    <img
                      src={pratinjauFoto}
                      alt="Pratinjau foto bukti presensi"
                      style={{
                        display: "block",
                        maxWidth: "100%",
                        maxHeight: 260,
                        objectFit: "contain",
                        borderRadius: 12,
                      }}
                    />
                    <button
                      type="button"
                      className="presensi-action-button hapus"
                      onClick={hapusFotoDariForm}
                      disabled={menyimpan}
                    >
                      Hapus Foto
                    </button>
                  </div>
                )}
              </div>

              <div className="presensi-form-group">
                <label htmlFor="materi">Materi yang Diajarkan</label>
                <textarea
                  id="materi"
                  rows={3}
                  maxLength={5000}
                  placeholder="Contoh: Pengenalan Excel, rumus SUM dan AVERAGE."
                  value={form.materi}
                  onChange={(event) =>
                    setForm((sebelumnya) => ({
                      ...sebelumnya,
                      materi: event.target.value,
                    }))
                  }
                  disabled={menyimpan}
                />
                <small>{form.materi.length}/5000 karakter</small>
              </div>

              <div className="presensi-form-group">
                <label htmlFor="kesimpulan">
                  Kesimpulan Pemahaman Peserta
                </label>
                <textarea
                  id="kesimpulan"
                  rows={3}
                  maxLength={5000}
                  placeholder="Contoh: Peserta memahami materi dan mampu mengerjakan latihan."
                  value={form.kesimpulan}
                  onChange={(event) =>
                    setForm((sebelumnya) => ({
                      ...sebelumnya,
                      kesimpulan: event.target.value,
                    }))
                  }
                  disabled={menyimpan}
                />
                <small>{form.kesimpulan.length}/5000 karakter</small>
              </div>

              <div className="presensi-form-group">
                <label htmlFor="catatan">
                  Catatan <span>(opsional)</span>
                </label>
                <textarea
                  id="catatan"
                  rows={3}
                  maxLength={1000}
                  placeholder="Catatan tambahan tentang kegiatan les."
                  value={form.catatan}
                  onChange={(event) =>
                    setForm((sebelumnya) => ({
                      ...sebelumnya,
                      catatan: event.target.value,
                    }))
                  }
                  disabled={menyimpan}
                />
                <small>{form.catatan.length}/1000 karakter</small>
              </div>

              <div className="presensi-modal-actions">
                <button
                  type="button"
                  className="tutor-secondary-button"
                  onClick={tutupModal}
                  disabled={menyimpan}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="tutor-primary-button"
                  disabled={menyimpan || !form.jadwal_id}
                >
                  {menyimpan
                    ? "Menyimpan..."
                    : mode === "tambah"
                      ? "Simpan Presensi"
                      : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
