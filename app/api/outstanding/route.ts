import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MONTHS } from "@/lib/constants";
import { monthSummary, requiredForMonth, paymentStatus } from "@/lib/calculations";
export async function GET(req:Request){const u=new URL(req.url);const month=u.searchParams.get("month")||MONTHS[0];const [members,payments]=await Promise.all([prisma.member.findMany({where:{status:"ACTIVE"},orderBy:{name:"asc"}}),prisma.payment.findMany({where:{month}})]);const required=requiredForMonth(month);return NextResponse.json(members.map(m=>{const paid=payments.filter(p=>p.memberId===m.id).reduce((s,p)=>s+Number(p.amount),0);return {member:m,month,required,paid,shortfall:Math.max(required-paid,0),status:paymentStatus(required,paid)}}))}
