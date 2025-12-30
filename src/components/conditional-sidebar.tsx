"use client";
import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export function ConditionalSidebar({
  children,
  isAuthenticated,
}: {
  children: ReactNode;
  isAuthenticated: boolean;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isKanbanPage = pathname === "/leads/active";

  if (!isAuthenticated || isLoginPage) {
    return (
      <div className="mx-auto max-w-6xl flex">
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  // Kanban page: sidebar at edge, content right edge aligns with header
  // On mobile (< lg), sidebar is hidden so we use simple padding
  // On large screens, we align right edge with max-w-6xl container
  if (isKanbanPage) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0 mr-2 sm:mr-4 lg:mr-[max(1rem,calc((100vw-72rem)/2))]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl flex">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
