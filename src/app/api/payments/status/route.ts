import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { BookingStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // If already paid, return current status
    if (booking.status !== "PENDING") {
      return NextResponse.json({
        status: booking.status,
        message: "Booking already processed",
      });
    }

    // Check with Midtrans if we have a payment token
    if (booking.paymentToken) {
      try {
        const orderId = `MNG-${booking.bookingCode}`;
        const serverKey = process.env.MIDTRANS_SERVER_KEY!;
        const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
        
        const baseUrl = isProduction
          ? "https://api.midtrans.com"
          : "https://api.sandbox.midtrans.com";

        // Call Midtrans API directly
        const response = await fetch(`${baseUrl}/v2/${orderId}/status`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(serverKey + ":").toString("base64")}`,
          },
        });

        if (!response.ok) {
          // Transaction might not exist yet
          return NextResponse.json({
            status: booking.status,
            message: "Payment status pending",
          });
        }

        const data = await response.json();
        const transactionStatus = data.transaction_status;
        const fraudStatus = data.fraud_status;

        let newStatus: BookingStatus = booking.status;

        // Determine new status based on Midtrans transaction status
        if (transactionStatus === "capture" || transactionStatus === "settlement") {
          if (fraudStatus === "accept" || !fraudStatus) {
            newStatus = "PAYMENT_RECEIVED";
          }
        } else if (transactionStatus === "pending") {
          newStatus = "PENDING";
        } else if (
          transactionStatus === "deny" ||
          transactionStatus === "expire" ||
          transactionStatus === "cancel"
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

        // Update booking if status changed
        if (newStatus !== booking.status) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: newStatus,
              paidAt: newStatus === "PAYMENT_RECEIVED" ? new Date() : undefined,
            },
          });
        }

        return NextResponse.json({
          status: newStatus,
          midtransStatus: transactionStatus,
        });
      } catch (midtransError) {
        console.error("Midtrans status check error:", midtransError);
        return NextResponse.json({
          status: booking.status,
          message: "Payment status pending",
        });
      }
    }

    return NextResponse.json({ status: booking.status });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json({ error: "Failed to check payment status" }, { status: 500 });
  }
}