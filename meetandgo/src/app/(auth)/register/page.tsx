"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button, Input, Alert, PhoneInput } from "@/components/ui";
import { registerSchema } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setErrors({});
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: phone,
      password: formData.get("password") as string,
    };

    // Validate
    const result = registerSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign in
      const signInResult = await signIn("credentials", {
        identifier: data.email || data.phone,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
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
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="text-slate-600 mt-2">Join us and start your adventure</p>
      </div>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="name" label="Full Name" placeholder="Enter your full name" required error={errors.name} />
        <Input name="email" label="Email" type="email" placeholder="Enter your email" error={errors.email} hint="Optional if phone is provided" />
        <PhoneInput 
          label="Phone Number" 
          value={phone} 
          onChange={setPhone} 
          error={errors.phone} 
          hint="Optional if email is provided" 
        />
        <Input name="password" label="Password" type="password" placeholder="Create a password" required error={errors.password} hint="Min 8 characters with uppercase, lowercase, and number" autoComplete="new-password" />
        <Button type="submit" fullWidth loading={loading}>Create Account</Button>
      </form>

      <p className="text-center mt-6 text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
