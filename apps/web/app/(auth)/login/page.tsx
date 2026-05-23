"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@formforge/schemas/user";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader } from "~/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-xl font-bold text-violet-600 mb-8">
          FormForge
        </Link>
        <Card>
          <CardHeader className="pb-2">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-gray-500">Sign in to your account</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className="mt-1"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="mt-1"
                />
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-violet-600 hover:bg-violet-700"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-4">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-violet-600 hover:underline">
                Sign up
              </Link>
            </p>
            <div className="mt-4 p-3 bg-blue-50 rounded-md text-xs text-blue-700">
              <strong>Demo:</strong> demo@formforge.dev / Demo@1234
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
