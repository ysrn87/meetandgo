"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Alert } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");

    try {
      const result = await signIn("credentials", {
        identifier: form.identifier,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setFormError("Invalid email/phone or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
        <p className="text-slate-600 mt-2">Sign in to your account</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          Authentication failed. Please try again.
        </Alert>
      )}

      {formError && (
        <Alert variant="error" className="mb-6">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email or Phone"
          type="text"
          required
          value={form.identifier}
          onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          placeholder="Enter your email or phone"
          hint="Phone format: +62812345678"
        />

        <Input
          label="Password"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Enter your password"
        />

        <Button type="submit" className="w-full" loading={loading}>
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">
          Register
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md text-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}