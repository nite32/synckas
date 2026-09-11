import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(){return NextResponse.json(await prisma.expenseCategory.findMany({include:{subcategories:true},orderBy:{name:"asc"}}));}
