// app/layout.tsx
import type { Metadata } from "next";
import "../styles/main.scss";
import AppShell from "@/components/AppShell";

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
    <html lang="en">
      <body className="app-root">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
