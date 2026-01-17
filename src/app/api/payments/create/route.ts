import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { snap } from "@/lib/midtrans";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await request.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        departure: {
          include: { tourPackage: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json({ error: "Booking is not pending payment" }, { status: 400 });
    }

    const transactionDetails = {
      order_id: `MNG-${booking.bookingCode}-${Date.now()}`,
      gross_amount: Number(booking.totalAmount),
    };

    const customerDetails = {
      first_name: booking.user.name,
      email: booking.user.email || undefined,
      phone: booking.user.phone || undefined,
    };

    const itemDetails = [
      {
        id: booking.departure.tourPackage.id,
        price: Number(booking.totalAmount),
        quantity: 1,
        name: booking.departure.tourPackage.title.substring(0, 50),
      },
    ];

    const parameter = {
      transaction_details: transactionDetails,
      customer_details: customerDetails,
      item_details: itemDetails,
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${booking.id}?payment=success`,
        error: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${booking.id}?payment=error`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${booking.id}?payment=pending`,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentToken: transaction.token,
        paymentUrl: transaction.redirect_url,
        paymentMethod: "MIDTRANS",
      },
    });

    return NextResponse.json({
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}