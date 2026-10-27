
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "./presensi.css";

const FORM_KOSONG = {
  id: "",
  jadwal_id: "",
  peserta_id: "",
  status: "hadir",
  catatan: "",
  bukti_foto: "",
  materi_diajarkan: "",
  kesimpulan_pemahaman: "",
};

const LABEL_STATUS = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alfa: "Alfa",
};

function formatTanggal(value) {
  if (!value) return "-";

  const bagian = String(value).slice(0, 10).split("-");

  if (bagian.length !== 3) return String(value);

  return `${bagian[2]}/${bagian[1]}/${bagian[0]}`;
}

function formatJam(value) {
  return value ? String(value).slice(0, 5) : "-";
}

function formatTanggalWaktu(value) {
  if (!value) return "-";

  const tanggal = new Date(value);

  if (Number.isNaN(tanggal.getTime())) return "-";

  return tanggal.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ringkasTeks(value, maksimal = 75) {
  if (!value) return "-";

  const teks = String(value).replace(/\s+/g, " ").trim();

  if (teks.length <= maksimal) return teks;

  return `${teks.slice(0, maksimal).trim()}…`;
}

export default function PresensiPage() {
  const [data, setData] = useState([]);
  const [peserta, setPeserta] = useState([]);
  const [jadwal, setJadwal] = useState([]);

  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [mengunggah, setMengunggah] = useState(false);

  const [pesan, setPesan] = useState("");
  const [jenisPesan, setJenisPesan] = useState("sukses");

  const [cari, setCari] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPeserta, setFilterPeserta] = useState("");
  const [tanggalCetak, setTanggalCetak] = useState("");

  const [modalForm, setModalForm] = useState(false);
  const [modalDetail, setModalDetail] = useState(false);

  const [form, setForm] = useState(FORM_KOSONG);
  const [detail, setDetail] = useState(null);

  const [fileFoto, setFileFoto] = useState(null);
  const [pratinjauFoto, setPratinjauFoto] = useState("");
  const [fotoPopup, setFotoPopup] = useState(null);

  const tampilkanPesan = useCallback((teks, jenis = "sukses") => {
    setPesan(teks);
    setJenisPesan(jenis);
  }, []);

  const muatData = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/presensi", {
        cache: "no-store",
      });

      const hasil = await response.json();

      if (!response.ok || !hasil.success) {
        throw new Error(
          hasil.message || "Gagal mengambil data presensi."
        );
      }

      setData(Array.isArray(hasil.data) ? hasil.data : []);
      setPeserta(Array.isArray(hasil.peserta) ? hasil.peserta : []);
      setJadwal(Array.isArray(hasil.jadwal) ? hasil.jadwal : []);
    } catch (error) {
      setData([]);
      setPeserta([]);
      setJadwal([]);

      tampilkanPesan(
        error.message || "Terjadi kesalahan saat mengambil data.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [tampilkanPesan]);

  useEffect(() => {
    muatData();

    setTanggalCetak(
      new Date().toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    );
  }, [muatData]);

  useEffect(() => {
    if (!fileFoto) {
      setPratinjauFoto("");
      return;
    }

    const url = URL.createObjectURL(fileFoto);

    setPratinjauFoto(url);

    return () => URL.revokeObjectURL(url);
  }, [fileFoto]);

  useEffect(() => {
    if (!modalForm && !modalDetail && !fotoPopup) return;

    function tutupDenganEscape(event) {
      if (event.key !== "Escape") return;

      if (fotoPopup) {
        setFotoPopup(null);
      } else if (modalDetail) {
        setModalDetail(false);
      } else if (modalForm && !menyimpan && !mengunggah) {
        setModalForm(false);
      }
    }

    window.addEventListener("keydown", tutupDenganEscape);

    return () => {
      window.removeEventListener("keydown", tutupDenganEscape);
    };
  }, [modalForm, modalDetail, fotoPopup, menyimpan, mengunggah]);

  const dataTampil = useMemo(() => {
    const kata = cari.toLowerCase().trim();

    return data.filter((item) => {
      const cocokKata =
        !kata ||
        [
          item.nama_peserta,
          item.nama_pelajaran,
          item.nama_tutor,
          item.catatan,
          item.materi_diajarkan,
          item.kesimpulan_pemahaman,
          item.lokasi,
        ].some((nilai) =>
          String(nilai || "").toLowerCase().includes(kata)
        );

      return (
        cocokKata &&
        (!filterTanggal ||
          String(item.tanggal || "").slice(0, 10) === filterTanggal) &&
        (!filterStatus || item.status === filterStatus) &&
        (!filterPeserta ||
          String(item.peserta_id) === String(filterPeserta))
      );
    });
  }, [data, cari, filterTanggal, filterStatus, filterPeserta]);

  const statistik = useMemo(
    () => ({
      total: dataTampil.length,
      hadir: dataTampil.filter((item) => item.status === "hadir").length,
      izin: dataTampil.filter((item) => item.status === "izin").length,
      sakit: dataTampil.filter((item) => item.status === "sakit").length,
      alfa: dataTampil.filter((item) => item.status === "alfa").length,
    }),
    [dataTampil]
  );

  function bukaTambah() {
    setForm({ ...FORM_KOSONG });
    setFileFoto(null);
    setPratinjauFoto("");
    setModalForm(true);
  }

  function bukaEdit(item) {
    setForm({
      id: item.id,
      jadwal_id: String(item.jadwal_id),
      peserta_id: String(item.peserta_id),
      status: item.status || "hadir",
      catatan: item.catatan || "",
      bukti_foto: item.bukti_foto || "",
      materi_diajarkan: item.materi_diajarkan || "",
      kesimpulan_pemahaman: item.kesimpulan_pemahaman || "",
    });

    setFileFoto(null);
    setPratinjauFoto(item.bukti_foto || "");
    setModalForm(true);
  }

  function bukaDetail(item) {
    setDetail(item);
    setModalDetail(true);
  }

  function bukaFoto(item) {
    if (!item?.bukti_foto) return;

    setFotoPopup({
      url: item.bukti_foto,
      nama: item.nama_peserta || "Peserta",
      tanggal: formatTanggal(item.tanggal),
    });
  }

  function ubahJadwal(value) {
    const dipilih = jadwal.find(
      (item) => String(item.id) === String(value)
    );

    setForm((sebelumnya) => ({
      ...sebelumnya,
      jadwal_id: value,
      peserta_id: dipilih ? String(dipilih.peserta_id) : "",
    }));
  }

  async function unggahFoto() {
    if (!fileFoto) return form.bukti_foto || "";

    const formData = new FormData();
    formData.append("foto", fileFoto);

    setMengunggah(true);

    try {
      const response = await fetch("/api/admin/presensi/upload", {
        method: "POST",
        body: formData,
      });

      const hasil = await response.json();

      if (!response.ok || !hasil.success || !hasil.path) {
        throw new Error(
          hasil.message || "Gagal mengunggah foto."
        );
      }

      return hasil.path;
    } finally {
      setMengunggah(false);
    }
  }

  async function simpanPresensi(event) {
    event.preventDefault();

    if (!form.jadwal_id || !form.peserta_id) {
      tampilkanPesan(
        "Pilih jadwal les terlebih dahulu.",
        "error"
      );
      return;
    }

    const jadwalDipilih = jadwal.find(
      (item) => String(item.id) === String(form.jadwal_id)
    );

    if (
      jadwalDipilih &&
      String(jadwalDipilih.peserta_id) !== String(form.peserta_id)
    ) {
      tampilkanPesan(
        "Peserta harus sesuai dengan peserta pada jadwal yang dipilih.",
        "error"
      );
      return;
    }

    setMenyimpan(true);

    try {
      const pathFoto = await unggahFoto();

      const payload = {
        ...form,
        bukti_foto: pathFoto,
      };

      const response = await fetch("/api/admin/presensi", {
        method: form.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const hasil = await response.json();

      if (!response.ok || !hasil.success) {
        throw new Error(
          hasil.message || "Gagal menyimpan presensi."
        );
      }

      setModalForm(false);
      setForm({ ...FORM_KOSONG });
      setFileFoto(null);
      setPratinjauFoto("");

      tampilkanPesan(
        hasil.message || "Presensi berhasil disimpan."
      );

      await muatData();
    } catch (error) {
      tampilkanPesan(
        error.message || "Terjadi kesalahan.",
        "error"
      );
    } finally {
      setMenyimpan(false);
    }
  }

  async function hapusPresensi(item) {
    const konfirmasi = window.confirm(
      `Hapus presensi ${item.nama_peserta || "peserta"} tanggal ${formatTanggal(item.tanggal)}?`
    );

    if (!konfirmasi) return;

    try {
      const response = await fetch(
        `/api/admin/presensi?id=${encodeURIComponent(item.id)}`,
        { method: "DELETE" }
      );

      const hasil = await response.json();

      if (!response.ok || !hasil.success) {
        throw new Error(
          hasil.message || "Gagal menghapus presensi."
        );
      }

      tampilkanPesan(
        hasil.message || "Presensi berhasil dihapus."
      );

      if (detail && String(detail.id) === String(item.id)) {
        setModalDetail(false);
        setDetail(null);
      }

      await muatData();
    } catch (error) {
      tampilkanPesan(
        error.message || "Terjadi kesalahan.",
        "error"
      );
    }
  }

  function resetFilter() {
    setCari("");
    setFilterTanggal("");
    setFilterStatus("");
    setFilterPeserta("");
  }

  function pilihFoto(event) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setFileFoto(null);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      tampilkanPesan(
        "Gunakan foto JPG, PNG, atau WebP.",
        "error"
      );

      event.target.value = "";
      setFileFoto(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      tampilkanPesan(
        "Ukuran foto maksimal 5 MB.",
        "error"
      );

      event.target.value = "";
      setFileFoto(null);
      return;
    }

    setFileFoto(file);
  }

  function batalkanFotoBaru() {
    setFileFoto(null);
    setPratinjauFoto(form.bukti_foto || "");

    const input = document.getElementById("formFoto");

    if (input) input.value = "";
  }

  function tutupForm() {
    if (menyimpan || mengunggah) return;

    setModalForm(false);
    setFileFoto(null);
    setPratinjauFoto("");
  }

  return (
    <main className="presensi-halaman">
      <div className="presensi-konten">
        <header className="presensi-header no-print">
          <div className="presensi-header-info">
            <Link href="/admin" className="presensi-kembali">
              ← Kembali ke Dashboard
            </Link>

            <p className="presensi-label-atas">
              MANAJEMEN LES MANULI
            </p>

            <h1>Presensi Peserta</h1>

            <p className="presensi-subjudul">
              Kelola kehadiran, bukti kegiatan belajar, dan laporan
              pembelajaran peserta les.
            </p>
          </div>

          <div className="presensi-header-tombol">
            <button
              type="button"
              className="presensi-tombol presensi-tombol-terang"
              onClick={() => window.print()}
            >
              <span aria-hidden="true">▤</span> Cetak / PDF
            </button>

            <button
              type="button"
              className="presensi-tombol presensi-tombol-utama"
              onClick={bukaTambah}
            >
              + Tambah Presensi
            </button>
          </div>
        </header>

        <section className="presensi-kepala-cetak print-only">
          <h1>Laporan Presensi Peserta Les</h1>
          <p>Manuli — Laporan kehadiran dan pembelajaran</p>
          <p>Tanggal cetak: {tanggalCetak || "-"}</p>
        </section>

        {pesan && (
          <div
            className={`presensi-pesan ${
              jenisPesan === "error"
                ? "pesan-error"
                : "pesan-sukses"
            } no-print`}
            role="status"
          >
            <span>{pesan}</span>

            <button
              type="button"
              aria-label="Tutup pesan"
              onClick={() => setPesan("")}
            >
              ×
            </button>
          </div>
        )}

        <section className="presensi-statistik">
          {[
            ["Total Data", statistik.total, "statistik-total", "▤"],
            ["Hadir", statistik.hadir, "statistik-hadir", "✓"],
            ["Izin", statistik.izin, "statistik-izin", "◷"],
            ["Sakit", statistik.sakit, "statistik-sakit", "+"],
            ["Alfa", statistik.alfa, "statistik-alfa", "!"],
          ].map(([label, jumlah, kelas, ikon]) => (
            <div
              className={`presensi-kartu-statistik ${kelas}`}
              key={label}
            >
              <span className="statistik-ikon">{ikon}</span>

              <div>
                <p>{label}</p>
                <strong>{jumlah}</strong>
              </div>
            </div>
          ))}
        </section>

        <section className="presensi-panel">
          <div className="presensi-panel-kepala no-print">
            <div>
              <h2>Daftar Presensi</h2>
              <p>
                Cari peserta, saring data, atau buka rincian pembelajaran.
              </p>
            </div>

            <span className="presensi-jumlah">
              {dataTampil.length} data ditampilkan
            </span>
          </div>

          <div className="presensi-filter no-print">
            <div className="presensi-field presensi-field-cari">
              <label htmlFor="cariPresensi">Pencarian</label>
              <input
                id="cariPresensi"
                type="search"
                placeholder="Cari peserta, tutor, materi..."
                value={cari}
                onChange={(e) => setCari(e.target.value)}
              />
            </div>

            <div className="presensi-field">
              <label htmlFor="filterTanggal">Tanggal les</label>
              <input
                id="filterTanggal"
                type="date"
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
              />
            </div>

            <div className="presensi-field">
              <label htmlFor="filterStatus">Status</label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Semua status</option>

                {Object.entries(LABEL_STATUS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="presensi-field">
              <label htmlFor="filterPeserta">Peserta</label>
              <select
                id="filterPeserta"
                value={filterPeserta}
                onChange={(e) => setFilterPeserta(e.target.value)}
              >
                <option value="">Semua peserta</option>

                {peserta.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="presensi-tombol presensi-tombol-terang tombol-reset"
              onClick={resetFilter}
            >
              Reset Filter
            </button>
          </div>

          <div className="presensi-tabel-pembungkus">
            <table className="presensi-tabel">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Tanggal / Waktu</th>
                  <th>Peserta</th>
                  <th>Jadwal / Pelajaran</th>
                  <th>Tutor</th>
                  <th>Status</th>
                  <th>Bukti Foto</th>
                  <th>Materi</th>
                  <th>Kesimpulan</th>
                  <th>Catatan</th>
                  <th className="no-print">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="presensi-tabel-kosong">
                      <span className="presensi-memuat-ikon">◌</span>
                      <strong>Memuat data presensi...</strong>
                    </td>
                  </tr>
                ) : dataTampil.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="presensi-tabel-kosong">
                      <span className="presensi-kosong-ikon">▤</span>
                      <strong>Belum ada data presensi</strong>
                      <p>Tambahkan data atau ubah filter pencarian.</p>
                    </td>
                  </tr>
                ) : (
                  dataTampil.map((item, index) => (
                    <tr key={item.id}>
                      <td className="presensi-nomor">
                        {index + 1}
                      </td>

                      <td className="presensi-tanggal">
                        <strong>{formatTanggal(item.tanggal)}</strong>
                        <small>
                          {formatJam(item.jam_mulai)}–{formatJam(item.jam_selesai)}
                        </small>
                      </td>

                      <td>
                        <strong className="presensi-nama-peserta">
                          {item.nama_peserta || "-"}
                        </strong>
                      </td>

                      <td>
                        <strong>{item.nama_pelajaran || "-"}</strong>
                        <small>
                          {item.lokasi || "Lokasi belum diisi"}
                        </small>
                      </td>

                      <td>{item.nama_tutor || "-"}</td>

                      <td>
                        <span
                          className={`status-badge status-${item.status}`}
                        >
                          <span className="status-titik" />
                          {LABEL_STATUS[item.status] || item.status || "-"}
                        </span>
                      </td>

                      <td className="kolom-foto">
                        {item.bukti_foto ? (
                          <button
                            type="button"
                            className="presensi-lihat-foto"
                            onClick={() => bukaFoto(item)}
                            aria-label={`Lihat foto presensi ${item.nama_peserta}`}
                          >
                            <img
                              src={item.bukti_foto}
                              alt=""
                              className="presensi-thumbnail"
                            />
                            <span>Lihat foto</span>
                          </button>
                        ) : (
                          <span className="presensi-belum-ada">
                            Belum ada foto
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className="presensi-ringkasan"
                          title={item.materi_diajarkan || ""}
                        >
                          {ringkasTeks(item.materi_diajarkan)}
                        </span>
                      </td>

                      <td>
                        <span
                          className="presensi-ringkasan"
                          title={item.kesimpulan_pemahaman || ""}
                        >
                          {ringkasTeks(item.kesimpulan_pemahaman)}
                        </span>
                      </td>

                      <td>
                        <span
                          className="presensi-ringkasan"
                          title={item.catatan || ""}
                        >
                          {ringkasTeks(item.catatan, 55)}
                        </span>
                      </td>

                      <td className="presensi-aksi no-print">
                        <button
                          type="button"
                          className="aksi-detail"
                          onClick={() => bukaDetail(item)}
                        >
                          Detail
                        </button>

                        <button
                          type="button"
                          className="aksi-edit"
                          onClick={() => bukaEdit(item)}
                        >
                          Ubah
                        </button>

                        <button
                          type="button"
                          className="aksi-hapus"
                          onClick={() => hapusPresensi(item)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="presensi-catatan-kaki no-print">
            <span>
              <span className="titik-status titik-ungu" />
              Data dibatasi hingga 500 baris dari API.
            </span>

            <span>Manuli · Presensi Peserta</span>
          </div>
        </section>
      </div>

      {/* FORM TAMBAH DAN UBAH */}
      {modalForm && (
        <div
          className="presensi-lapisan-modal no-print"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !menyimpan &&
              !mengunggah
            ) {
              tutupForm();
            }
          }}
        >
          <section
            className="presensi-modal presensi-modal-lebar"
            role="dialog"
            aria-modal="true"
            aria-labelledby="judulFormPresensi"
          >
            <header className="presensi-modal-kepala">
              <div>
                <p className="presensi-label-atas">
                  FORMULIR PRESENSI
                </p>

                <h2 id="judulFormPresensi">
                  {form.id ? "Ubah Presensi" : "Tambah Presensi"}
                </h2>

                <p>
                  Lengkapi kehadiran dan laporan kegiatan pembelajaran.
                </p>
              </div>

              <button
                type="button"
                className="presensi-tutup-modal"
                onClick={tutupForm}
                disabled={menyimpan || mengunggah}
                aria-label="Tutup formulir"
              >
                ×
              </button>
            </header>

            <form onSubmit={simpanPresensi}>
              <div className="presensi-form-grid">
                <div className="presensi-field">
                  <label htmlFor="formJadwal">Jadwal les *</label>

                  <select
                    id="formJadwal"
                    required
                    value={form.jadwal_id}
                    onChange={(e) => ubahJadwal(e.target.value)}
                  >
                    <option value="">Pilih jadwal</option>

                    {jadwal.map((item) => (
                      <option key={item.id} value={item.id}>
                        {formatTanggal(item.tanggal)} · {item.nama_peserta} ·{" "}
                        {item.nama_pelajaran || "Les"} ·{" "}
                        {formatJam(item.jam_mulai)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="presensi-field">
                  <label htmlFor="formPeserta">Peserta *</label>

                  <select
                    id="formPeserta"
                    required
                    disabled={!form.jadwal_id}
                    value={form.peserta_id}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        peserta_id: e.target.value,
                      }))
                    }
                  >
                    <option value="">Pilih peserta dari jadwal</option>

                    {peserta.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nama}
                      </option>
                    ))}
                  </select>

                  <small>
                    Peserta mengikuti peserta pada jadwal les yang dipilih.
                  </small>
                </div>

                <div className="presensi-field">
                  <label htmlFor="formStatus">Status kehadiran *</label>

                  <select
                    id="formStatus"
                    required
                    value={form.status}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        status: e.target.value,
                      }))
                    }
                  >
                    {Object.entries(LABEL_STATUS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="presensi-field">
                  <label htmlFor="formCatatan">Catatan tambahan</label>

                  <input
                    id="formCatatan"
                    maxLength={255}
                    value={form.catatan}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        catatan: e.target.value,
                      }))
                    }
                    placeholder="Catatan singkat (opsional)"
                  />
                </div>

                <div className="presensi-field presensi-field-penuh">
                  <label htmlFor="formMateri">
                    Materi yang diajarkan
                  </label>

                  <textarea
                    id="formMateri"
                    rows={3}
                    maxLength={10000}
                    value={form.materi_diajarkan}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        materi_diajarkan: e.target.value,
                      }))
                    }
                    placeholder="Tuliskan materi yang dipelajari peserta..."
                  />
                </div>

                <div className="presensi-field presensi-field-penuh">
                  <label htmlFor="formKesimpulan">
                    Kesimpulan pemahaman peserta
                  </label>

                  <textarea
                    id="formKesimpulan"
                    rows={3}
                    maxLength={10000}
                    value={form.kesimpulan_pemahaman}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        kesimpulan_pemahaman: e.target.value,
                      }))
                    }
                    placeholder="Tuliskan tingkat pemahaman peserta..."
                  />
                </div>

                <div className="presensi-field presensi-field-penuh">
                  <label htmlFor="formFoto">
                    Bukti foto pembelajaran
                  </label>

                  <input
                    id="formFoto"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={pilihFoto}
                  />

                  <small>
                    Format JPG, PNG, atau WebP. Maksimal 5 MB.
                  </small>

                  {pratinjauFoto && (
                    <div className="presensi-pratinjau">
                      <button
                        type="button"
                        className="presensi-pratinjau-gambar"
                        onClick={() =>
                          bukaFoto({
                            bukti_foto: pratinjauFoto,
                            nama_peserta:
                              jadwal.find(
                                (j) =>
                                  String(j.id) === String(form.jadwal_id)
                              )?.nama_peserta || "Peserta",
                            tanggal: jadwal.find(
                              (j) =>
                                String(j.id) === String(form.jadwal_id)
                            )?.tanggal,
                          })
                        }
                      >
                        <img
                          src={pratinjauFoto}
                          alt="Pratinjau bukti foto"
                        />
                        <span>Lihat foto</span>
                      </button>

                      <div>
                        <strong>
                          {fileFoto ? fileFoto.name : "Foto tersimpan"}
                        </strong>

                        <p>
                          {fileFoto
                            ? "Foto baru akan diunggah saat disimpan."
                            : "Pilih foto baru jika ingin menggantinya."}
                        </p>

                        {fileFoto && (
                          <button
                            type="button"
                            className="aksi-hapus"
                            onClick={batalkanFotoBaru}
                          >
                            Batalkan foto baru
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <footer className="presensi-modal-kaki">
                <button
                  type="button"
                  className="presensi-tombol presensi-tombol-terang"
                  onClick={tutupForm}
                  disabled={menyimpan || mengunggah}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="presensi-tombol presensi-tombol-utama"
                  disabled={menyimpan || mengunggah}
                >
                  {mengunggah
                    ? "Mengunggah foto..."
                    : menyimpan
                      ? "Menyimpan..."
                      : form.id
                        ? "Simpan Perubahan"
                        : "Simpan Presensi"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* MODAL DETAIL PRESENSI */}
      {modalDetail && detail && (
        <div
          className="presensi-lapisan-modal no-print"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setModalDetail(false);
            }
          }}
        >
          <section
            className="presensi-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="judulDetailPresensi"
          >
            <header className="presensi-modal-kepala">
              <div>
                <p className="presensi-label-atas">
                  RINCIAN PEMBELAJARAN
                </p>

                <h2 id="judulDetailPresensi">Detail Presensi</h2>

                <p>
                  Informasi lengkap kehadiran dan kegiatan belajar.
                </p>
              </div>

              <button
                type="button"
                className="presensi-tutup-modal"
                onClick={() => setModalDetail(false)}
                aria-label="Tutup detail"
              >
                ×
              </button>
            </header>

            <div className="presensi-detail">
              {[
                ["Nama peserta", detail.nama_peserta],
                ["Tanggal les", formatTanggal(detail.tanggal)],
                [
                  "Waktu",
                  `${formatJam(detail.jam_mulai)}–${formatJam(detail.jam_selesai)}`,
                ],
                ["Mata pelajaran", detail.nama_pelajaran || "-"],
                ["Lokasi", detail.lokasi || "-"],
                ["Tutor", detail.nama_tutor || "-"],
                [
                  "Status",
                  LABEL_STATUS[detail.status] || detail.status || "-",
                ],
              ].map(([label, value]) => (
                <div className="presensi-detail-baris" key={label}>
                  <span>{label}</span>
                  <strong>{value || "-"}</strong>
                </div>
              ))}

              <div className="presensi-detail-baris detail-kolom">
                <span>Materi yang diajarkan</span>
                <p>
                  {detail.materi_diajarkan || "Belum ada materi."}
                </p>
              </div>

              <div className="presensi-detail-baris detail-kolom">
                <span>Kesimpulan pemahaman</span>
                <p>
                  {detail.kesimpulan_pemahaman ||
                    "Belum ada kesimpulan pemahaman."}
                </p>
              </div>

              <div className="presensi-detail-baris detail-kolom">
                <span>Catatan tambahan</span>
                <p>{detail.catatan || "Tidak ada catatan."}</p>
              </div>

              <div className="presensi-detail-baris detail-kolom">
                <span>Bukti foto pembelajaran</span>

                {detail.bukti_foto ? (
                  <button
                    type="button"
                    className="presensi-detail-foto-link"
                    onClick={() => bukaFoto(detail)}
                  >
                    <img
                      src={detail.bukti_foto}
                      alt=""
                    />
                    <span>Lihat foto ukuran besar</span>
                  </button>
                ) : (
                  <p>Belum ada bukti foto.</p>
                )}
              </div>

              <div className="presensi-detail-baris">
                <span>Dicatat pada</span>
                <strong>
                  {formatTanggalWaktu(detail.dicatat_pada)}
                </strong>
              </div>
            </div>

            <footer className="presensi-modal-kaki">
              <button
                type="button"
                className="presensi-tombol presensi-tombol-terang"
                onClick={() => setModalDetail(false)}
              >
                Tutup
              </button>

              <button
                type="button"
                className="presensi-tombol presensi-tombol-utama"
                onClick={() => {
                  setModalDetail(false);
                  bukaEdit(detail);
                }}
              >
                Ubah Data
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* POP-UP FOTO UKURAN BESAR */}
      {fotoPopup && (
        <div
          className="presensi-foto-overlay no-print"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setFotoPopup(null);
            }
          }}
        >
          <section
            className="presensi-foto-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="judulPopupFoto"
          >
            <header className="presensi-foto-header">
              <div>
                <p className="presensi-label-atas">
                  BUKTI PEMBELAJARAN
                </p>

                <h2 id="judulPopupFoto">Foto Presensi</h2>

                <p>
                  {fotoPopup.nama} · {fotoPopup.tanggal}
                </p>
              </div>

              <button
                type="button"
                className="presensi-tutup-modal"
                onClick={() => setFotoPopup(null)}
                aria-label="Tutup foto"
              >
                ×
              </button>
            </header>

            <div className="presensi-foto-isi">
              <img
                src={fotoPopup.url}
                alt={`Bukti pembelajaran ${fotoPopup.nama}`}
                className="presensi-foto-besar"
              />
            </div>

            <footer className="presensi-foto-footer">
              <button
                type="button"
                className="presensi-tombol presensi-tombol-terang"
                onClick={() => setFotoPopup(null)}
              >
                Tutup
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
