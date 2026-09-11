"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Loader2 } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
        cache: "no-store",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || "Login gagal. Coba lagi.");
        return;
      }

      const next = searchParams.get("next");
      const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
      router.replace(destination);
      router.refresh();
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Login terlalu lama. Periksa koneksi database dan DATABASE_URL.");
      } else {
        setError("Tidak dapat terhubung ke server. Pastikan Next.js sedang berjalan.");
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-[#f4f5f2] px-4">
      <form onSubmit={submit} className="w-full max-w-sm border border-line bg-white p-7 shadow-soft">
        <div className="mb-7">
          <div className="mb-4 flex h-10 w-10 items-center justify-center bg-ink text-sm font-bold text-white">KK</div>
          <h1 className="text-2xl font-semibold">Masuk sebagai bendahara</h1>
          <p className="mt-1 text-sm text-slate-500">Gunakan akun bendahara untuk mengelola data kas.</p>
        </div>

        <label className="block text-sm font-medium">
          Username
          <input required minLength={3} maxLength={24} autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} className="mt-1 w-full border border-line px-3 py-2.5 outline-none focus:border-ink" />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Password
          <input required type="password" minLength={8} maxLength={128} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full border border-line px-3 py-2.5 outline-none focus:border-ink" />
        </label>

        {error && (
          <div className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <button type="submit" disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <LockKeyhole size={16} />}
          {loading ? "Memeriksa..." : "Masuk"}
        </button>
      </form>
    </main>
  );
}
