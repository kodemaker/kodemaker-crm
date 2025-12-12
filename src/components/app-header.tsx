"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { signIn, signOut, useSession } from "next-auth/react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarSheetContent } from "@/components/sidebar";
import { Menu } from "lucide-react";

export function AppHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const email = session?.user?.email || "";
  const avatarInitial = (email.trim()[0]?.toUpperCase() || "?") as string;
  const isLoginPage = pathname === "/login";

  // Close sheet when pathname changes (navigation occurred)
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b bg-primary text-primary-foreground overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isLoginPage && (
            <div className="lg:hidden">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <button
                    className="p-2 rounded bg-white/15 hover:bg-white/25"
                    aria-label="Open Menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72" aria-describedby={undefined}>
                  <SheetTitle className="sr-only">Meny</SheetTitle>
                  <SidebarSheetContent />
                </SheetContent>
              </Sheet>
            </div>
          )}
          <div className="hidden md:block relative h-10 w-[140px]">
            <Image
              src="/kodemaker-hvit-logo.svg"
              alt="Logo"
              fill
              priority
              className="drop-shadow object-contain"
            />
          </div>
          <Link href="/" className="font-semibold tracking-wide">
            CReMa
          </Link>
        </div>
        {session?.user ? (
          <nav className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Avatar>
                    <AvatarFallback>{avatarInitial}</AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">{email}</TooltipContent>
            </Tooltip>
            <button
              type="button"
              className="rounded bg-white/15 hover:bg-white/25 px-3 py-1.5 text-sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Logg ut
            </button>
          </nav>
        ) : (
          !isLoginPage && (
            <nav className="flex items-center gap-2">
              <button
                type="button"
                className="rounded bg-white/15 hover:bg-white/25 px-3 py-1.5 text-sm"
                onClick={() => signIn("google", { callbackUrl: "/" })}
              >
                Logg inn
              </button>
            </nav>
          )
        )}
      </div>
    </header>
  );
}
