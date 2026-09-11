import {useEffect,useState} from "react";
import {Pencil,Trash2,Upload,X,ExternalLink} from "lucide-react";
import {formatDate,formatRupiah} from "@/lib/utils";

const blank={date:new Date().toISOString().slice(0,10),category:'',subcategory:'',description:'',recipient:'',amount:'',method:'CASH',reference:'',approved:false,notes:''};

export function ExpenseManager(){
  const [isAdmin,setIsAdmin]=useState(false),
        [rows,setRows]=useState<any[]>([]),
        [form,setForm]=useState<any>(blank),
        [editing,setEditing]=useState<string|null>(null),
        [msg,setMsg]=useState(''),
        [file,setFile]=useState<File|null>(null);

  async function load(){
    const r=await fetch('/api/expenses');
    setRows(await r.json());
  }
  useEffect(()=>{load();fetch('/api/auth/me').then(r=>r.json()).then(d=>setIsAdmin(!!d.authenticated))},[]);

  function edit(r:any){
    setEditing(r.id);
    setForm({
      date:new Date(r.date).toISOString().slice(0,10),
      category:r.category,
      subcategory:r.subcategory||'',
      description:r.description,
      recipient:r.recipient||'',
      amount:String(r.amount),
      method:r.method,
      reference:r.reference||'',
      approved:!!r.approved,
      notes:r.notes||''
    });
    setFile(null);
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function reset(){setEditing(null);setForm(blank);setFile(null)}

  async function openReceipt(id:string){
    const r=await fetch(`/api/expenses/${id}/receipt`);
    const d=await r.json();
    if(r.ok&&d.url)window.open(d.url,'_blank','noopener,noreferrer');
    else setMsg(d.error||'Bukti tidak tersedia.');
  }

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setMsg('');
    const url=editing?`/api/expenses/${editing}`:'/api/expenses';
    const r=await fetch(url,{
      method:editing?'PATCH':'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...form,amount:Number(form.amount)})
    });
    const d=await r.json();
    if(!r.ok){setMsg(d.error||'Gagal menyimpan.');return}
    const id=editing?editing:d.id;
    if(file){
      const fd=new FormData();
      fd.append('file',file);
      const ur=await fetch(`/api/expenses/${id}/receipt`,{method:'POST',body:fd});
      const ud=await ur.json();
      if(!ur.ok){setMsg(ud.error||'Data tersimpan, tetapi upload bukti gagal.');load();return}
    }
    setMsg(editing?'Pengeluaran diperbarui.':'Pengeluaran tersimpan.');
    reset();load();
  }

  async function del(id:string){
    if(!confirm('Hapus pengeluaran ini?'))return;
    const r=await fetch(`/api/expenses/${id}`,{method:'DELETE'});
    if(r.ok)load();else setMsg('Pengeluaran tidak dapat dihapus.');
  }

  return <div className="p-6 lg:p-8"><div className="mx-auto max-w-7xl">
    <header className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-500">Keuangan</p>
      <h1 className="mt-2 text-2xl font-semibold">Pengeluaran</h1>
      <p className="mt-1 text-sm text-slate-500">Catat penggunaan kas dan simpan bukti transaksi.</p>
    </header>
    <div className="grid gap-6 xl:grid-cols-[410px_1fr]">
      {isAdmin&&(<form onSubmit={submit} className="border border-line bg-white p-5 shadow-soft">
        <div className="flex justify-between">
          <h2 className="font-semibold">{editing?'Edit pengeluaran':'Tambah pengeluaran'}</h2>
          {editing&&<button type="button" onClick={reset}><X size={17}/></button>}
        </div>
        <div className="mt-5 space-y-3">
          <Field label="Tanggal"><input required type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="field"/></Field>
          <Field label="Kategori"><input required value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="field"/></Field>
          <Field label="Subkategori"><input value={form.subcategory} onChange={e=>setForm({...form,subcategory:e.target.value})} className="field"/></Field>
          <Field label="Deskripsi"><input required value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="field"/></Field>
          <Field label="Penerima"><input value={form.recipient} onChange={e=>setForm({...form,recipient:e.target.value})} className="field"/></Field>
          <Field label="Jumlah"><input required min="1" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="field"/></Field>
          <Field label="Metode"><select value={form.method} onChange={e=>setForm({...form,method:e.target.value})} className="field"><option value="CASH">Tunai</option><option value="TRANSFER">Transfer</option><option value="OTHER">Lainnya</option></select></Field>
          <label className="block text-sm font-medium">Bukti transaksi
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)} className="mt-1 block w-full text-sm"/>
            <span className="mt-1 block text-xs font-normal text-slate-500">Maksimal 5 MB. JPG, PNG, WEBP, PDF.</span>
          </label>
          <Field label="No/Ref Bukti"><input value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} className="field"/></Field>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.approved} onChange={e=>setForm({...form,approved:e.target.checked})}/>
            Disetujui
          </label>
          <Field label="Keterangan"><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="field min-h-20"/></Field>
          <button className="w-full bg-ink px-4 py-2.5 text-sm font-semibold text-white">{editing?'Simpan perubahan':'Simpan pengeluaran'}</button>
          {msg&&<p className="text-sm text-slate-600">{msg}</p>}
        </div>
      </form>)}
      <section className="overflow-hidden border border-line bg-white shadow-soft">
        <div className="border-b border-line p-5"><h2 className="font-semibold">Riwayat pengeluaran</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
              <th className="px-5 py-3">Tanggal</th>
              <th className="px-5 py-3">Kategori</th>
              <th className="px-5 py-3">Deskripsi</th>
              <th className="px-5 py-3 text-right">Jumlah</th>
              <th className="px-5 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map(r=><tr key={r.id}>
                <td className="px-5 py-3">{formatDate(r.date)}</td>
                <td className="px-5 py-3">{r.category}{r.subcategory?` / ${r.subcategory}`:''}</td>
                <td className="px-5 py-3">{r.description}</td>
                <td className="px-5 py-3 text-right font-semibold">{formatRupiah(r.amount)}</td>
                <td className="px-5 py-3"><div className="flex justify-end gap-1">
                  {r.receiptUrl&&<button type="button" onClick={()=>openReceipt(r.id)} className="icon-btn" title="Buka bukti"><ExternalLink size={16}/></button>}
                  {isAdmin&&<><button onClick={()=>edit(r)} className="icon-btn"><Pencil size={16}/></button><button onClick={()=>del(r.id)} className="icon-btn text-red-700"><Trash2 size={16}/></button></>}
                </div></td>
              </tr>)}
              {!rows.length&&<tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">Belum ada pengeluaran.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div></div>;
}

function Field({label,children}:{label:string,children:React.ReactNode}){return <label className="block text-sm font-medium">{label}{children}</label>}
