import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "卓宝数据中台 · 抖音作战大屏",
  description: "抖音账号多维数据 · 16:9 TV displays",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}