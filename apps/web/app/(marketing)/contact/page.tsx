"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { CheckCircle2 } from "lucide-react";

type FormState = {
  name: string;
  email: string;
  company: string;
  teamSize: string;
  useCase: string;
};

const EMPTY: FormState = { name: "", email: "", company: "", teamSize: "", useCase: "" };

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitted, setSubmitted] = useState(false);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid work email required";
    if (!form.company.trim()) e.company = "Required";
    if (!form.useCase.trim()) e.useCase = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Nav />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">Message sent!</h1>
            <p className="text-gray-500">
              Thanks {form.name.split(" ")[0]}! We typically respond within 24 hours.
            </p>
            <Link href="/">
              <Button variant="outline" className="mt-2">
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Nav />

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Talk to Sales</h1>
            <p className="text-gray-500">
              Tell us about your team and {"we'll"} be in touch within 24 hours.
            </p>
            <p className="text-xs text-gray-400 mt-2 italic">
              ✨ This page is built with FormForge — try submitting to see it in action
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5 bg-white border rounded-2xl p-8 shadow-sm">
            <Field label="Your name" required error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Raj Sharma"
              />
            </Field>

            <Field label="Work email" required error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="raj@company.com"
              />
            </Field>

            <Field label="Company name" required error={errors.company}>
              <Input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Infosys Ltd"
              />
            </Field>

            <Field label="Team size" error={errors.teamSize}>
              <Input
                type="number"
                min={1}
                value={form.teamSize}
                onChange={(e) => set("teamSize", e.target.value)}
                placeholder="e.g. 25"
              />
            </Field>

            <Field label="Tell us about your use case" required error={errors.useCase}>
              <Textarea
                value={form.useCase}
                onChange={(e) => set("useCase", e.target.value)}
                placeholder="What are you hoping to build with FormForge?"
                rows={4}
              />
            </Field>

            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Nav() {
  return (
    <nav className="border-b">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center">
        <Link href="/" className="text-xl font-bold text-violet-600">
          FormForge
        </Link>
      </div>
    </nav>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
