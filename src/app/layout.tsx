import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VORTEX // Serverless AI Inference & GPU Fleet Control Plane",
  description: "Sub-millisecond global model routing, dedicated H100/B200 tensor clusters, and zero-cold-start AI endpoints.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-[#050505] text-zinc-100 antialiased selection:bg-white selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
