import {
  PrismaClient,
  MemberStatus,
  PaymentMethod,
  ExpensePaymentMethod,
} from "@prisma/client";
import * as XLSX from "xlsx";
import path from "node:path";
import { hashPassword } from "../lib/auth";

const prisma = new PrismaClient();

const workbookPath = path.join(
  process.cwd(),
  "data",
  "Sistem_Kas_Kelas_41_Anggota.xlsx"
);

const wb = XLSX.readFile(workbookPath, {
  cellDates: true,
});

const months = [
  "September",
  "Oktober",
  "November",
  "Desember",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
];

/**
 * =========================
 * HELPER
 * =========================
 */

function dateValue(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (!parsed) {
      return null;
    }

    return new Date(
      Date.UTC(
        parsed.y,
        parsed.m - 1,
        parsed.d,
        parsed.H ?? 0,
        parsed.M ?? 0,
        parsed.S ?? 0
      )
    );
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function paymentMethod(value: unknown): PaymentMethod {
  const text = String(value ?? "").trim().toLowerCase();

  if (text.includes("transfer")) {
    return PaymentMethod.TRANSFER;
  }

  if (
    text.includes("tunai") ||
    text.includes("cash")
  ) {
    return PaymentMethod.CASH;
  }

  return PaymentMethod.OTHER;
}

function expenseMethod(value: unknown): ExpensePaymentMethod {
  const text = String(value ?? "").trim().toLowerCase();

  if (text.includes("transfer")) {
    return ExpensePaymentMethod.TRANSFER;
  }

  if (
    text.includes("tunai") ||
    text.includes("cash")
  ) {
    return ExpensePaymentMethod.CASH;
  }

  return ExpensePaymentMethod.OTHER;
}

function numberValue(value: unknown): number {
  if (typeof value === "number") {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const cleaned = value
      .replace(/[^\d,-]/g, "")
      .replace(",", ".");

    const number = Number(cleaned);

    return Number.isFinite(number)
      ? Math.round(number)
      : 0;
  }

  return 0;
}

/**
 * =========================
 * MAIN SEED
 * =========================
 */

async function main() {
  console.log("=================================");
  console.log("MEMULAI DATABASE SEED");
  console.log("=================================");

  /**
   * Pastikan environment tersedia
   */
  const adminUsername = (
    process.env.ADMIN_USERNAME || "bendahara"
  )
    .trim()
    .toLowerCase();

  const adminPassword =
    process.env.ADMIN_PASSWORD || "password123";

  if (!adminUsername) {
    throw new Error(
      "ADMIN_USERNAME tidak boleh kosong."
    );
  }

  if (!adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD tidak boleh kosong."
    );
  }

  /**
   * Hash password SEKALI saja.
   */
  const passwordHash = await hashPassword(
    adminPassword
  );

  /**
   * ==========================================
   * TRANSACTION
   * ==========================================
   *
   * Semua operasi database dilakukan dalam
   * satu transaction.
   *
   * Jika salah satu proses gagal,
   * perubahan database akan di-rollback.
   */
  await prisma.$transaction(
    async (tx) => {
      console.log("");
      console.log("1. Membersihkan data lama...");

      /**
       * Payment harus dihapus terlebih dahulu
       * karena memiliki relation ke Member.
       */
      await tx.payment.deleteMany();

      await tx.expense.deleteMany();

      await tx.member.deleteMany();

      console.log("   Data lama berhasil dibersihkan.");

      /**
       * ==========================================
       * ADMIN USER
       * ==========================================
       */

      console.log("");
      console.log("2. Membuat akun bendahara...");

      /**
       * AdminUser TIDAK mempunyai field active
       * pada schema.prisma.
       *
       * Jadi jangan menggunakan:
       *
       * active: true
       */

      const admin = await tx.adminUser.upsert({
        where: {
          username: adminUsername,
        },

        update: {
          passwordHash,
        },

        create: {
          username: adminUsername,
          passwordHash,
        },
      });

      console.log(
        `   USERNAME: ${admin.username}`
      );

      console.log(
        "   Akun bendahara berhasil dibuat/diperbarui."
      );

      /**
       * ==========================================
       * MEMBER
       * ==========================================
       */

      console.log("");
      console.log("3. Import anggota dari Excel...");

      const memberSheet =
        wb.Sheets["MASTER_ANGGOTA"];

      if (!memberSheet) {
        throw new Error(
          'Sheet "MASTER_ANGGOTA" tidak ditemukan di Excel.'
        );
      }

      const memberRows =
        XLSX.utils.sheet_to_json<unknown[]>(
          memberSheet,
          {
            header: 1,
            defval: null,
          }
        );

      let memberCount = 0;

      /**
       * Berdasarkan struktur Excel sebelumnya:
       *
       * kolom B = Nama
       * kolom C = Kelas
       * kolom D = Status
       *
       * Data dimulai dari row Excel ke-5.
       * Array XLSX dimulai dari index 0,
       * sehingga index 4.
       */

      for (
        let rowIndex = 4;
        rowIndex < memberRows.length;
        rowIndex++
      ) {
        const row = memberRows[rowIndex];

        if (!row) continue;

        const name = String(
          row[1] ?? ""
        ).trim();

        if (!name) {
          continue;
        }

        const classInfo =
          row[2] !== null &&
          row[2] !== undefined &&
          String(row[2]).trim() !== ""
            ? String(row[2]).trim()
            : null;

        const statusText = String(
          row[3] ?? "Aktif"
        )
          .trim()
          .toLowerCase();

        const status =
          statusText.includes("aktif")
            ? MemberStatus.ACTIVE
            : MemberStatus.INACTIVE;

        await tx.member.create({
          data: {
            name,
            classInfo,
            status,
          },
        });

        memberCount++;
      }

      console.log(
        `   ${memberCount} anggota berhasil diimport.`
      );

      /**
       * ==========================================
       * PAYMENT
       * ==========================================
       */

      console.log("");
      console.log("4. Import pembayaran...");

      const paymentSheet =
        wb.Sheets["PEMBAYARAN"];

      if (!paymentSheet) {
        console.log(
          '   Sheet "PEMBAYARAN" tidak ditemukan. Dilewati.'
        );
      } else {
        const paymentRows =
          XLSX.utils.sheet_to_json<
            Record<string, unknown>
          >(paymentSheet, {
            defval: null,
            range: 2,
          });

        /**
         * Buat map nama -> ID
         */
        const members =
          await tx.member.findMany();

        const memberMap = new Map<
          string,
          string
        >();

        for (const member of members) {
          memberMap.set(
            member.name.trim().toLowerCase(),
            member.id
          );
        }

        let paymentCount = 0;

        for (const row of paymentRows) {
          const name = String(
            row["Nama"] ?? ""
          ).trim();

          if (!name) continue;

          const memberId =
            memberMap.get(
              name.toLowerCase()
            );

          if (!memberId) {
            console.warn(
              `   Pembayaran dilewati: anggota "${name}" tidak ditemukan.`
            );

            continue;
          }

          const month = String(
            row["Bulan"] ?? ""
          ).trim();

          if (!months.includes(month)) {
            console.warn(
              `   Pembayaran dilewati: bulan "${month}" tidak valid.`
            );

            continue;
          }

          const amount = numberValue(
            row["Nominal Pembayaran"]
          );

          if (amount <= 0) {
            continue;
          }

          /**
           * Schema:
           * week String
           *
           * Jadi jangan Number(...)
           */
          const weekText = String(
            row["Minggu"] ?? "1"
          ).trim();

          const paymentDate =
            dateValue(row["Tanggal"]);

          const notes =
            row["Keterangan"] !== null &&
            row["Keterangan"] !== undefined &&
            String(row["Keterangan"]).trim() !== ""
              ? String(
                  row["Keterangan"]
                ).trim()
              : null;

          await tx.payment.create({
            data: {
              memberId,
              month,
              week: weekText,
              paymentDate,
              amount,
              method: paymentMethod(
                row["Metode"]
              ),
              notes,
            },
          });

          paymentCount++;
        }

        console.log(
          `   ${paymentCount} pembayaran berhasil diimport.`
        );
      }

      /**
       * ==========================================
       * EXPENSE
       * ==========================================
       */

      console.log("");
      console.log("5. Import pengeluaran...");

      const expenseSheet =
        wb.Sheets["PENGELUARAN"];

      if (!expenseSheet) {
        console.log(
          '   Sheet "PENGELUARAN" tidak ditemukan. Dilewati.'
        );
      } else {
        const expenseRows =
          XLSX.utils.sheet_to_json<
            Record<string, unknown>
          >(expenseSheet, {
            defval: null,
            range: 2,
          });

        let expenseCount = 0;

        for (const row of expenseRows) {
          const date =
            dateValue(row["Tanggal"]);

          const amount = numberValue(
            row["Jumlah"]
          );

          const category = String(
            row["Kategori"] ?? ""
          ).trim();

          const subcategory =
            row["Subkategori"] !== null &&
            row["Subkategori"] !== undefined &&
            String(
              row["Subkategori"]
            ).trim() !== ""
              ? String(
                  row["Subkategori"]
                ).trim()
              : null;

          const description = String(
            row["Deskripsi"] ?? ""
          ).trim();

          if (
            !date ||
            amount <= 0 ||
            !category ||
            !description
          ) {
            continue;
          }

          const recipient =
            row["Penerima"] !== null &&
            row["Penerima"] !== undefined &&
            String(row["Penerima"]).trim() !== ""
              ? String(
                  row["Penerima"]
                ).trim()
              : null;

          const receiptUrl =
            row["Bukti"] !== null &&
            row["Bukti"] !== undefined &&
            String(row["Bukti"]).trim() !== ""
              ? String(
                  row["Bukti"]
                ).trim()
              : null;

          const reference =
            row["No/Ref Bukti"] !== null &&
            row["No/Ref Bukti"] !== undefined &&
            String(
              row["No/Ref Bukti"]
            ).trim() !== ""
              ? String(
                  row["No/Ref Bukti"]
                ).trim()
              : null;

          const approvedBy =
            row["Disetujui Oleh"] !== null &&
            row["Disetujui Oleh"] !== undefined &&
            String(
              row["Disetujui Oleh"]
            ).trim() !== ""
              ? String(
                  row["Disetujui Oleh"]
                ).trim()
              : null;

          const notes =
            row["Keterangan"] !== null &&
            row["Keterangan"] !== undefined &&
            String(
              row["Keterangan"]
            ).trim() !== ""
              ? String(
                  row["Keterangan"]
                ).trim()
              : null;

          /**
           * Schema Expense memiliki:
           *
           * approved Boolean
           *
           * tetapi Excel memiliki:
           *
           * Disetujui Oleh
           *
           * Jadi kita anggap approved = true
           * jika ada nama orang yang menyetujui.
           */
          const approved =
            Boolean(approvedBy);

          await tx.expense.create({
            data: {
              date,
              category,
              subcategory,
              description,
              recipient,
              amount,
              method: expenseMethod(
                row["Metode Pembayaran"]
              ),
              receiptUrl,
              reference,
              approved,
              notes,
            },
          });

          expenseCount++;
        }

        console.log(
          `   ${expenseCount} pengeluaran berhasil diimport.`
        );
      }

      /**
       * ==========================================
       * SELESAI
       * ==========================================
       */

      console.log("");
      console.log(
        "6. Verifikasi data dalam transaction..."
      );

      const totalMembers =
        await tx.member.count();

      const totalPayments =
        await tx.payment.count();

      const totalExpenses =
        await tx.expense.count();

      const totalAdmins =
        await tx.adminUser.count();

      console.log(
        `   Admin:       ${totalAdmins}`
      );

      console.log(
        `   Anggota:     ${totalMembers}`
      );

      console.log(
        `   Pembayaran:  ${totalPayments}`
      );

      console.log(
        `   Pengeluaran: ${totalExpenses}`
      );

      if (totalAdmins === 0) {
        throw new Error(
          "SEED GAGAL: AdminUser tidak berhasil dibuat."
        );
      }

      if (totalMembers === 0) {
        throw new Error(
          "SEED GAGAL: Tidak ada anggota yang berhasil diimport."
        );
      }

      console.log("");
      console.log(
        "Semua data berhasil diverifikasi."
      );
    },
    {
      maxWait: 10000,
      timeout: 60000,
    }
  );

  console.log("");
  console.log("=================================");
  console.log("SEED BERHASIL");
  console.log("=================================");
  console.log("");
  console.log(
    `Username : ${adminUsername}`
  );
  console.log(
    "Password : menggunakan ADMIN_PASSWORD dari .env"
  );
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("=================================");
    console.error("SEED GAGAL");
    console.error("=================================");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });