import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({
  username: z.string().trim().min(3).max(24),
  password: z.string().min(8).max(128),
});

function timeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DATABASE_TIMEOUT")), ms)
    ),
  ]);
}

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const username = body.username.toLowerCase();

    const user = await timeout(
      prisma.adminUser.findUnique({
        where: { username },
      }),
      7000
    );

    console.log("USERNAME:", username);
    console.log("USER FOUND:", !!user);

    // Cukup cek apakah user ditemukan.
    // Model AdminUser saat ini tidak memiliki field "active".
    if (!user) {
      return NextResponse.json(
        { error: "Username salah." },
        { status: 401 }
      );
    }

    const valid = await timeout(
      verifyPassword(body.password, user.passwordHash),
      7000
    );

    if (!valid) {
      return NextResponse.json(
        { error: "Password salah." },
        { status: 401 }
      );
    }

    await createSession(user.username);

    return NextResponse.json({
      ok: true,
      username: user.username,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Username atau password tidak valid." },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "DATABASE_TIMEOUT"
    ) {
      return NextResponse.json(
        {
          error:
            "Database tidak merespons dalam 7 detik. Periksa DATABASE_URL dan pastikan PostgreSQL aktif.",
        },
        { status: 503 }
      );
    }

    console.error("LOGIN_ERROR", error);

    return NextResponse.json(
      {
        error:
          "Login gagal. Periksa koneksi database lalu coba lagi.",
      },
      { status: 500 }
    );
  }
}