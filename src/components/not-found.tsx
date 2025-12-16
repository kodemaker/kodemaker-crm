"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
      <FileQuestion className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-6xl font-semibold text-muted-foreground">404</h1>
      <h2 className="text-xl font-medium mt-4">Siden finnes ikke</h2>
      <p className="text-muted-foreground mt-2 max-w-md">
        Siden du leter etter eksisterer ikke eller har blitt flyttet.
      </p>
      <Button asChild className="mt-6">
        <Link href="/events">Gå til forsiden</Link>
      </Button>
    </div>
  );
}
