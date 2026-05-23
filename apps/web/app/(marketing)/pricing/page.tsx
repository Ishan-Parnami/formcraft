"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Perfect for personal projects and getting started.",
    features: [
      "3 forms",
      "100 responses/month",
      "Basic themes",
      "Public & unlisted forms",
      "CSV export",
    ],
    cta: "Get started free",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    monthlyPrice: 12,
    annualPrice: 9,
    description: "For creators and small teams who need more power.",
    features: [
      "Unlimited forms",
      "10,000 responses/month",
      "All 10 premium themes",
      "Advanced analytics",
      "CSV export",
      "Custom success pages",
      "Conditional logic",
      "Password-protected forms",
    ],
    cta: "Start Pro trial",
    href: "/register",
    highlight: true,
  },
  {
    name: "Business",
    monthlyPrice: 39,
    annualPrice: 29,
    description: "For teams with enterprise-grade needs.",
    features: [
      "Everything in Pro",
      "Team workspace",
      "API access",
      "Priority support",
      "Custom domain",
      "White-label forms",
      "Advanced integrations",
      "SLA guarantee",
    ],
    cta: "Contact sales",
    href: "/register",
    highlight: false,
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-violet-600">FormForge</Link>
          <div className="flex gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/register"><Button size="sm" className="bg-violet-600 hover:bg-violet-700">Get started</Button></Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-center mb-4">Simple, transparent pricing</h1>
        <p className="text-gray-500 text-center mb-4">No hidden fees. Upgrade or cancel anytime.</p>
        <p className="text-center text-sm text-violet-600 font-medium mb-10">
          No payment required for demo — all plans fully functional
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={!annual ? "font-semibold" : "text-gray-500"}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? "bg-violet-600" : "bg-gray-300"}`}
          >
            <span className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${annual ? "translate-x-6" : "translate-x-0"}`} />
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
                <Link href={plan.href}>
                  <Button
                    className={`w-full mb-6 ${plan.highlight ? "bg-violet-600 hover:bg-violet-700" : ""}`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
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
