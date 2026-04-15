import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Absensi Magang Biometrik",
  description: "Absensi dengan Face Recognition dan Geofencing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Tambahkan suppressHydrationWarning di tag html
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
        // Tambahkan suppressHydrationWarning di tag body juga untuk meredam 
        // error akibat suntikan atribut dari ekstensi browser (seperti DemoWay).
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}