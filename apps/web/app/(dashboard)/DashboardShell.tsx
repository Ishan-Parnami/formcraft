"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Settings, LogOut, Menu, X, Users } from "lucide-react";
import { ComingSoonBadge } from "~/components/ui/coming-soon-badge";

const navLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/forms", icon: FileText, label: "My Forms" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function SidebarContent({
  userName,
  signOutAction,
  onNavClick,
}: {
  userName: string;
  signOutAction: () => Promise<void>;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="h-16 border-b flex items-center px-4 shrink-0">
        <Link href="/" className="text-lg font-bold text-violet-600" onClick={onNavClick}>
          FormForge
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navLinks.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} onClick={onNavClick}>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-violet-50 text-violet-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </div>
          </Link>
        ))}
        {/* Team — coming soon */}
        <div className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-400 cursor-not-allowed select-none">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" />
            Team
          </div>
          <ComingSoonBadge />
        </div>
      </nav>

      <div className="p-3 border-t shrink-0">
        <div className="px-3 py-2 text-sm text-gray-600 font-medium truncate">{userName}</div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 w-full"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DashboardShell({
  children,
  userName,
  signOutAction,
}: {
  children: React.ReactNode;
  userName: string;
  signOutAction: () => Promise<void>;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-white border-r flex-col h-screen sticky top-0">
        <SidebarContent userName={userName} signOutAction={signOutAction} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-white border-r z-50 flex flex-col transition-transform duration-200 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          userName={userName}
          signOutAction={signOutAction}
          onNavClick={() => setMobileOpen(false)}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 bg-white border-b flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
            aria-label="Open menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-sm font-semibold text-violet-600">FormForge</span>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
