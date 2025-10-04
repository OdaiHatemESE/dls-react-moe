"use client";

import React, { useEffect, useRef, useState } from 'react';
import { IconContext } from '@phosphor-icons/react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Props = {
  children: React.ReactNode;
};

export default function IconProvider({ children }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);
  const attemptedRef = useRef(false); // ⬅️ prevent multiple signIns per mount

  useEffect(() => {
    const url = window.location.href;

    if (status === 'loading') return;

    // 2) If not signed in yet, try mobile-token ONCE, else fall back to OIDC
    if (status === 'unauthenticated' && !attemptedRef.current) {
      attemptedRef.current = true;

      const mobileToken =
        typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const tryMobileToken = async () => {
        if (mobileToken) {
          // Use redirect:false to avoid mid-render navigations from inside the provider
          const res = await signIn('mobile-token', {
            accessToken: mobileToken,
            redirect: false,
          });

          if (res?.ok) {
            // Session cookie should now be set; navigate to /parent
            router.replace(url);
            return;
          }
          // If mobile-token failed, fall back to OIDC
        }


        // Fallback: interactive OIDC login (this will navigate)
        // Fallback: interactive OIDC login (this will navigate)
        await signIn('oidc', { callbackUrl: url });
      };

      void tryMobileToken();
      return; // important: don't continue in this effect
    }

    // 3) If authenticated, decode once and init your store
    if (status === 'authenticated' && session?.accessToken && !initialized) {
      try {
        setInitialized(true);
      } catch (error) {
        console.error("Failed to decode access token:", error);
      }
    }


  }, [status, session, initialized, router]);

  // While auth is loading or we haven't populated the store, show spinner
    if (status === 'loading' ) {
     
      return <>OI</>;
    }
  
    // If unauthenticated, we already triggered signIn above; just show a loader
    if (status === 'unauthenticated') {
     return <>OI2</>;
    }
  return (
    <IconContext.Provider value={{ size: 20, weight: 'regular' }}>
      {children}
    </IconContext.Provider>
  );
}
