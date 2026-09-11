"use client";
import Link from "next/link";
import {LogIn,LogOut} from "lucide-react";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
export function AuthAction(){const [auth,setAuth]=useState(false);const router=useRouter();useEffect(()=>{fetch('/api/auth/me').then(r=>r.json()).then(d=>setAuth(!!d.authenticated))},[]);if(!auth)return <Link href="/login" className="flex w-full items-center gap-2 border border-line px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><LogIn size={16}/>Masuk Bendahara</Link>;return <button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});setAuth(false);router.refresh()}} className="flex w-full items-center gap-2 border border-line px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><LogOut size={16}/>Keluar Bendahara</button>}
