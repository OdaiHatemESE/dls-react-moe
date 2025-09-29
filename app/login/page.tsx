"use client";
import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function LoginPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const startedRef = useRef(false);
  const callbackUrl = params.get("callbackUrl") ?? "/";

  // Auto-start the Auth0 sign-in when visiting /login.
  useEffect(() => {
    // If already authenticated, go to the intended page directly
    if (status === "authenticated") {
      router.replace(callbackUrl);
      return;
    }
    // Avoid multiple triggers; wait until session status is resolved
    if (!startedRef.current && status !== "loading") {
      startedRef.current = true;
      // Initiate the Auth0 flow; NextAuth will handle the redirect
  void signIn("oidc", { callbackUrl });
    }
  }, [status, callbackUrl, router]);

  return (
    <>
      {/* Fallback content (covered by overlay) */}
      <main className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <h1 className="text-2xl font-semibold">Redirecting…</h1>
          <p className="text-gray-600">Taking you to the MOE sign-in page.</p>
          <div>
            <button
              onClick={() => signIn("oidc", { callbackUrl })}
              className="inline-flex items-center px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Click here if you are not redirected
            </button>
          </div>
        </div>
      </main>

      {/* Full-screen overlay above everything (including header) */}
      <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
        <div
          role="alert"
          aria-live="polite"
          className="w-full max-w-md rounded-lg bg-white dark:bg-neutral-900 shadow-xl p-6 text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="inline-block h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" aria-hidden="true" />
            <h1 className="text-xl font-semibold">Redirecting to MOE sign-in…</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Please wait while we securely connect you to the identity provider.
          </p>
          <div>
            <button
              onClick={() => signIn("oidc", { callbackUrl })}
              className="inline-flex items-center px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Click here if you are not redirected
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
