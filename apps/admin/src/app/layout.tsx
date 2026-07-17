import "./globals.css";

export const metadata = { title: "data-tw · 后台" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}