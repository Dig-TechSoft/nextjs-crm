// app/layout.tsx
import type { Metadata } from "next";
import "../styles/main.scss";

export const metadata: Metadata = {
  title: "MT5 CRM",
  description: "MT5 CRM Backend System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="app-root">{children}</body>
    </html>
  );
}
