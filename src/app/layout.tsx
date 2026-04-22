import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { MiniTimer } from "@/components/MiniTimer";
import { AppDataProvider } from "@/lib/context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlowForge | High Performance Time Tracking",
  description: "A dark-themed, high-performance time-tracking app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#121212] text-white min-h-screen flex overflow-hidden`}>
        <AppDataProvider>
          <Sidebar />
          <main className="flex-1 h-screen overflow-y-auto bg-[#121212] p-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
          <MiniTimer />
        </AppDataProvider>
      </body>
    </html>
  );
}
