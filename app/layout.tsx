import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Elements – Interactive Periodic Table",
  description:
    "Explore all 118 elements in a 3D periodic table. Discover electron shells, choose a theme, and test your knowledge.",
};
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
