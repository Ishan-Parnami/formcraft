import { auth } from "~/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "~/auth";
import { Button } from "~/components/ui/button";
import { LayoutDashboard, FileText, Settings, LogOut, Plus } from "lucide-react";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-white border-r flex flex-col">
        <div className="h-16 border-b flex items-center px-4">
          <Link href="/" className="text-lg font-bold text-violet-600">FormCraft</Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </div>
          </Link>
          <Link href="/forms">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors">
              <FileText className="h-4 w-4" /> My Forms
            </div>
          </Link>
          <Link href="/settings">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors">
              <Settings className="h-4 w-4" /> Settings
            </div>
          </Link>
        </nav>

        <div className="p-3 border-t">
          <div className="px-3 py-2 text-sm text-gray-600 font-medium truncate">{session.user.name}</div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 w-full"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
