import type { Metadata } from "next";
import { Nunito, Poppins } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Our Little World — Ruang Digital Pribadi Untuk Berdua",
  description:
    "Platform pasangan privat untuk menyimpan kenangan, surat cinta, kalender spesial, chat realtime, taman cinta, kuis pasangan, dan AI Love Assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${poppins.variable} ${nunito.variable}`}>
      <body className="romantic-bg text-brand-dark antialiased selection:bg-brand-pink/50">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
