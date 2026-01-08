"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function SignOutPage() {
  useEffect(() => {
    console.log('🟢 [SIGNOUT PAGE] Page loaded successfully');
    console.log('🟢 [SIGNOUT PAGE] Current URL:', window.location.href);
    console.log('🟢 [SIGNOUT PAGE] URL params:', window.location.search);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">You have been logged out</h1>
          <p className="mt-4 text-gray-600">
            Thank you for using the Parent Portal. You have been successfully signed out.
          </p>
        </div>

        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-center text-sm text-gray-600">
                If you need to access your account again, please sign in.
              </p>
              
              <Link href="/login">
                <Button className="w-full">
                  Sign In Again
                </Button>
              </Link>

              <div className="text-center">
                <Link
                  href="https://www.moe.gov.ae"
                  className="text-sm text-aegold-600 hover:text-aegold-500 focus:outline-none focus:ring-2 focus:ring-aegold-500 focus:ring-offset-2 rounded-md px-1"
                >
                  Return to Ministry of Education Website
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>Ministry of Education - UAE</p>
        </div>
      </div>
    </div>
  );
}
