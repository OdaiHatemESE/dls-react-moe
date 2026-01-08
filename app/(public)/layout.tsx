import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MOE Parent Portal",
  description: "Ministry of Education Parent Portal",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
