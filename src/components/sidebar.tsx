"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgePercent, Building2, ClipboardList, History, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CreateNewMenu } from "@/components/create-new-menu";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive?: (pathname: string | null) => boolean;
};

const MAIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/events",
    label: "Hendelseslogg",
    icon: History,
    isActive: (pathname) => pathname === "/events",
  },
  {
    href: "/followups",
    label: "Oppgaver",
    icon: ClipboardList,
    isActive: (pathname) => pathname === "/followups",
  },
  {
    href: "/contacts",
    label: "Kontakter",
    icon: Users2,
    isActive: (pathname) => pathname === "/contacts",
  },
  {
    href: "/customers",
    label: "Organisasjoner",
    icon: Building2,
    isActive: (pathname) => pathname === "/customers",
  },
  {
    href: "/leads/active",
    label: "Leads",
    icon: BadgePercent,
    isActive: (pathname) => pathname === "/leads/active",
  },
];

type SidebarProps = {
  /** Used by Cosmos fixture to bypass lg-only visibility for testing */
  forceVisible?: boolean;
};

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted active:bg-muted/80 ${
        active ? "bg-muted font-semibold" : "text-foreground/80"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar({ forceVisible = false }: SidebarProps = {}) {
  const pathname = usePathname();

  return (
    <aside
      className={`${forceVisible ? "flex" : "hidden lg:flex"} lg:flex-col lg:w-64 shrink-0 border-r bg-card`}
    >
      <div className="p-3 space-y-3">
        <CreateNewMenu />
        <div className="space-y-1">
          {MAIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={item.isActive ? item.isActive(pathname) : pathname === item.href}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

export function SidebarSheetContent() {
  const pathname = usePathname();

  return (
    <div className="p-3 pt-12">
      <div className="mb-3">
        <CreateNewMenu />
      </div>
      {MAIN_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={item.isActive ? item.isActive(pathname) : pathname === item.href}
        />
      ))}
    </div>
  );
}
