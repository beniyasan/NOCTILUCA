import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOCTILUCA — ここから、また。",
  description: "宇宙列車で巡る、自分だけの旅。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
