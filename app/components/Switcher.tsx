"use client";

import React from "react";
import { useChildren } from "@/lib/hooks/useChildren";
import { useRouter, usePathname } from "next/navigation";
import type { Person } from "@/types";

// Fixed position switcher for parent to switch between kids
export default function Switcher() {
  const { children, isLoading, error } = useChildren();
  const router = useRouter();
  const pathname = usePathname();

  if (isLoading) return <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded p-4">Loading...</div>;
  if (error) return <div className="fixed top-4 right-4 z-50 bg-red-100 text-red-700 p-4 rounded">Error loading children</div>;
  if (!children?.length) return null;

  // If on /child/[id] page, replace id in URL, else go to /child/[id]
  function getSwitchUrl(newId: string) {
    const childDetailRegex = /^\/child\/([^/]+)/;
    if (childDetailRegex.test(pathname)) {
      return pathname.replace(childDetailRegex, `/child/${newId}`);
    }
    return `/child/${newId}`;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white shadow-lg rounded p-4 min-w-[180px]">
      <div className="font-bold mb-2 text-gray-700">Switch Student</div>
      <ul className="space-y-2">
        {children.map((child: Person) => (
          <li key={child.sourcedId}>
            <button
              className="w-full text-left px-2 py-1 rounded hover:bg-blue-100 focus:bg-blue-200 transition"
              onClick={() => {
                if (child.sourcedId) {
                  router.push(getSwitchUrl(child.sourcedId));
                }
              }}
            >
              {child.givenName || child.familyName || child.username || "Student"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
