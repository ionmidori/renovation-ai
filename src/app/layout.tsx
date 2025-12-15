import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { RenovationProvider } from "@/context/RenovationContext";

export const metadata: Metadata = {
  title: "Renovation AI",
  description: "Your AI Interior Design Consultant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <RenovationProvider>
          {children}
        </RenovationProvider>
        <Analytics />
      </body>
    </html>
  );
}
