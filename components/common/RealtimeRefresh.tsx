"use client";
import {useEffect} from "react"; import {getSupabaseBrowser} from "@/lib/supabase";
export function RealtimeRefresh(){useEffect(()=>{let client:any;try{client=getSupabaseBrowser()}catch{return}const channel=client.channel("kas-live").on("postgres_changes",{event:"*",schema:"public",table:"Payment"},()=>window.dispatchEvent(new Event("kas:data-changed"))).on("postgres_changes",{event:"*",schema:"public",table:"Expense"},()=>window.dispatchEvent(new Event("kas:data-changed"))).subscribe();return()=>{client.removeChannel(channel)}},[]);return null}
