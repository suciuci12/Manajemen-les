
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

const menu = [
  { href: "/admin", icon: "◫", label: "Dashboard" },
  { href: "/admin/peserta", icon: "♙", label: "Data Peserta" },
  { href: "/admin/tutor", icon: "♧", label: "Data Tutor" },
  { href: "/admin/orang-tua", icon: "♡", label: "Data Orang Tua" },
  { href: "/admin/mata-pelajaran", icon: "▤", label: "Mata Pelajaran" },
  { href: "/admin/jadwal", icon: "▦", label: "Jadwal Les" },
  { href: "/admin/presensi", icon: "✓", label: "Presensi" },
];

export default async function AdminLayout({ children }) {
  const user = await getSession();

  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/login");

  return (
    <div className="min-h-screen bg-[#F8F7FC] md:flex">
      <aside className="flex w-full flex-col border-b border-[#EBE8F3] bg-white md:fixed md:inset-y-0 md:left-0 md:w-[250px] md:border-b-0 md:border-r">
        <Link href="/admin" className="flex items-center gap-3 px-6 py-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7957D5] text-lg font-bold text-white">
            M
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight text-[#25233A]">
              Manuli
            </span>
            <span className="block text-xs text-[#9591A6]">
              Learning Management
            </span>
          </span>
        </Link>

        <div className="px-4 pb-2 pt-2">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A09BAD]">
            Menu Utama
          </p>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-4 pb-4 md:flex-1 md:flex-col md:overflow-y-auto">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#77758A] transition hover:bg-[#F5F1FF] hover:text-[#7957D5] md:w-full"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5F1FF] text-base text-[#7957D5]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden border-t border-[#F0EDF5] p-4 md:block">
          <div className="mb-3 rounded-xl bg-[#F8F6FD] p-3">
            <p className="truncate text-sm font-semibold text-[#39364D]">
              {user.nama}
            </p>
            <p className="mt-1 text-xs text-[#9591A6]">Administrator</p>
          </div>
          <LogoutButton />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#F0EDF5] p-4 md:hidden">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#39364D]">
              {user.nama}
            </p>
            <p className="text-xs text-[#9591A6]">Administrator</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0 flex-1 md:ml-[250px]">
        <header className="sticky top-0 z-10 hidden items-center justify-between border-b border-[#EBE8F3] bg-white/90 px-8 py-4 backdrop-blur md:flex">
          <div>
            <p className="text-sm font-semibold text-[#39364D]">
              Panel Administrasi
            </p>
            <p className="mt-0.5 text-xs text-[#9591A6]">
              Kelola kegiatan belajar dengan lebih mudah.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0EAFF] font-semibold text-[#7957D5]">
              {user.nama?.charAt(0)?.toUpperCase() || "A"}
            </span>
            <span className="text-sm font-medium text-[#39364D]">
              {user.nama}
            </span>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}
