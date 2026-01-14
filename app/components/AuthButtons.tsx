"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session?.user) {
    return (
      <button
        onClick={async () => {
          await signOut({ callbackUrl: '/login' });
          const logoutUrl = process.env.NEXT_PUBLIC_OIDC_LOGOUT_URL || 'https://stg-login.moe.gov.ae/connect/endsession';
          if (typeof window !== 'undefined') {
            window.location.href = logoutUrl;
          }
        }}
        className="lg:h-12 xl:h-14 lg:px-2 xl:px-3 flex items-center justify-center flex-shrink-0"
      >
        <span className="sr-only">Sign out</span>
        <span>Sign out</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        const callbackUrl = typeof window !== "undefined" ? window.location.href : "/";
        // Redirect directly to OIDC issuer via NextAuth
        signIn("oidc", { callbackUrl });
      }}
      className="lg:h-12 xl:h-14 lg:px-2 xl:px-3 flex items-center justify-center flex-shrink-0"
    >
      <span className="sr-only">Login</span>
      <span>Login</span>
    </button>
  );
}
