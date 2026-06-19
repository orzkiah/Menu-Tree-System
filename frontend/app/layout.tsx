import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menu Tree System",
  description: "Hierarchical menu management with unlimited nesting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
