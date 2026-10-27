
"use client";

import { useEffect, useRef, useState } from "react";
import "./landing-page.css";

const nomorWhatsApp = "6289630337347";

const programLes = [
  {
    gambar: "/images/program-coding.png",
    kategori: "Teknologi",
    judul: "Komputer & Coding",
    deskripsi:
      "Belajar komputer, dasar pemrograman, website, dan logika coding dengan cara yang menyenangkan.",
    warna: "ungu",
    materi: ["Dasar komputer", "HTML, CSS & JavaScript", "Pemrograman web"],
  },
  {
    gambar: "/images/program-office.png",
    kategori: "Produktivitas",
    judul: "Microsoft Office",
    deskripsi:
      "Tingkatkan kemampuan mengolah dokumen, data, dan presentasi untuk sekolah maupun pekerjaan.",
    warna: "pink",
    materi: ["Microsoft Word", "Microsoft Excel", "Microsoft PowerPoint"],
  },
  {
    gambar: "/images/program-uiux.png",
    kategori: "Kreativitas",
    judul: "UI/UX Design",
    deskripsi:
      "Kenali dunia desain digital dan pelajari cara membuat tampilan aplikasi yang menarik dan mudah digunakan.",
    warna: "peach",
    materi: ["Dasar desain", "Wireframe", "Desain antarmuka"],
  },
];

const kegiatan = [
  {
    nomor: "01",
    judul: "Belajar komputer",
    deskripsi: "Mengenal teknologi sambil praktik.",
    foto: "/images/mengajar-1.jpg",
    warna: "galeri-ungu",
  },
  {
    nomor: "02",
    judul: "Belajar coding",
    deskripsi: "Berlatih menyusun kode langkah demi langkah.",
    foto: "/images/mengajar-2.jpg",
    warna: "galeri-pink",
  },
  {
    nomor: "03",
    judul: "Belajar bersama",
    deskripsi: "Membangun kreativitas melalui praktik.",
    foto: "/images/mengajar-3.jpg",
    warna: "galeri-peach",
  },
];

const dekorasi = [
  { simbol: "✦", posisi: "sparkle-a", jeda: "0s" },
  { simbol: "✧", posisi: "sparkle-b", jeda: "1.2s" },
  { simbol: "✦", posisi: "sparkle-c", jeda: "2.1s" },
  { simbol: "✧", posisi: "sparkle-d", jeda: ".7s" },
  { simbol: "✳", posisi: "sparkle-e", jeda: "1.8s" },
  { simbol: "✦", posisi: "sparkle-f", jeda: ".4s" },
];

function buatLinkWhatsApp(pesan) {
  return `https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(pesan)}`;
}

function GambarAman({
  src,
  alt,
  className = "",
  fallbackTitle = "Gambar Manuli",
  objectFit = "cover",
}) {
  const [gagalMuat, setGagalMuat] = useState(false);

  useEffect(() => {
    setGagalMuat(false);
  }, [src]);

  if (gagalMuat) {
    return (
      <div className={`image-fallback ${className}`}>
        <span className="fallback-symbol">M</span>
        <span>{fallbackTitle}</span>
        <small>Periksa file di public/images</small>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      style={{ objectFit }}
      onError={() => setGagalMuat(true)}
    />
  );
}

function useScrollReveal() {
  useEffect(() => {
    const elemen = document.querySelectorAll(
      ".reveal, .reveal-left, .reveal-right, .reveal-scale"
    );

    if (!("IntersectionObserver" in window)) {
      elemen.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -35px 0px" }
    );

    elemen.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
}

function KartuProgram({ program, index }) {
  const kartuRef = useRef(null);

  function gerakkanKartu(event) {
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const kartu = kartuRef.current;
    if (!kartu) return;

    const rect = kartu.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    kartu.style.setProperty("--tilt-x", `${(0.5 - y) * 6}deg`);
    kartu.style.setProperty("--tilt-y", `${(x - 0.5) * 6}deg`);
    kartu.style.setProperty("--mouse-x", `${x * 100}%`);
    kartu.style.setProperty("--mouse-y", `${y * 100}%`);
  }

  function resetKartu() {
    const kartu = kartuRef.current;
    if (!kartu) return;
    kartu.style.setProperty("--tilt-x", "0deg");
    kartu.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <article
      ref={kartuRef}
      className={`program-card card-${program.warna} reveal`}
      style={{ "--card-index": index }}
      onMouseMove={gerakkanKartu}
      onMouseLeave={resetKartu}
    >
      <div className="program-card-top">
        <div className="program-image">
          <GambarAman
            src={program.gambar}
            alt={`Ilustrasi ${program.judul}`}
            fallbackTitle={program.judul}
            objectFit="contain"
          />
        </div>
        <span className="program-category">{program.kategori}</span>
      </div>

      <h3>{program.judul}</h3>
      <p>{program.deskripsi}</p>

      <div className="program-materi">
        {program.materi.map((materi) => (
          <span key={materi}>
            <span className="check-mark">✓</span>
            {materi}
          </span>
        ))}
      </div>

      <a
        className="program-link"
        href={buatLinkWhatsApp(
          `Halo Kak Suci, saya tertarik dengan program ${program.judul} di Manuli. Boleh minta informasi lebih lanjut?`
        )}
        target="_blank"
        rel="noreferrer"
      >
        Tanya program ini <span>↗</span>
      </a>
    </article>
  );
}

export default function LandingPage() {
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [navbarMengecil, setNavbarMengecil] = useState(false);
  const [fotoAktif, setFotoAktif] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useScrollReveal();

  useEffect(() => {
    const saatScroll = () => setNavbarMengecil(window.scrollY > 24);
    window.addEventListener("scroll", saatScroll, { passive: true });
    saatScroll();

    return () => window.removeEventListener("scroll", saatScroll);
  }, []);

  useEffect(() => {
    if (!fotoAktif) return;

    const tutupDenganEscape = (event) => {
      if (event.key === "Escape") setFotoAktif(null);
    };

    document.addEventListener("keydown", tutupDenganEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", tutupDenganEscape);
      document.body.style.overflow = "";
    };
  }, [fotoAktif]);

  function gerakkanHero(event) {
    if (window.matchMedia("(hover: none)").matches) return;

    const rect = event.currentTarget.getBoundingClientRect();
    setMouse({
      x: (event.clientX - rect.left) / rect.width - 0.5,
      y: (event.clientY - rect.top) / rect.height - 0.5,
    });
  }

  function resetHero() {
    setMouse({ x: 0, y: 0 });
  }

  const tutupMenu = () => setMenuTerbuka(false);

  return (
    <main className="manuli-landing">
      {/* DEKORASI BERGERAK DI LATAR */}
      <div className="ambient-decoration" aria-hidden="true">
        {dekorasi.map((item, index) => (
          <span
            key={item.posisi}
            className={`ambient-sparkle ${item.posisi}`}
            style={{
              "--sparkle-delay": item.jeda,
              "--sparkle-index": index,
            }}
          >
            {item.simbol}
          </span>
        ))}
        <span className="ambient-orb orb-lavender" />
        <span className="ambient-orb orb-pink" />
        <span className="ambient-orb orb-peach" />
      </div>

      {/* NAVIGASI */}
      <header className={`navbar ${navbarMengecil ? "navbar-scrolled" : ""}`}>
        <a className="brand" href="#beranda" onClick={tutupMenu}>
          <span className="brand-logo-wrap">
            <GambarAman
              src="/images/logo-manuli.png"
              alt="Logo Manuli"
              className="brand-logo"
              fallbackTitle="Logo Manuli"
              objectFit="contain"
            />
            <span className="logo-twinkle" aria-hidden="true">✦</span>
          </span>
          <span className="brand-text">
            <strong>manuli</strong>
            <small>LEARNING SPACE</small>
          </span>
        </a>

        <button
          type="button"
          className="menu-toggle"
          onClick={() => setMenuTerbuka(!menuTerbuka)}
          aria-label={menuTerbuka ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuTerbuka}
        >
          {menuTerbuka ? "✕" : "☰"}
        </button>

        <nav className={`nav-links ${menuTerbuka ? "nav-active" : ""}`}>
          {[
            ["#beranda", "Beranda"],
            ["#tentang", "Tentang Saya"],
            ["#program", "Program Les"],
            ["#galeri", "Galeri"],
            ["#kontak", "Kontak"],
          ].map(([href, label]) => (
            <a key={href} href={href} onClick={tutupMenu}>
              {label}
            </a>
          ))}

          <a
            className="nav-cta"
            href={buatLinkWhatsApp(
              "Halo Kak Suci, saya ingin bertanya tentang program les Manuli."
            )}
            target="_blank"
            rel="noreferrer"
          >
            Yuk, Daftar! ↗
          </a>
        </nav>
      </header>

      {/* BERANDA */}
      <section
        className="hero section-wrap"
        id="beranda"
        onMouseMove={gerakkanHero}
        onMouseLeave={resetHero}
      >
        <span className="hero-decor decor-star">✦</span>
        <span className="hero-decor decor-heart">♡</span>
        <span className="hero-decor decor-flower">✿</span>
        <span className="hero-decor decor-sparkle">✧</span>

        <div className="hero-content reveal-left">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            TEMPAT BELAJAR PENUH CERITA
          </div>

          <h1>
            Belajar itu
            <br />
            <span className="text-gradient">menyenangkan,</span>
            <br />
            yuk tumbuh bersama!
          </h1>

          <p className="hero-description">
            Selamat datang di Manuli! Ruang belajar untuk
            mengeksplorasi teknologi, mengasah kreativitas,
            dan membangun keterampilan baru dengan cara
            yang lebih seru.
          </p>

          <div className="hero-actions">
            <a className="button-primary" href="#program">
              Jelajahi Program <span>↗</span>
            </a>
            <a className="button-secondary" href="#tentang">
              Kenalan dengan Founder
            </a>
          </div>

          <div className="hero-note">
            <span className="note-heart">♡</span>
            Belajar pelan-pelan, berkembang bersama.
          </div>
        </div>

        <div
          className="hero-visual reveal-right"
          style={{
            "--hero-x": `${mouse.x * 12}px`,
            "--hero-y": `${mouse.y * 12}px`,
          }}
        >
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />

          <div className="floating-card floating-card-top">
            <span className="floating-sparkle">✦</span>
            Belajar hal baru!
          </div>

          <div className="hero-main-card">
            <div className="hero-illustration">
              <GambarAman
                src="/images/hero-belajar.png"
                alt="Ilustrasi kegiatan belajar Manuli"
                className="hero-image"
                fallbackTitle="Ilustrasi belajar"
                objectFit="contain"
              />
              <span className="image-sparkle image-sparkle-one">✦</span>
              <span className="image-sparkle image-sparkle-two">✧</span>
            </div>
            <div className="hero-card-caption">
              <strong>Explore. Learn. Create.</strong>
              <span>Setiap anak punya potensi istimewa.</span>
            </div>
          </div>

          <div className="floating-card floating-card-bottom">
            <GambarAman
              src="/images/maskot-manuli.png"
              alt="Maskot Manuli"
              className="mini-mascot"
              fallbackTitle="Maskot Manuli"
              objectFit="contain"
            />
            Belajar dengan hati
          </div>

          {/* MASKOT MELAYANG */}
          <div className="roaming-mascot roaming-mascot-one">
            <GambarAman
              src="/images/maskot-manuli.png"
              alt=""
              className="roaming-mascot-image"
              fallbackTitle="Maskot"
              objectFit="contain"
            />
            <span>✦</span>
          </div>
          <div className="roaming-mascot roaming-mascot-two">
            <GambarAman
              src="/images/maskot-manuli.png"
              alt=""
              className="roaming-mascot-image"
              fallbackTitle="Maskot"
              objectFit="contain"
            />
          </div>
        </div>

        <a className="scroll-cue" href="#tentang">
          <span>↓</span> Kenali Manuli lebih dekat
        </a>
      </section>

      {/* KEUNGGULAN */}
      <section className="benefit-strip">
        {[
          ["01", "Belajar menyenangkan", "Suasana belajar yang positif"],
          ["02", "Belajar sambil praktik", "Memahami melalui pengalaman"],
          ["03", "Tumbuh bersama", "Mengembangkan keterampilan"],
        ].map(([nomor, judul, deskripsi], index) => (
          <div
            className="benefit-item reveal"
            style={{ "--card-index": index }}
            key={nomor}
          >
            <span className="benefit-number">{nomor}</span>
            <div>
              <strong>{judul}</strong>
              <small>{deskripsi}</small>
            </div>
          </div>
        ))}
      </section>

      {/* TENTANG FOUNDER */}
      <section className="about-section section-wrap" id="tentang">
        <div className="section-heading reveal">
          <span className="section-label">HALO, SALAM KENAL!</span>
          <h2>
            Di balik Manuli,
            <br />
            ada cerita <span className="text-gradient">tentang belajar.</span>
          </h2>
          <p>
            Berkenalan dengan sosok yang menemani perjalanan
            belajar di Manuli.
          </p>
        </div>

        <div className="founder-layout">
          <div className="founder-visual reveal-left">
            <div className="founder-frame">
              <GambarAman
                src="/images/founder-suci.jpg"
                alt="Suci Indah Sari, Founder Manuli"
                className="founder-image"
                fallbackTitle="Foto Founder Manuli"
              />
            </div>
            <span className="founder-sticker sticker-one">♡</span>
            <span className="founder-sticker sticker-two">✿</span>
            <div className="founder-caption">
              <GambarAman
                src="/images/maskot-manuli.png"
                alt=""
                className="founder-mini-mascot"
                fallbackTitle="Maskot"
                objectFit="contain"
              />
              <div>
                <strong>Made with love</strong>
                <small>For every learning journey</small>
              </div>
            </div>
          </div>

          <div className="founder-info reveal-right">
            <span className="mini-label">FOUNDER & TUTOR</span>
            <h3>Suci Indah Sari, S.Kom</h3>
            <p className="founder-intro">
              Halo! Senang sekali bisa berkenalan dengan kamu.
              Saya Suci, pendiri Manuli yang percaya bahwa
              belajar teknologi tidak harus terasa rumit.
            </p>
            <p>
              Melalui Manuli, saya ingin menghadirkan ruang
              belajar yang mendorong peserta untuk berani
              mencoba, berkreasi, dan mengembangkan kemampuan
              digital mereka selangkah demi selangkah.
            </p>

            <div className="founder-values">
              <div className="value-chip">Belajar dengan hati</div>
              <div className="value-chip">Berani bereksplorasi</div>
              <div className="value-chip">Terus berkembang</div>
            </div>

            <a
              className="text-link"
              href={buatLinkWhatsApp(
                "Halo Kak Suci, saya ingin mengenal program les Manuli lebih lanjut."
              )}
              target="_blank"
              rel="noreferrer"
            >
              Yuk, kenalan lebih dekat <span>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* PROGRAM LES */}
      <section className="program-section" id="program">
        <div className="section-wrap">
          <div className="section-heading reveal">
            <span className="section-label">PILIH PETUALANGANMU</span>
            <h2>
              Mau belajar <span className="text-gradient">apa hari ini?</span>
            </h2>
            <p>
              Temukan program yang sesuai dengan minat dan
              tujuan belajarmu.
            </p>
          </div>

          <div className="program-grid">
            {programLes.map((program, index) => (
              <KartuProgram
                key={program.judul}
                program={program}
                index={index}
              />
            ))}
          </div>

          <p className="program-note reveal">
            <span>✉</span> Tanya terlebih dahulu untuk informasi
            jadwal, biaya, dan ketersediaan program.
          </p>
        </div>
      </section>

      {/* GALERI */}
      <section className="gallery-section section-wrap" id="galeri">
        <div className="section-heading reveal">
          <span className="section-label">CERITA DI BALIK BELAJAR</span>
          <h2>
            Momen kecil,
            <br />
            <span className="text-gradient">langkah besar.</span>
          </h2>
          <p>
            Setiap latihan, pertanyaan, dan ide baru adalah
            bagian dari perjalanan belajar.
          </p>
        </div>

        <div className="gallery-grid">
          {kegiatan.map((item, index) => (
            <article
              className="gallery-card reveal"
              style={{ "--card-index": index }}
              key={item.nomor}
            >
              <button
                type="button"
                className={`gallery-image ${item.warna} gallery-open`}
                onClick={() => setFotoAktif(item)}
                aria-label={`Lihat foto ${item.judul}`}
              >
                <GambarAman
                  src={item.foto}
                  alt={item.judul}
                  className="gallery-photo"
                  fallbackTitle={item.judul}
                />
                <span className="gallery-number">{item.nomor}</span>
                <span className="gallery-zoom">Lihat foto ↗</span>
              </button>

              <div className="gallery-caption">
                <div>
                  <h3>{item.judul}</h3>
                  <p>{item.deskripsi}</p>
                </div>
                <span className="gallery-heart">♡</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* AJAKAN */}
      <section className="cta-section section-wrap" id="kontak">
        <div className="cta-card reveal-scale">
          <span className="cta-decoration cta-flower">✿</span>
          <span className="cta-decoration cta-star">✧</span>
          <span className="cta-decoration cta-heart">♡</span>

          <div className="cta-content">
            <span className="section-label">WAKTUNYA MULAI!</span>
            <h2>
              Siap memulai
              <br />
              <span>cerita belajarmu?</span>
            </h2>
            <p>
              Yuk, hubungi Manuli untuk mengetahui program
              les, jadwal, dan informasi pendaftaran.
            </p>
            <a
              className="button-primary cta-button"
              href={buatLinkWhatsApp(
                "Halo Kak Suci, saya tertarik untuk mendaftar les di Manuli. Boleh minta informasi program, jadwal, dan biayanya?"
              )}
              target="_blank"
              rel="noreferrer"
            >
              Hubungi via WhatsApp <span>↗</span>
            </a>
            <small>Senang sekali bisa belajar bersama kamu!</small>
          </div>
        </div>
      </section>

      {/* FOOTER / KREDIT PEMBUAT */}
      <footer className="footer manuli-footer" id="kredit">
        <div className="footer-sparkles" aria-hidden="true">
          <span>✦</span>
          <span>✧</span>
          <span>✦</span>
          <span>✳</span>
        </div>

        <div className="footer-inner">
          <div className="footer-top">
            <a className="brand footer-brand" href="#beranda">
              <span className="brand-logo-wrap">
                <GambarAman
                  src="/images/logo-manuli.png"
                  alt="Logo Manuli"
                  className="brand-logo"
                  fallbackTitle="Logo Manuli"
                  objectFit="contain"
                />
                <span className="logo-twinkle">✦</span>
              </span>
              <span className="brand-text">
                <strong>manuli</strong>
                <small>LEARNING SPACE</small>
              </span>
            </a>

            <p className="footer-description">
              Ruang belajar untuk tumbuh, berkarya,
              dan menemukan potensi diri.
            </p>

            <div className="footer-social">
              <span className="footer-social-title">Kenalan lebih dekat</span>
              <a
                href="https://www.instagram.com/suci.indah.s/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram Suci Indah S"
              >
                <span className="social-icon social-instagram">ig</span>
                <span>
                  <small>Instagram</small>
                  <strong>@suci.indah.s</strong>
                </span>
                <span className="social-arrow">↗</span>
              </a>

              <a
                href="https://www.tiktok.com/@suci.indah.sar"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok Suci Indah Sar"
              >
                <span className="social-icon social-tiktok">♪</span>
                <span>
                  <small>TikTok</small>
                  <strong>@suci.indah.sar</strong>
                </span>
                <span className="social-arrow">↗</span>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <a href="#beranda">Beranda</a>
            <a href="#tentang">Tentang</a>
            <a href="#program">Program</a>
            <a href="#galeri">Galeri</a>
            <a href="#kontak">Kontak</a>
          </div>

          <div className="footer-credit">
            <GambarAman
              src="/images/maskot-manuli.png"
              alt=""
              className="footer-mascot"
              fallbackTitle="Maskot Manuli"
              objectFit="contain"
            />
            <div>
              <span className="credit-label">DIRANCANG & DIKEMBANGKAN OLEH</span>
              <strong>Suci Indah Sari</strong>
              <small>Founder & Creator of Manuli Learning Space</small>
            </div>
            <span className="credit-heart">♡</span>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Manuli Learning Space.</span>
            <span>Dibuat dengan cinta untuk perjalanan belajar. ♡</span>
          </div>
        </div>
      </footer>

      {/* MASKOT MELAYANG DI SISI HALAMAN */}
      <div className="page-roaming-mascot" aria-hidden="true">
        <GambarAman
          src="/images/maskot-manuli.png"
          alt=""
          className="page-roaming-image"
          fallbackTitle="Maskot Manuli"
          objectFit="contain"
        />
        <span className="roaming-trail">✦</span>
      </div>

      {/* WHATSAPP MELAYANG */}
      <a
        className="floating-whatsapp"
        href={buatLinkWhatsApp(
          "Halo Kak Suci, saya ingin bertanya tentang les Manuli."
        )}
        target="_blank"
        rel="noreferrer"
        aria-label="Hubungi Manuli melalui WhatsApp"
      >
        <span className="whatsapp-symbol">↗</span>
        <span className="whatsapp-label">Tanya les yuk!</span>
      </a>

      {/* MODAL GALERI */}
      {fotoAktif && (
        <div
          className="gallery-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ${fotoAktif.judul}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFotoAktif(null);
          }}
        >
          <button
            type="button"
            className="gallery-modal-close"
            onClick={() => setFotoAktif(null)}
            aria-label="Tutup galeri"
          >
            ✕
          </button>

          <div className="gallery-modal-content">
            <GambarAman
              src={fotoAktif.foto}
              alt={fotoAktif.judul}
              className="gallery-modal-photo"
              fallbackTitle={fotoAktif.judul}
            />
            <h3>{fotoAktif.judul}</h3>
            <p>{fotoAktif.deskripsi}</p>
          </div>
        </div>
      )}
    </main>
  );
}
