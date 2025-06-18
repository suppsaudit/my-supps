import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MY SUPPS - サプリメント管理アプリ",
  description: "iHerbパワーユーザー向けサプリメント管理PWA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
