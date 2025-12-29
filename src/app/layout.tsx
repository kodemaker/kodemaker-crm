import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppHeader } from "@/components/app-header";
import { ConditionalSidebar } from "@/components/conditional-sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kodemaker CReMa",
  description: "Customer Relationship Management for Kodemaker",
  icons: {
    icon: "/logo.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AppHeader />
          <ConditionalSidebar isAuthenticated={isAuthenticated}>{children}</ConditionalSidebar>
        </Providers>
      </body>
    </html>
  );
}
