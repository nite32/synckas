import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET(){
  try{
    await requireSession();
    const [members,payments,expenses]=await Promise.all([
      prisma.member.findMany({orderBy:{name:'asc'}}),
      prisma.payment.findMany({include:{member:true},orderBy:{paymentDate:'asc'}}),
      prisma.expense.findMany({orderBy:{date:'asc'}})
    ]);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(members.map((m,i)=>({No:i+1,'Sync ID':m.syncKey,Nama:m.name,'Kelas/Keterangan':m.classInfo??'',Status:m.status==='ACTIVE'?'Aktif':'Tidak Aktif'}))), 'MASTER_ANGGOTA');
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(payments.map(p=>({'Sync ID':p.syncKey,Nama:p.member.name,Bulan:p.month,Minggu:`Minggu ${p.week}`,Tanggal:p.paymentDate,'Nominal Pembayaran':Number(p.amount),Metode:p.method==='CASH'?'Tunai':p.method==='TRANSFER'?'Transfer':'Lainnya',Keterangan:p.notes??''}))), 'PEMBAYARAN');
    XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(expenses.map((e,i)=>({No:i+1,'Sync ID':e.syncKey,Tanggal:e.date,Kategori:e.category,Subkategori:e.subcategory??'',Deskripsi:e.description,Penerima:e.recipient??'',Jumlah:Number(e.amount),'Metode Pembayaran':e.method==='CASH'?'Tunai':e.method==='TRANSFER'?'Transfer':'Lainnya',Bukti:e.receiptUrl??'','No/Ref Bukti':e.reference??'',Disetujui:e.approved?'Ya':'Tidak',Keterangan:e.notes??''}))), 'PENGELUARAN');
    const out=XLSX.write(wb,{type:'buffer',bookType:'xlsx'});
    return new Response(out,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="kas-kelas-sync.xlsx"'}});
  }catch(err){
    console.error('sync-template error:', err);
    const message = err instanceof Error ? err.message : String(err);
    const isAuthError = message.toLowerCase().includes('unauthor') || message.toLowerCase().includes('session') || message.toLowerCase().includes('login');
    return NextResponse.json(
      { error: 'Tidak dapat membuat workbook sinkronisasi.', detail: message },
      { status: isAuthError ? 401 : 500 }
    );
  }
}