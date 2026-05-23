"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ComingSoonBadge } from "~/components/ui/coming-soon-badge";
import { CheckCircle2 } from "lucide-react";

type Feature = { label: string; comingSoon?: boolean };

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Perfect for personal projects and getting started.",
    features: [
      { label: "3 forms" },
      { label: "100 responses/month", comingSoon: true },
      { label: "Public & unlisted forms" },
      { label: "CSV export" },
    ] satisfies Feature[],
    highlight: false,
    cta: "free",
  },
  {
    name: "Pro",
    monthlyPrice: 12,
    annualPrice: 9,
    description: "For creators and small teams who need more power.",
    features: [
      { label: "Unlimited forms" },
      { label: "10,000 responses/month", comingSoon: true },
      { label: "Advanced analytics" },
      { label: "CSV export" },
      { label: "Custom success pages" },
      { label: "Password-protected forms" },
      { label: "All 10 premium themes", comingSoon: true },
      { label: "Conditional logic", comingSoon: true },
    ] satisfies Feature[],
    highlight: true,
    cta: "pro",
  },
  {
    name: "Business",
    monthlyPrice: 39,
    annualPrice: 29,
    description: "For teams with enterprise-grade needs.",
    features: [
      { label: "Everything in Pro" },
      { label: "API access" },
      { label: "Priority support" },
      { label: "SLA guarantee" },
      { label: "Team workspace", comingSoon: true },
      { label: "Custom domain", comingSoon: true },
      { label: "White-label forms", comingSoon: true },
      { label: "Advanced integrations", comingSoon: true },
    ] satisfies Feature[],
    highlight: false,
    cta: "business",
  },
] as const;

function PlanCTA({ cta, isLoggedIn }: { cta: string; isLoggedIn: boolean }) {
  if (cta === "free") {
    return (
      <Link href={isLoggedIn ? "/dashboard" : "/register"}>
        <Button className="w-full mb-6" variant="outline">
          {isLoggedIn ? "Go to Dashboard" : "Get started free"}
        </Button>
      </Link>
    );
  }

  if (cta === "pro") {
    return (
      <div className="mb-6 space-y-2">
        <Button
          className="w-full cursor-not-allowed opacity-60 bg-violet-600"
          disabled
        >
          Coming Soon
        </Button>
        <p className="text-center text-xs text-gray-500">
          Pro plan launching soon —{" "}
          <Link href="/waitlist" className="text-violet-600 hover:underline font-medium">
            join the waitlist
          </Link>
        </p>
      </div>
    );
  }

  // business
  return (
    <Link href="/contact">
      <Button className="w-full mb-6" variant="outline">
        Contact Sales
      </Button>
    </Link>
  );
}

export default function PricingContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-violet-600">
            FormForge
          </Link>
          <div className="flex gap-3">
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
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-center mb-4">Simple, transparent pricing</h1>
        <p className="text-gray-500 text-center mb-4">No hidden fees. Upgrade or cancel anytime.</p>
        <p className="text-center text-sm text-violet-600 font-medium mb-10">
          No payment required for demo
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={!annual ? "font-semibold" : "text-gray-500"}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? "bg-violet-600" : "bg-gray-300"}`}
          >
            <span
              className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${annual ? "translate-x-6" : "translate-x-0"}`}
            />
          </button>
          <span className={annual ? "font-semibold" : "text-gray-500"}>
            Annual <Badge className="ml-1 bg-green-100 text-green-700 border-0">Save 25%</Badge>
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.highlight ? "border-violet-600 border-2 shadow-lg" : "border"}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-600 text-white border-0">Most popular</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <h2 className="text-xl font-bold">{plan.name}</h2>
                <div className="mt-2">
                  <span className="text-4xl font-black">
                    ${annual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                {annual && plan.monthlyPrice > 0 && (
                  <p className="text-xs text-gray-400">billed annually</p>
                )}
                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <PlanCTA cta={plan.cta} isLoggedIn={isLoggedIn} />
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f.label} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{f.label}</span>
                      {f.comingSoon && (
                        <span className="ml-auto">
                          <ComingSoonBadge />
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
