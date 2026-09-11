import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

function parseDate(v: unknown) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    return new Date(Date.UTC(d.y, d.m - 1, d.d));
  }
  const d = new Date(String(v ?? ""));
  if (Number.isNaN(d.getTime())) throw new Error("Tanggal tidak valid");
  return d;
}
function method(v: unknown): "CASH" | "TRANSFER" | "OTHER" {
  const s = String(v ?? "").toLowerCase();
  if (s.includes("transfer")) return "TRANSFER";
  if (s.includes("tunai") || s.includes("cash")) return "CASH";
  return "OTHER";
}
function rows(ws: XLSX.WorkSheet) {
  return XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null }) as unknown[][];
}
function colIndex(header: unknown[], names: string[]) {
  const normalized = header.map(v => String(v ?? "").trim().toLowerCase());
  return names.map(n => normalized.indexOf(n.toLowerCase())).find(i => i >= 0) ?? -1;
}
function val(row: unknown[], i: number) { return i >= 0 ? row[i] : null; }

export async function POST(req: Request) {
  try {
    await requireSession();
    const form = await req.formData();
    const file = form.get("file");
    const allowDelete = form.get("allowDelete") === "true";
    if (!(file instanceof File)) return NextResponse.json({ error: "File Excel tidak ditemukan." }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".xlsx")) return NextResponse.json({ error: "Gunakan file .xlsx." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Ukuran file maksimal 10 MB." }, { status: 400 });

    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
    for (const required of ["MASTER_ANGGOTA", "PEMBAYARAN", "PENGELUARAN"]) {
      if (!wb.SheetNames.includes(required)) return NextResponse.json({ error: `Sheet ${required} wajib ada.` }, { status: 400 });
    }

    let membersUpdated = 0, membersCreated = 0, paymentsUpdated = 0, paymentsCreated = 0, expensesUpdated = 0, expensesCreated = 0, deleted = 0;
    const warnings: string[] = [];

    await prisma.$transaction(async tx => {
      const memberSheet = rows(wb.Sheets.MASTER_ANGGOTA);
      const memberHeader = memberSheet[3] ?? [];
      const miSync = colIndex(memberHeader, ["Sync ID"]);
      const miName = colIndex(memberHeader, ["Nama"]);
      const miClass = colIndex(memberHeader, ["Kelas/Keterangan"]);
      const miStatus = colIndex(memberHeader, ["Status Keanggotaan", "Status"]);
      const memberKeys = new Set<string>();
      for (let i = 4; i < memberSheet.length; i++) {
        const r = memberSheet[i] ?? [];
        const name = String(val(r, miName) ?? "").trim();
        if (!name) continue;
        const syncKey = String(val(r, miSync) ?? "").trim();
        const status = String(val(r, miStatus) ?? "Aktif").toLowerCase().includes("aktif") ? "ACTIVE" : "INACTIVE";
        let member = syncKey ? await tx.member.findUnique({ where: { syncKey } }) : null;
        if (!member) member = await tx.member.findUnique({ where: { name } });
        if (member) {
          await tx.member.update({ where: { id: member.id }, data: { name, classInfo: val(r, miClass) ? String(val(r, miClass)) : null, status } });
          membersUpdated++;
          memberKeys.add(member.syncKey);
        } else {
          const created = await tx.member.create({ data: { name, classInfo: val(r, miClass) ? String(val(r, miClass)) : null, status } });
          membersCreated++;
          memberKeys.add(created.syncKey);
        }
      }

      const memberMap = new Map((await tx.member.findMany()).map(m => [m.name.trim().toLowerCase(), m.id]));
      const paymentSheet = rows(wb.Sheets.PEMBAYARAN);
      const ph = paymentSheet[2] ?? [];
      const piSync = colIndex(ph, ["Sync ID"]);
      const piName = colIndex(ph, ["Nama"]);
      const piMonth = colIndex(ph, ["Bulan"]);
      const piWeek = colIndex(ph, ["Minggu"]);
      const piDate = colIndex(ph, ["Tanggal"]);
      const piAmount = colIndex(ph, ["Nominal Pembayaran"]);
      const piMethod = colIndex(ph, ["Metode"]);
      const piNote = colIndex(ph, ["Keterangan"]);
      const seenPaymentKeys = new Set<string>();
      for (let i = 3; i < paymentSheet.length; i++) {
        const r = paymentSheet[i] ?? [];
        const name = String(val(r, piName) ?? "").trim();
        if (!name) continue;
        const memberId = memberMap.get(name.toLowerCase());
        if (!memberId) { warnings.push(`Pembayaran baris ${i + 1}: anggota "${name}" tidak ditemukan.`); continue; }
        const amount = Number(val(r, piAmount) ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) { warnings.push(`Pembayaran baris ${i + 1}: nominal tidak valid.`); continue; }
        const wm = String(val(r, piWeek) ?? "").match(/(\d+)/);
        const data = { memberId, month: String(val(r, piMonth) ?? "").trim(), week: Number(wm?.[1] ?? 1), date: parseDate(val(r, piDate)), amount, method: method(val(r, piMethod)), note: val(r, piNote) ? String(val(r, piNote)) : null } as const;
        const syncKey = String(val(r, piSync) ?? "").trim();
        let existing = syncKey ? await tx.payment.findUnique({ where: { syncKey } }) : null;
        if (existing) { await tx.payment.update({ where: { id: existing.id }, data }); paymentsUpdated++; seenPaymentKeys.add(existing.syncKey); }
        else { const created = await tx.payment.create({ data }); paymentsCreated++; seenPaymentKeys.add(created.syncKey); }
      }

      const cats = await tx.expenseCategory.findMany({ include: { subcategories: true } });
      const subMap = new Map<string, string>();
      cats.forEach(c => c.subcategories.forEach(s => subMap.set(s.name.trim().toLowerCase(), s.id)));
      const expenseSheet = rows(wb.Sheets.PENGELUARAN);
      const eh = expenseSheet[2] ?? [];
      const eiSync = colIndex(eh, ["Sync ID"]);
      const eiDate = colIndex(eh, ["Tanggal"]);
      const eiSub = colIndex(eh, ["Subkategori"]);
      const eiDesc = colIndex(eh, ["Deskripsi"]);
      const eiRecipient = colIndex(eh, ["Penerima"]);
      const eiAmount = colIndex(eh, ["Jumlah"]);
      const eiMethod = colIndex(eh, ["Metode Pembayaran"]);
      const eiReceipt = colIndex(eh, ["Bukti"]);
      const eiRef = colIndex(eh, ["No/Ref Bukti"]);
      const eiApproved = colIndex(eh, ["Disetujui Oleh"]);
      const eiNote = colIndex(eh, ["Keterangan"]);
      const seenExpenseKeys = new Set<string>();
      for (let i = 3; i < expenseSheet.length; i++) {
        const r = expenseSheet[i] ?? [];
        const desc = String(val(r, eiDesc) ?? "").trim();
        if (!desc && !val(r, eiDate)) continue;
        const subId = subMap.get(String(val(r, eiSub) ?? "").trim().toLowerCase());
        if (!subId) { warnings.push(`Pengeluaran baris ${i + 1}: subkategori tidak ditemukan.`); continue; }
        const amount = Number(val(r, eiAmount) ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) { warnings.push(`Pengeluaran baris ${i + 1}: jumlah tidak valid.`); continue; }
        const data = { date: parseDate(val(r, eiDate)), subcategoryId: subId, description: desc, recipient: val(r, eiRecipient) ? String(val(r, eiRecipient)) : null, amount, method: method(val(r, eiMethod)), receipt: val(r, eiReceipt) ? String(val(r, eiReceipt)) : null, receiptRef: val(r, eiRef) ? String(val(r, eiRef)) : null, approvedBy: val(r, eiApproved) ? String(val(r, eiApproved)) : null, note: val(r, eiNote) ? String(val(r, eiNote)) : null } as const;
        const syncKey = String(val(r, eiSync) ?? "").trim();
        let existing = syncKey ? await tx.expense.findUnique({ where: { syncKey } }) : null;
        if (existing) { await tx.expense.update({ where: { id: existing.id }, data }); expensesUpdated++; seenExpenseKeys.add(existing.syncKey); }
        else { const created = await tx.expense.create({ data }); expensesCreated++; seenExpenseKeys.add(created.syncKey); }
      }

      if (allowDelete) {
        if (piSync >= 0) { const all = await tx.payment.findMany({ select: { id: true, syncKey: true } }); for (const p of all) if (!seenPaymentKeys.has(p.syncKey)) { await tx.payment.delete({ where: { id: p.id } }); deleted++; } }
        if (eiSync >= 0) { const all = await tx.expense.findMany({ select: { id: true, syncKey: true } }); for (const e of all) if (!seenExpenseKeys.has(e.syncKey)) { await tx.expense.delete({ where: { id: e.id } }); deleted++; } }
      }
    });

    return NextResponse.json({ message: "Sinkronisasi selesai", membersUpdated, membersCreated, paymentsUpdated, paymentsCreated, expensesUpdated, expensesCreated, deleted, warnings });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Sinkronisasi gagal." }, { status: 400 });
  }
}
