import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";
import { SessionProvider } from "next-auth/react";
import { auth } from "~/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FormForge — Build Beautiful Forms",
  description: "Create, share, and analyze forms in minutes. Typeform-style form builder with analytics and a theme gallery.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="en">
      <body className={inter.variable}>
        <SessionProvider session={session}>
          <GlobalProviders>{children}</GlobalProviders>
        </SessionProvider>
      </body>
    </html>
  );
}
