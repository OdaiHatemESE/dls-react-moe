import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Always dynamic to reflect current auth state
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  // Redact tokens from response for safety
  const sanitized = session
    ? {
        ...session,
        atKey: session.atKey ? "<present>" : undefined,
      }
    : null;

  return NextResponse.json({ session: sanitized }, { status: 200 });
}
