import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getSessionEid(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  // Try to get emiratesId from session.user
  if (session?.user && typeof session.user === 'object' && 'emiratesId' in session.user) {
    return (session.user as any).emiratesId || null;
  }
  return null;
}
