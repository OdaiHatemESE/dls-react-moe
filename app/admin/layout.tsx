import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Configuration - Parent Portal",
  description: "Admin panel for managing system configuration",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* No sidebar, no header, no footer - clean admin layout */}
      {children}
    </div>
  );
}
