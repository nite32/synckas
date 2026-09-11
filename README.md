# Kas Kelas

Web app pengelolaan kas kelas berdasarkan workbook `Sistem_Kas_Kelas_41_Anggota.xlsx`.

## Stack

- Next.js + React + TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Zod
- SheetJS
- Recharts
- Lucide

## Jalankan lokal

### 1. Prasyarat

Install Node.js LTS dan Docker Desktop.

### 2. Install dependency

```bash
npm install
```

### 3. Jalankan PostgreSQL

```bash
docker compose up -d
```

### 4. Buat environment

Salin `.env.example` menjadi `.env`.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kas_kelas?schema=public"
```

### 5. Buat tabel

```bash
npx prisma db push
npx prisma generate
```

### 6. Import data workbook awal

File workbook awal tersedia di `data/Sistem_Kas_Kelas_41_Anggota.xlsx`.

```bash
npm run db:seed
```

Seed akan membaca master anggota, kategori, pembayaran, dan pengeluaran dari workbook.

### 7. Jalankan aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Catatan bisnis

- Iuran default Rp5.000 per minggu.
- Bulan akademik September sampai Juni.
- Jumlah minggu mengikuti workbook: September 4, Oktober 5, November 4, Desember 4, Januari 4, Februari 4, Maret 5, April 4, Mei 4, Juni 4.
- Pembayaran dicatat sebagai transaksi individual sehingga cicilan tetap didukung.
- Database adalah source of truth untuk website.
- Excel digunakan untuk import dan export.

## Import Excel

Halaman `/import-export` menerima `.xlsx` maksimal 10 MB dan memeriksa sheet wajib sebelum memasukkan data.

## Production

Sebelum launch:

1. Gunakan PostgreSQL managed/production.
2. Atur secret environment variable di hosting.
3. Hubungkan custom domain.
4. Aktifkan HTTPS.
5. Pastikan favicon aktif.
6. Review Privacy Policy dan Terms & Conditions dengan data kontak yang benar.
7. Hapus seluruh data contoh yang memang tidak ingin dipertahankan.
8. Jalankan pengujian finansial terhadap workbook sumber.
9. Jangan menyatakan production-ready sebelum seluruh checklist tersebut diverifikasi.
