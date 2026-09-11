import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Kas Kelas",
  description: "Sistem pengelolaan kas kelas",
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><div className="min-h-screen md:flex"><Sidebar /><main className="min-w-0 flex-1">{children}</main></div></body></html>;
}
