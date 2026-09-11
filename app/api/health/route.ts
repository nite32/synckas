import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: "connected", latencyMs: Date.now() - started });
  } catch (error) {
    console.error("HEALTH_DATABASE_ERROR", error);
    return NextResponse.json({ ok: false, database: "disconnected", latencyMs: Date.now() - started }, { status: 503 });
  }
}
