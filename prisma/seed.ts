import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Admin User
  const adminPassword = await bcrypt.hash("Admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@meetandgo.id" },
    update: {},
    create: {
      name: "Admin MeetAndGo",
      email: "admin@meetandgo.id",
      phone: "081234567890",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create Sample Customer
  const customerPassword = await bcrypt.hash("Customer123", 10);
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      name: "John Customer",
      email: "customer@example.com",
      phone: "081234567892",
      password: customerPassword,
      role: "CUSTOMER",
    },
  });
  console.log("✅ Sample customer created:", customer.email);

}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
