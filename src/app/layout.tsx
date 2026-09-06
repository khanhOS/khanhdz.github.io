import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "KhanhOS AI — AI mạnh mẽ, nhanh chóng, dành cho mọi người",
  description: "KhanhOS AI — nền tảng AI chat nhanh chóng, bảo mật, với gói FREE/PLUS/MAX linh hoạt.",
  keywords: ["KhanhOS AI", "AI chat", "Cerebras", "AI tiếng Việt"],
  authors: [{ name: "KhanhOS" }],
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
