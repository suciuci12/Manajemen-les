
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "./akses.css";

function ProsesAkses() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sudahDiproses = useRef(false);

  const [status, setStatus] = useState("memuat");
  const [pesan, setPesan] = useState(
    "Sedang memeriksa tautan akses Anda..."
  );

  useEffect(() => {
    if (sudahDiproses.current) return;
    sudahDiproses.current = true;

    async function proses() {
      // Ambil token dari URL tanpa mengubah isinya.
      const token = searchParams.get("token");

      if (!token) {
        setStatus("gagal");
        setPesan(
          "Token tidak ditemukan. Pastikan Anda membuka tautan lengkap dari admin."
        );
        return;
      }

      // Token dari buatTokenAkses() seharusnya 64 karakter hex.
      if (!/^[a-f0-9]{64}$/i.test(token)) {
        setStatus("gagal");
        setPesan(
          `Format tautan tidak valid. Panjang token yang diterima: ${token.length} karakter. Silakan buat tautan baru.`
        );
        return;
      }

      try {
        const response = await fetch("/api/orang-tua/akses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({ token }),
        });

        const teks = await response.text();
        let hasil;

        try {
          hasil = JSON.parse(teks);
        } catch {
          console.error(
            "Respons API bukan JSON:",
            response.status,
            teks.slice(0, 300)
          );

          throw new Error(
            response.status === 404
              ? "API akses tidak ditemukan. Periksa lokasi file route.js."
              : "Server mengembalikan respons yang tidak sesuai. Periksa terminal Next.js."
          );
        }

        if (!response.ok || !hasil.success) {
          throw new Error(
            hasil.message || "Tautan gagal divalidasi."
          );
        }

        setStatus("berhasil");
        setPesan("Akses berhasil. Membuka dashboard orang tua...");

        // Hapus token dari address bar sebelum pindah halaman.
        window.history.replaceState(
          {},
          "",
          "/orang-tua/akses"
        );

        router.replace("/orang-tua");
      } catch (error) {
        console.error("Proses akses orang tua:", error);
        setStatus("gagal");
        setPesan(
          error.message ||
            "Terjadi kesalahan saat memeriksa tautan."
        );
      }
    }

    proses();
  }, [router, searchParams]);

  return (
    <main className="akses-container">
      <section className="akses-card">
        <div className="akses-logo">M</div>
        <p className="akses-brand">MANULI</p>

        <h1>
          {status === "memuat"
            ? "Selamat Datang"
            : status === "berhasil"
              ? "Akses Berhasil"
              : "Akses Belum Berhasil"}
        </h1>

        <p className="akses-deskripsi">
          Portal orang tua untuk memantau jadwal les dan perkembangan peserta.
        </p>

        {status === "memuat" && (
          <div className="akses-loading" role="status" />
        )}

        {status === "berhasil" && (
          <div className="akses-icon sukses">✓</div>
        )}

        {status === "gagal" && (
          <div className="akses-icon gagal">!</div>
        )}

        <div
          className={`akses-status ${
            status === "gagal"
              ? "error"
              : status === "berhasil"
                ? "sukses"
                : ""
          }`}
          role={status === "gagal" ? "alert" : "status"}
        >
          {pesan}
        </div>

        {status === "gagal" && (
          <button
            type="button"
            className="akses-tombol"
            onClick={() => router.replace("/orang-tua")}
          >
            Kembali
          </button>
        )}

        <p className="akses-footer">
          Manuli · Sistem Manajemen Les
        </p>
      </section>
    </main>
  );
}

export default function AksesOrangTuaPage() {
  return (
    <Suspense
      fallback={
        <main className="akses-container">
          <section className="akses-card">
            <div className="akses-logo">M</div>
            <h1>Manuli</h1>
            <div className="akses-loading" />
            <p className="akses-deskripsi">
              Menyiapkan halaman akses...
            </p>
          </section>
        </main>
      }
    >
      <ProsesAkses />
    </Suspense>
  );
}
