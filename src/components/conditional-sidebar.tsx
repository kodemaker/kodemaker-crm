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
  if (isKanbanPage) {
    return (
      <div className="flex">
        <Sidebar />
        <div
          className="flex-1 min-w-0"
          style={{ marginRight: "max(1rem, calc((100vw - 72rem) / 2))" }}
        >
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
