"use client";

import React from "react";
import { useChildren } from "@/lib/hooks/useChildren";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronRightIcon,
} from "@/app/components/icons";
import { useI18n } from "@/app/i18n/I18nProvider";
import { useSession } from "next-auth/react";


export default function ChildCards() {
  const { t, locale } = useI18n();
  const { data: session, status } = useSession();

  // normalization is handled by useChildren

  const eid = status === "authenticated" ? (session?.user?.emiratesId || "784198791735438") : undefined;
  const { children, error, isLoading } = useChildren(eid);
  console.log("Children:", children, error, isLoading);
  const isBusy = status === "loading" || (status === "authenticated" && isLoading);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {isBusy && (
        <div className="col-span-full text-center text-sm text-gray-500">
          {"Loading..."}
        </div>
      )}
      {error && (
        <div
          className="col-span-full text-center text-sm text-red-600"
          role="alert"
        >
          {error instanceof Error ? error.message : String(error)}
        </div>
      )}
      {(children ?? []).map((child) => (
        <Card
          key={child.id}
          className="group relative hover:shadow-lg transition-all border border-transparent hover:border-blue-100"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <CardTitle className="text-lg leading-tight truncate">
                    {child.arabicName}
                  </CardTitle>
              
                </div>
              </div>
              <Link
                href={`/child/${child.id}`}
                className="text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-2"
                aria-label={`View details for ${child.name}`}
              >
                <ChevronRightIcon className="w-5 h-5" />
              </Link>
            </div>
          </CardHeader>
       
        </Card>
      ))}
      {/* If no children fetched and not loading/error, optionally show nothing or a helpful hint */}
      {status === "authenticated" && !isBusy && !error && (!children || children.length === 0) && (
        <div className="col-span-full text-center text-sm text-gray-500">
          {"No linked students found for your account."}
        </div>
      )}
    </div>
  );
}
