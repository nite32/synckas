"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, WalletCards, ReceiptText, Users, CalendarDays, AlertTriangle, ChartNoAxesCombined, FileSpreadsheet, ShieldCheck, FileText } from "lucide-react";
import { AuthAction } from "@/components/auth/AuthAction";

const groups = [
  { title: "Utama", items: [{href:"/dashboard",label:"Dashboard",icon:LayoutDashboard}] },
  { title: "Keuangan", items: [{href:"/pembayaran",label:"Pembayaran",icon:WalletCards},{href:"/pengeluaran",label:"Pengeluaran",icon:ReceiptText}] },
  { title: "Anggota", items: [{href:"/anggota",label:"Daftar Anggota",icon:Users},{href:"/tunggakan",label:"Tunggakan",icon:AlertTriangle}] },
  { title: "Laporan", items: [{href:"/rekap",label:"Rekap Bulanan",icon:CalendarDays},{href:"/analisis",label:"Analisis",icon:ChartNoAxesCombined}] },
  { title: "Data", items: [{href:"/import-export",label:"Excel & Sinkronisasi",icon:FileSpreadsheet}] },
  { title: "Legal", items: [{href:"/privacy",label:"Privacy Policy",icon:ShieldCheck},{href:"/terms",label:"Terms & Conditions",icon:FileText}] }
];

export function Sidebar() {
  const path = usePathname();
  return <aside className="w-full border-b border-line bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
    <div className="sticky top-0 p-4 md:p-5">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">KK</div>
        <div><div className="font-semibold">Kas Kelas</div><div className="text-xs text-slate-500">2026/2027</div></div>
      </div>
      <nav className="grid grid-cols-2 gap-4 md:block">
        {groups.map(group => <div key={group.title} className="mb-5">
          <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.title}</div>
          <div className="space-y-1">{group.items.map(item => { const Icon=item.icon; const active=path===item.href || path.startsWith(item.href+"/"); return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${active?"bg-slate-100 font-semibold text-ink":"text-slate-600 hover:bg-slate-50 hover:text-ink"}`}><Icon size={17} strokeWidth={1.8}/>{item.label}</Link>})}</div>
        </div>)}
      </nav><div className="mt-6 border-t border-line pt-4"><AuthAction /></div>
    </div>
  </aside>;
}
