"use server";

import { signIn } from "@/lib/auth";
import { createUser } from "@/services/user.service";
import { registerSchema, loginSchema } from "@/lib/validations";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

export type AuthState = {
  error?: string;
  success?: boolean;
};

export async function registerAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      password: formData.get("password") as string,
    };

    const validated = registerSchema.safeParse(data);

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    await createUser({
      name: validated.data.name,
      email: validated.data.email || undefined,
      phone: validated.data.phone || undefined,
      password: validated.data.password,
    });

    // Auto sign in after registration
    await signIn("credentials", {
      identifier: validated.data.email || validated.data.phone,
      password: validated.data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Registration failed. Please try again." };
  }
}

export async function loginAction(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    const data = {
      identifier: formData.get("identifier") as string,
      password: formData.get("password") as string,
    };

    const validated = loginSchema.safeParse(data);

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    await signIn("credentials", {
      identifier: validated.data.identifier,
      password: validated.data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "Authentication failed" };
      }
    }
    return { error: "Login failed. Please try again." };
  }
}
