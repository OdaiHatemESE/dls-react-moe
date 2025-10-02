"use client";
import { useSession, signIn } from "next-auth/react";

export default function DebugIdentityProfile() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="p-6">Loading…</div>;
  if (status === "unauthenticated")
    return (
      <div className="p-6">
        <p className="mb-4">You are not signed in.</p>
        <button className="px-3 py-2 border rounded" onClick={() => signIn("oidc", { callbackUrl: "/debug/profile" })}>
          Sign in
        </button>
      </div>
    );

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Debug: Identity Profile</h1>
      <div>
        <h2 className="font-medium mb-1">Session user</h2>
        <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs">{JSON.stringify(session?.user, null, 2)}</pre>
      </div>
      <div>
        <h2 className="font-medium mb-1">identityProfile</h2>
        <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs">{JSON.stringify(session?.identityProfile as Record<string, unknown> | undefined, null, 2)}</pre>
      </div>
    </div>
  );
}
