"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireAdmin } from "@/lib/auth";
import {
  createBooking,
  updateBookingStatus,
  cancelBooking,
} from "@/services/booking.service";
import { bookingSchema, bookingStatusUpdateSchema } from "@/lib/validations";
import type { BookingStatus, TripType } from "@prisma/client";
import type { ParticipantFormData } from "@/types";

export type BookingActionState = {
  error?: string;
  success?: boolean;
  bookingId?: string;
  bookingCode?: string;
};

export async function createBookingAction(data: {
  departureId: string;
  departureGroupId?: string;
  tripType: TripType;
  participants: ParticipantFormData[];
  notes?: string;
}): Promise<BookingActionState> {
  try {
    const user = await requireAuth();

    const booking = await createBooking({
      userId: user.id,
      departureId: data.departureId,
      departureGroupId: data.departureGroupId,
      tripType: data.tripType,
      participants: data.participants,
      notes: data.notes,
    });

    revalidatePath("/dashboard/bookings");

    return {
      success: true,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to create booking" };
  }
}

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
