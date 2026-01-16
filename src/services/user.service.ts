import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";

export async function createUser(data: { name: string; email?: string; phone?: string; password: string }): Promise<User> {
  if (!data.email && !data.phone) throw new Error("Email or phone is required");

  if (data.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) throw new Error("Email already registered");
  }

  if (data.phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existingPhone) throw new Error("Phone number already registered");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      password: hashedPassword,
    },
  });
}

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { phone } });
}

export async function updateUserProfile(id: string, data: { name?: string; email?: string; phone?: string }): Promise<User> {
  if (data.email) {
    const existing = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
    if (existing) throw new Error("Email already in use");
  }

  if (data.phone) {
    const existing = await prisma.user.findFirst({ where: { phone: data.phone, NOT: { id } } });
    if (existing) throw new Error("Phone number already in use");
  }

  return prisma.user.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
    },
  });
}

export async function updateUserPassword(id: string, currentPassword: string, newPassword: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("User not found");

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) throw new Error("Current password is incorrect");

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  return prisma.user.update({ where: { id }, data: { password: hashedPassword } });
}

export async function getTourGuides(): Promise<Pick<User, "id" | "name" | "email" | "phone">[]> {
  return prisma.user.findMany({
    where: { role: "TOUR_GUIDE" },
    select: { id: true, name: true, email: true, phone: true },
  });
}
