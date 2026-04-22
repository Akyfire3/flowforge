import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { MiniTimer } from "@/components/MiniTimer";
import { AppDataProvider } from "@/lib/context";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "FlowForge | High Performance Time Tracking",
  description: "A dark-themed, high-performance time-tracking app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FlowForge",
  },
  formatDetection: {
    telephone: false,
  },
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
