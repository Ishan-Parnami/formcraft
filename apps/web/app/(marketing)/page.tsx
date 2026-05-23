import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Zap, BarChart3, Palette, Share2, ArrowRight, Star } from "lucide-react";
import { auth } from "~/auth";

const features = [
  {
    icon: Zap,
    title: "Drag-and-drop Builder",
    description: "Intuitively arrange 9 field types. No design skills required.",
  },
  {
    icon: Palette,
    title: "Beautiful Themes",
    description: "10 handcrafted themes: Blade Runner, Ghibli Forest, Matrix, and more.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track views, responses, completion rate, and field-level insights.",
  },
  {
    icon: Share2,
    title: "Shareable Links",
    description: "Publish forms with a custom slug. Public or unlisted — you decide.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create",
    description: "Pick a theme, add your fields, configure validations.",
  },
  {
    number: "02",
    title: "Share",
    description: "Publish and share your unique form URL with anyone.",
  },
  {
    number: "03",
    title: "Collect",
    description: "Watch responses roll in and export them as CSV.",
  },
];

const testimonials = [
  {
    name: "Aisha Patel",
    role: "Product Manager @ Stripe",
    body: "Replaced Typeform in a day. The themes are stunning and the analytics are exactly what we needed.",
    rating: 5,
  },
  {
    name: "Carlos Mendez",
    role: "Indie Hacker",
    body: "I build waitlist forms for every side project. FormForge is now my default — free tier is super generous.",
    rating: 5,
  },
  {
    name: "Sophie Zhang",
    role: "UX Researcher @ Figma",
    body: "The conditional logic saves so much time. Forms feel smart and personal to each respondent.",
    rating: 5,
  },
];

export default async function LandingPage() {
  const session = await auth();
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b sticky top-0 bg-white/80 backdrop-blur z-50">
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
            {session?.user ? (
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
                    Get started free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <Badge className="mb-6 bg-violet-50 text-violet-700 border-violet-200">
          Open beta — free forever
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
          Build beautiful forms
          <br />
          <span className="text-violet-600">in minutes</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Drag-and-drop builder. 10 stunning themes. Analytics that actually make sense. No design
          skills required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 px-8">
              Start building free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/explore">
            <Button size="lg" variant="outline" className="px-8">
              See live examples
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Everything you need</h2>
          <p className="text-gray-500 text-center mb-12">No fluff. Just the tools that matter.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <f.icon className="h-8 w-8 text-violet-600 mb-4" />
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">How it works</h2>
        <p className="text-gray-500 text-center mb-16">Three steps from idea to data</p>
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((s) => (
            <div key={s.number} className="text-center">
              <div className="text-5xl font-black text-violet-100 mb-4">{s.number}</div>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-gray-500">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Loved by builders</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 text-sm">&ldquo;{t.body}&rdquo;</p>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center max-w-6xl mx-auto px-4">
        <h2 className="text-4xl font-bold mb-4">Ready to build?</h2>
        <p className="text-gray-500 mb-8 text-lg">Free forever. No credit card required.</p>
        <Link href="/register">
          <Button size="lg" className="bg-violet-600 hover:bg-violet-700 px-10">
            Create your first form
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="font-bold text-gray-900">FormForge</div>
          <div className="flex gap-6">
            <Link href="/pricing">Pricing</Link>
            <Link href="/explore">Explore</Link>
            <Link href="/login">Login</Link>
            <Link href="/register">Sign up</Link>
          </div>
          <div>© {new Date().getFullYear()} FormForge</div>
        </div>
      </footer>
    </div>
  );
}
