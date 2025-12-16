"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
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
    label: "Oppfølgninger",
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

type SidebarContext = {
  pathname: ReturnType<typeof usePathname>;
  headerCompanyId: number | undefined;
  headerCompanyName: string | undefined;
  headerContactId: number | undefined;
  headerContactName: string | undefined;
};

type SidebarProps = {
  /** Used by Cosmos fixture to bypass lg-only visibility for testing */
  forceVisible?: boolean;
};

function useSidebarContext(): SidebarContext {
  const pathname = usePathname();
  const companyMatch = pathname?.match(/^\/customers\/(\d+)$/);
  const companyIdFromPath = companyMatch ? Number(companyMatch[1]) : undefined;
  const { data: companyData } = useSWR<{ company: { id: number; name: string } }>(
    companyIdFromPath ? `/api/companies/${companyIdFromPath}` : null
  );
  const contactMatch = pathname?.match(/^\/contacts\/(\d+)$/);
  const contactIdFromPath = contactMatch ? Number(contactMatch[1]) : undefined;
  const { data: contactData } = useSWR<{
    contact: { id: number; firstName: string; lastName: string };
    currentCompany: { id: number; name: string } | null;
  }>(contactIdFromPath ? `/api/contacts/${contactIdFromPath}` : null);
  const headerCompanyId = companyIdFromPath ?? contactData?.currentCompany?.id;
  const headerCompanyName = companyData?.company?.name ?? contactData?.currentCompany?.name;
  const headerContactId = contactIdFromPath ?? undefined;
  const headerContactName = contactData
    ? `${contactData.contact.firstName} ${contactData.contact.lastName}`
    : undefined;

  return {
    pathname,
    headerCompanyId,
    headerCompanyName,
    headerContactId,
    headerContactName,
  };
}

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
      className={`flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted ${
        active ? "bg-muted font-semibold" : "text-foreground/80"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar({ forceVisible = false }: SidebarProps = {}) {
  const { pathname, headerCompanyId, headerCompanyName, headerContactId, headerContactName } =
    useSidebarContext();

  return (
    <aside
      className={`${forceVisible ? "flex" : "hidden lg:flex"} lg:flex-col lg:w-64 shrink-0 border-r bg-card`}
    >
      <div className="p-3 space-y-3">
        <CreateNewMenu
          companyId={headerCompanyId}
          companyName={headerCompanyName}
          contactId={headerContactId}
          contactName={headerContactName}
        />
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
  const { pathname, headerCompanyId, headerCompanyName, headerContactId, headerContactName } =
    useSidebarContext();

  return (
    <div className="p-3 pt-12">
      <div className="mb-3">
        <CreateNewMenu
          companyId={headerCompanyId}
          companyName={headerCompanyName}
          contactId={headerContactId}
          contactName={headerContactName}
        />
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
