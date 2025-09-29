"use client";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthButtons() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return null;

  if (session?.user) {
    return (
      <button
        onClick={() => signOut()}
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
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }}
      className="lg:h-12 xl:h-14 lg:px-2 xl:px-3 flex items-center justify-center flex-shrink-0"
    >
      <span className="sr-only">Login</span>
      <span>Login</span>
    </button>
  );
}
