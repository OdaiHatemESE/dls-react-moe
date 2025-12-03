import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "MOE Parent Portal",
  description: "Ministry of Education Parent Portal",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
