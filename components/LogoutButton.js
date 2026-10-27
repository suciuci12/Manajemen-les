"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#EBE8F3] px-4 py-2.5 text-sm font-medium text-[#77758A] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <span aria-hidden="true">↪</span>
      {loading ? "Keluar..." : "Keluar"}
    </button>
  );
}
