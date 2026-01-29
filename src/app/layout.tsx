import type { Metadata } from "next";
import { AccessGate, Navigation } from "@/components";
import "./globals.css";

export const metadata: Metadata = {
  title: "Four Factors | NCAA Basketball Analytics",
  description: "Analyze college basketball games through Dean Oliver's Four Factors: eFG%, TOV%, ORB%, and FTR",
  keywords: ["NCAA", "basketball", "analytics", "four factors", "college basketball", "statistics"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AccessGate>
          <Navigation />
          <main className="gradient-mesh min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          <footer className="border-t border-[var(--border)] py-6 text-center text-sm text-[var(--foreground-muted)]">
            <p>Data from ESPN. Four Factors methodology by Dean Oliver.</p>
          </footer>
        </AccessGate>
      </body>
    </html>
  );
}
