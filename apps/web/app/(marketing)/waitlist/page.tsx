"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { CheckCircle2 } from "lucide-react";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="text-xl font-bold text-violet-600">
            FormForge
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center">
          {submitted ? (
            <div className="space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h1 className="text-2xl font-bold">{"You're on the list! 🎉"}</h1>
              <p className="text-gray-500">
                {"We'll notify you the moment Pro tier goes live. Check your inbox soon."}
              </p>
              <Link href="/">
                <Button variant="outline" className="mt-4">
                  Back to home
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full border border-violet-200">
                🚀 Pro Plan — Coming Soon
              </div>

              <h1 className="text-3xl font-bold">
                Be the first to know when Pro launches
              </h1>
              <p className="text-gray-500 text-base">
                Leave your email and{"we'll"} notify you the moment Pro tier goes live with
                unlimited forms, advanced analytics, and custom themes.
              </p>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="raj@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700 shrink-0">
                  Join Waitlist
                </Button>
              </form>

              <div className="pt-4 border-t grid grid-cols-3 gap-4 text-sm text-gray-500">
                {[
                  { icon: "♾️", label: "Unlimited forms" },
                  { icon: "📊", label: "Advanced analytics" },
                  { icon: "🎨", label: "Custom themes" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <span className="text-2xl">{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <Link href="/" className="block text-sm text-gray-400 hover:text-gray-600">
                ← Back to home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
