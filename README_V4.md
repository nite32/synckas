# Kas Kelas V4

V4 menambahkan sinkronisasi dua arah terkontrol antara workbook Excel dan database website.

## Alur kerja bendahara

1. Login sebagai bendahara.
2. Buka Excel & Sinkronisasi.
3. Download `kas-kelas-sync.xlsx`.
4. Edit data di Excel. Jangan mengubah kolom `Sync ID`.
5. Simpan file.
6. Upload file yang sama.
7. Klik `Sinkronkan ke Website`.
8. Website memperbarui baris yang sama berdasarkan `Sync ID`.

## Penghapusan

Penghapusan dari Excel tidak langsung dilakukan. Ada opsi eksplisit `Izinkan penghapusan` pada halaman sinkronisasi. Jika aktif, transaksi yang memiliki Sync ID tetapi tidak ada di workbook akan dihapus.

## Penting

Workbook lama yang belum memiliki Sync ID sebaiknya tidak dipakai sebagai workbook utama untuk sinkronisasi berulang. Download workbook sinkronisasi dari website terlebih dahulu.

## Database

Jalankan:

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

## Public vs Bendahara

Dashboard, pembayaran, pengeluaran, anggota, tunggakan, rekap, dan analisis dapat dilihat tanpa login. Endpoint GET bersifat read-only untuk publik. Endpoint POST/PATCH/DELETE dan sinkronisasi Excel tetap membutuhkan sesi bendahara.

## Login troubleshooting V4.1

Login now has a 7 second server-side database timeout and a 10 second browser timeout. If it fails, check `DATABASE_URL` and make sure PostgreSQL is running.

Test database connectivity with:

```bash
npx prisma db push
```

and:

```text
http://localhost:3000/api/health
```

A healthy response contains `"ok":true` and `"database":"connected"`.
