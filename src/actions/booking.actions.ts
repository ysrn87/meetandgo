"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireAdmin } from "@/lib/auth";
import {
  updateBookingStatus,
  cancelBooking,
} from "@/services/booking.service";
import { bookingStatusUpdateSchema } from "@/lib/validations";
import type { BookingStatus } from "@prisma/client";

export type BookingActionState = {
  error?: string;
  success?: boolean;
  bookingId?: string;
  bookingCode?: string;
};

// Note: createBooking is handled via API route /api/bookings
// because it needs to handle participant creation inline

export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatus
): Promise<BookingActionState> {
  try {
    await requireAdmin();

    const validated = bookingStatusUpdateSchema.safeParse({ status });

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    await updateBookingStatus(bookingId, validated.data.status);

    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${bookingId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update booking status" };
  }
}

export async function cancelBookingAction(
  bookingId: string
): Promise<BookingActionState> {
  try {
    const user = await requireAuth();

    await cancelBooking(bookingId, user.id);

    revalidatePath("/dashboard/bookings");
    revalidatePath(`/dashboard/bookings/${bookingId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to cancel booking" };
  }
}

export async function adminCancelBookingAction(
  bookingId: string
): Promise<BookingActionState> {
  try {
    await requireAdmin();

    await cancelBooking(bookingId);

    revalidatePath("/admin/bookings");
    revalidatePath(`/admin/bookings/${bookingId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to cancel booking" };
  }
}
