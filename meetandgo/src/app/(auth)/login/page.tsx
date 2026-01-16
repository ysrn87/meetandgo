"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button, Input, Alert } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email/phone or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <Link href="/" className="lg:hidden flex items-center justify-center gap-2 text-2xl font-bold text-primary-600 mb-6">
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.1" />
            <path d="M16 6L20 14H12L16 6Z" fill="currentColor" />
            <circle cx="16" cy="20" r="4" fill="currentColor" />
          </svg>
          MeetAndGo
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-slate-600 mt-2">Sign in to your account to continue</p>
      </div>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="identifier"
          label="Email or Phone"
          type="text"
          placeholder="email@example.com or +628123456789"
          required
          autoComplete="username"
          hint="Phone must include country code (e.g., +62)"
        />
        <Input
          name="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />
        <Button type="submit" fullWidth loading={loading}>
          Sign In
        </Button>
      </form>

      <p className="text-center mt-6 text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary-600 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
