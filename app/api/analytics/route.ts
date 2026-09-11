import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MONTHS } from "@/lib/constants";
import { monthSummary } from "@/lib/calculations";
export async function GET(){const [members,payments,expenses]=await Promise.all([prisma.member.findMany({where:{status:"ACTIVE"}}),prisma.payment.findMany(),prisma.expense.findMany({include:{subcategory:{include:{category:true}}})]);const monthly=MONTHS.map(month=>{const s=monthSummary(month,members,payments);const ex=expenses.filter(e=>new Intl.DateTimeFormat("id-ID",{month:"long"}).format(e.date).toLowerCase()===month.toLowerCase()).reduce((a,e)=>a+Number(e.amount),0);return {...s,totalExpense:ex};});return NextResponse.json({monthly});}
