import Link from "next/link";
import { Button } from "~/components/ui/button";

interface MarketingNavProps {
  isLoggedIn: boolean;
}

export function MarketingNav({ isLoggedIn }: MarketingNavProps) {
  return (
    <nav className="border-b">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-violet-600">
          FormForge
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
            Pricing
          </Link>
          <Link href="/explore" className="text-gray-600 hover:text-gray-900">
            Explore
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                Go to Dashboard →
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
