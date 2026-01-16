/**
 * Database Reset Script
 * 
 * This script clears all data from the database EXCEPT:
 * - User accounts (Admin, Tour Guide, Customer)
 * 
 * Usage: npx tsx prisma/reset.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log("🔄 Starting database reset...\n");

  try {
    // Delete in order to respect foreign key constraints

    // 1. Delete booking participants (junction table)
    const deletedBookingParticipants = await prisma.bookingParticipant.deleteMany({});
    console.log(`✓ Deleted ${deletedBookingParticipants.count} booking participants`);

    // 2. Delete bookings
    const deletedBookings = await prisma.booking.deleteMany({});
    console.log(`✓ Deleted ${deletedBookings.count} bookings`);

    // 3. Delete saved participants
    const deletedParticipants = await prisma.participant.deleteMany({});
    console.log(`✓ Deleted ${deletedParticipants.count} saved participants`);

    // 4. Delete custom tour requests
    const deletedCustomRequests = await prisma.customTourRequest.deleteMany({});
    console.log(`✓ Deleted ${deletedCustomRequests.count} custom tour requests`);

    // 5. Delete departure groups
    const deletedGroups = await prisma.departureGroup.deleteMany({});
    console.log(`✓ Deleted ${deletedGroups.count} departure groups`);

    // 6. Delete departures
    const deletedDepartures = await prisma.departure.deleteMany({});
    console.log(`✓ Deleted ${deletedDepartures.count} departures`);

    // 7. Delete itinerary activities
    const deletedActivities = await prisma.itineraryActivity.deleteMany({});
    console.log(`✓ Deleted ${deletedActivities.count} itinerary activities`);

    // 8. Delete itineraries
    const deletedItineraries = await prisma.itinerary.deleteMany({});
    console.log(`✓ Deleted ${deletedItineraries.count} itineraries`);

    // 9. Delete highlights
    const deletedHighlights = await prisma.highlight.deleteMany({});
    console.log(`✓ Deleted ${deletedHighlights.count} highlights`);

    // 10. Delete meeting points
    const deletedMeetingPoints = await prisma.meetingPoint.deleteMany({});
    console.log(`✓ Deleted ${deletedMeetingPoints.count} meeting points`);

    // 11. Delete tour packages
    const deletedPackages = await prisma.tourPackage.deleteMany({});
    console.log(`✓ Deleted ${deletedPackages.count} tour packages`);

    // Show preserved users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    console.log("\n✅ Database reset complete!\n");
    console.log("📋 Preserved user accounts:");
    console.log("─".repeat(60));
    users.forEach((user) => {
      console.log(`   ${user.role.padEnd(12)} | ${user.name?.padEnd(20)} | ${user.email || user.phone}`);
    });
    console.log("─".repeat(60));
    console.log(`   Total: ${users.length} user(s) preserved\n`);

  } catch (error) {
    console.error("❌ Error resetting database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetDatabase()
  .then(() => {
    console.log("🎉 Done! You can now add fresh data.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to reset database:", error);
    process.exit(1);
  });
