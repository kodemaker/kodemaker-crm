"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />

      {/* Subtle decorative circles */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-chart-2/5 blur-3xl" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm mx-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center gap-8 rounded-xl border bg-card/80 p-8 shadow-lg backdrop-blur-sm sm:p-10">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="animate-in zoom-in duration-500 delay-150">
              <Image
                src="/logo.svg"
                alt="CReMa"
                width={80}
                height={80}
                priority
                className="drop-shadow-md"
              />
            </div>
            <div className="animate-in fade-in duration-500 delay-300 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Logg inn på CReMa
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Bruk kodemaker-mailen din
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-border" />

          {/* Sign in button */}
          <div className="w-full animate-in fade-in duration-500 delay-500">
            <Button
              size="lg"
              className="w-full text-base"
              onClick={() => signIn("google", { callbackUrl: "/" })}
            >
              Logg inn
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
