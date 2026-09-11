import {NextRequest,NextResponse} from "next/server";
const protectedPaths=["/import-export","/settings","/admin"];
export function middleware(req:NextRequest){const path=req.nextUrl.pathname;if(!protectedPaths.some(p=>path===p||path.startsWith(p+"/")))return NextResponse.next();if(req.cookies.has("kas_session"))return NextResponse.next();const url=req.nextUrl.clone();url.pathname="/login";url.searchParams.set("next",path);return NextResponse.redirect(url)}
export const config={matcher:["/import-export/:path*","/settings/:path*","/admin/:path*"]};
