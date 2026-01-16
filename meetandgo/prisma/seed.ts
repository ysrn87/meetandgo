import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Admin User
  const adminPassword = await bcrypt.hash("Admin123!", 10);
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

  // Create Tour Guide
  const guidePassword = await bcrypt.hash("Guide123!", 10);
  const guide = await prisma.user.upsert({
    where: { email: "guide@meetandgo.id" },
    update: {},
    create: {
      name: "Budi Tour Guide",
      email: "guide@meetandgo.id",
      phone: "081234567891",
      password: guidePassword,
      role: "TOUR_GUIDE",
    },
  });
  console.log("✅ Tour guide created:", guide.email);

  // Create Sample Customer
  const customerPassword = await bcrypt.hash("Customer123!", 10);
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

  // Create Sample Open Trip Package
  const openTrip = await prisma.tourPackage.upsert({
    where: { slug: "bali-paradise-adventure" },
    update: {},
    create: {
      title: "Bali Paradise Adventure",
      slug: "bali-paradise-adventure",
      tripType: "OPEN_TRIP",
      location: "Bali, Indonesia",
      description: "Experience the best of Bali in this 4-day adventure. Visit ancient temples, pristine beaches, rice terraces, and immerse yourself in Balinese culture. Perfect for solo travelers and groups looking for an unforgettable island experience.",
      duration: "4 Days 3 Nights",
      durationDays: 4,
      thumbnail: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
      images: [
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200",
        "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1200",
      ],
      highlights: {
        create: [
          { title: "Tanah Lot Temple", description: "Iconic sea temple", order: 0 },
          { title: "Tegallalang Rice Terrace", description: "UNESCO heritage site", order: 1 },
          { title: "Kuta Beach", description: "Famous sunset spot", order: 2 },
          { title: "Ubud Monkey Forest", description: "Sacred sanctuary", order: 3 },
        ],
      },
      itineraries: {
        create: [
          {
            day: 1,
            title: "Arrival & South Bali",
            activities: {
              create: [
                { startTime: "10:00", endTime: "11:00", activity: "Airport pickup", order: 0 },
                { startTime: "12:00", endTime: "13:00", activity: "Lunch at local restaurant", order: 1 },
                { startTime: "14:00", endTime: "17:00", activity: "Tanah Lot Temple visit", order: 2 },
                { startTime: "18:00", endTime: "19:00", activity: "Sunset viewing", order: 3 },
              ],
            },
          },
          {
            day: 2,
            title: "Ubud Exploration",
            activities: {
              create: [
                { startTime: "07:00", endTime: "08:00", activity: "Breakfast at hotel", order: 0 },
                { startTime: "09:00", endTime: "12:00", activity: "Tegallalang Rice Terrace", order: 1 },
                { startTime: "13:00", endTime: "14:00", activity: "Lunch in Ubud", order: 2 },
                { startTime: "15:00", endTime: "17:00", activity: "Ubud Monkey Forest", order: 3 },
              ],
            },
          },
        ],
      },
      includedItems: {
        create: [
          { item: "3-night accommodation", order: 0 },
          { item: "Daily breakfast", order: 1 },
          { item: "Air-conditioned transport", order: 2 },
          { item: "English-speaking guide", order: 3 },
          { item: "Entrance fees", order: 4 },
        ],
      },
      excludedItems: {
        create: [
          { item: "Flight tickets", order: 0 },
          { item: "Personal expenses", order: 1 },
          { item: "Travel insurance", order: 2 },
          { item: "Tips for guide", order: 3 },
        ],
      },
      meetingPoints: {
        create: [
          { name: "Ngurah Rai International Airport", address: "Tuban, Kuta, Badung", time: "10:00", order: 0 },
          { name: "Kuta Beach Hotel Lobby", address: "Jl. Pantai Kuta", time: "10:30", order: 1 },
        ],
      },
      departures: {
        create: [
          { departureDate: new Date("2025-02-15"), pricePerPerson: 2500000, maxParticipants: 15 },
          { departureDate: new Date("2025-03-01"), pricePerPerson: 2750000, maxParticipants: 15 },
          { departureDate: new Date("2025-03-15"), pricePerPerson: 2500000, maxParticipants: 15 },
        ],
      },
    },
  });
  console.log("✅ Open trip package created:", openTrip.title);

  // Create Sample Private Trip Package
  const privateTrip = await prisma.tourPackage.upsert({
    where: { slug: "lombok-private-escape" },
    update: {},
    create: {
      title: "Lombok Private Escape",
      slug: "lombok-private-escape",
      tripType: "PRIVATE_TRIP",
      location: "Lombok, Indonesia",
      description: "Exclusive private tour of Lombok island. Enjoy pristine beaches, climb Mount Rinjani base camp, visit traditional Sasak villages, and experience the Gili Islands. Perfect for families and private groups seeking a personalized adventure.",
      duration: "5 Days 4 Nights",
      durationDays: 5,
      thumbnail: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800",
      highlights: {
        create: [
          { title: "Gili Trawangan", description: "Island paradise", order: 0 },
          { title: "Senggigi Beach", description: "Stunning coastline", order: 1 },
          { title: "Sasak Village", description: "Traditional culture", order: 2 },
          { title: "Rinjani Base Camp", description: "Volcanic views", order: 3 },
        ],
      },
      itineraries: {
        create: [
          {
            day: 1,
            title: "Arrival & Senggigi",
            activities: {
              create: [
                { startTime: "12:00", endTime: "13:00", activity: "Airport pickup", order: 0 },
                { startTime: "14:00", endTime: "15:00", activity: "Hotel check-in", order: 1 },
                { startTime: "16:00", endTime: "18:00", activity: "Senggigi Beach sunset", order: 2 },
              ],
            },
          },
        ],
      },
      includedItems: {
        create: [
          { item: "4-night accommodation", order: 0 },
          { item: "All meals", order: 1 },
          { item: "Private car & driver", order: 2 },
          { item: "Private guide", order: 3 },
          { item: "Boat to Gili Islands", order: 4 },
        ],
      },
      excludedItems: {
        create: [
          { item: "Flight tickets", order: 0 },
          { item: "Personal expenses", order: 1 },
          { item: "Travel insurance", order: 2 },
        ],
      },
      meetingPoints: {
        create: [
          { name: "Lombok International Airport", address: "Praya, Central Lombok", time: "12:00", order: 0 },
        ],
      },
      departures: {
        create: [
          {
            departureDate: new Date("2025-02-20"),
            groups: {
              create: [
                { groupNumber: 1, price: 8500000, maxParticipants: 4 },
                { groupNumber: 2, price: 8500000, maxParticipants: 4 },
              ],
            },
          },
          {
            departureDate: new Date("2025-03-10"),
            groups: {
              create: [
                { groupNumber: 1, price: 9000000, maxParticipants: 4 },
                { groupNumber: 2, price: 9000000, maxParticipants: 4 },
                { groupNumber: 3, price: 9000000, maxParticipants: 4 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log("✅ Private trip package created:", privateTrip.title);

  console.log("\n🎉 Seeding completed!\n");
  console.log("Login credentials:");
  console.log("  Admin: admin@meetandgo.id / Admin123!");
  console.log("  Guide: guide@meetandgo.id / Guide123!");
  console.log("  Customer: customer@example.com / Customer123!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
