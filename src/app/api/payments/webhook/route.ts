import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import type { BookingStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("Midtrans webhook received:", JSON.stringify(body, null, 2));

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const hash = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");

    if (hash !== signature_key) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // Extract booking code (format: MNG-{code})
    const parts = order_id.split("-");
    const bookingCode = parts[1];

    console.log("Looking for booking with code:", bookingCode);

    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
    });

    if (!booking) {
      console.error("Booking not found for code:", bookingCode);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    console.log("Current booking status:", booking.status);
    console.log("Midtrans transaction status:", transaction_status);

    let newStatus: BookingStatus = booking.status;

    // Determine new status based on Midtrans transaction status
    if (transaction_status === "capture" || transaction_status === "settlement") {
      if (fraud_status === "accept" || !fraud_status) {
        newStatus = "PAYMENT_RECEIVED";
      }
    } else if (transaction_status === "pending") {
      newStatus = "PENDING";
    } else if (
      transaction_status === "deny" ||
      transaction_status === "expire" ||
      transaction_status === "cancel"
    ) {
      newStatus = "CANCELLED";

      // Release group if private trip
      if (booking.departureGroupId) {
        await prisma.departureGroup.update({
          where: { id: booking.departureGroupId },
          data: { isBooked: false },
        });
      }
    }

    console.log("Updating booking status to:", newStatus);

    // Update booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: newStatus,
        paidAt: newStatus === "PAYMENT_RECEIVED" ? new Date() : undefined,
        paymentMethod: "MIDTRANS",
      },
    });

    console.log("Booking updated successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// Midtrans sends GET request to verify endpoint exists
export async function GET() {
  return NextResponse.json({ status: "Webhook endpoint active" });
}