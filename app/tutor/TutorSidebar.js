
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function TutorSidebar() {
  const pathname = usePathname();
  const [namaTutor, setNamaTutor] = useState("");

  useEffect(() => {
    async function ambilProfilTutor() {
      try {
        const response = await fetch("/api/tutor/profil");

        if (!response.ok) {
          setNamaTutor("Tutor");
          return;
        }

        const hasil = await response.json();
        setNamaTutor(hasil.nama || "Tutor");
      } catch (error) {
        console.error("Gagal mengambil nama tutor:", error);
        setNamaTutor("Tutor");
      }
    }

    ambilProfilTutor();
  }, []);

  const inisial =
    namaTutor
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((kata) => kata[0]?.toUpperCase())
      .join("") || "T";

  const menu = [
    { href: "/tutor", ikon: "⌂", label: "Dashboard" },
    { href: "/tutor/jadwal", ikon: "▦", label: "Jadwal Les" },
    { href: "/tutor/peserta", ikon: "♙", label: "Data Peserta" },
    { href: "/tutor/presensi", ikon: "✓", label: "Presensi" },
  ];

  function halamanAktif(href) {
    if (href === "/tutor") {
      return pathname === "/tutor";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="tutor-sidebar">
      <Link href="/tutor" className="tutor-brand">
        <span className="tutor-brand-logo">M</span>

        <span className="tutor-brand-text">
          <strong>manuli</strong>
          <small>Ruang mengajar</small>
        </span>
      </Link>

      <div className="tutor-profile">
        <div className="tutor-avatar">{inisial}</div>

        <div className="tutor-profile-info">
          <strong>{namaTutor || "Memuat nama..."}</strong>
          <span>Tutor Manuli</span>
        </div>

        <span className="tutor-profile-dot" />
      </div>

      <p className="tutor-menu-label">MENU UTAMA</p>

      <nav className="tutor-navigation">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`tutor-nav-item ${
              halamanAktif(item.href) ? "active" : ""
            }`}
          >
            <span className="tutor-nav-icon">{item.ikon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="tutor-sidebar-note">
        <div className="tutor-note-icon">✦</div>
        <strong>Menjadi tutor inspiratif</strong>
        <p>
          Bantu setiap peserta berkembang melalui proses belajar
          yang menyenangkan.
        </p>
      </div>

      <div className="tutor-sidebar-footer">
        <span className="tutor-online-dot" />
        Akun tutor aktif
      </div>
    </aside>
  );
}
