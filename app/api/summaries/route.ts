import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MONTHS } from "@/lib/constants";
import { monthSummary } from "@/lib/calculations";
export async function GET(){const [members,payments,expenses]=await Promise.all([prisma.member.findMany({where:{status:"ACTIVE"}}),prisma.payment.findMany(),prisma.expense.findMany()]);let opening=Number((await prisma.setting.findUnique({where:{key:"openingBalance"}}))?.value??0);let running=opening;const result=MONTHS.map(month=>{const s=monthSummary(month,members,payments);const exp=expenses.filter(e=>new Intl.DateTimeFormat("id-ID",{month:"long"}).format(e.date).toLowerCase()===month.toLowerCase()).reduce((a,e)=>a+Number(e.amount),0);running+=s.totalPaid-exp;return {...s,totalExpense:exp,balance:running,paymentRate:s.totalRequired?s.totalPaid/s.totalRequired:0};});return NextResponse.json(result)}
