"use client";

import React, { useEffect, useRef, useState } from 'react';
import { IconContext } from '@phosphor-icons/react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';

type Props = {
  children: React.ReactNode;
};

export default function IconProvider({ children }: Props) {
  const { status } = useSession();
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);
  const attemptedRef = useRef(false); // ⬅️ prevent multiple signIns per mount

  useEffect(() => {
    const url = window.location.href;
  
    if (status === 'loading') return;

    // 2) If not signed in yet, try mobile-token ONCE, else fall back to OIDC
    if (status === 'unauthenticated' && !attemptedRef.current) {
      alert('unauthenticated - redirecting to login');
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

    // 3) If authenticated, perform any one-time client init
    if (status === 'authenticated' && !initialized) {
      setInitialized(true);
    }


  }, [status, initialized, router]);

  // While auth is loading or we haven't populated the store, show spinner
    if (status === 'loading' ) {
     
      return <Spinner variant="creative" textKey="common.loading"  fullPage={true} size="lg" />;
    }
  
    // If unauthenticated, we already triggered signIn above; just show a loader
    if (status === 'unauthenticated') {
     return <Spinner variant="dots"  textKey="common.loading" fullPage={true} size="lg" />;
    }
  return (
    <IconContext.Provider value={{ size: 20, weight: 'regular' }}>
      {children}
    </IconContext.Provider>
  );
}
