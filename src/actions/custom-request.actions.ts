"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireAdmin } from "@/lib/auth";
import {
  createCustomRequest,
  updateCustomRequestStatus,
  cancelCustomRequest,
} from "@/services/custom-request.service";
import {
  customRequestSchema,
  customRequestStatusUpdateSchema,
} from "@/lib/validations";
import type { CustomRequestStatus } from "@prisma/client";

export type CustomRequestActionState = {
  error?: string;
  success?: boolean;
  requestId?: string;
  requestCode?: string;
};

export async function createCustomRequestAction(
  prevState: CustomRequestActionState,
  formData: FormData
): Promise<CustomRequestActionState> {
  try {
    const user = await requireAuth();

    const data = {
      destination: formData.get("destination") as string,
      duration: formData.get("duration") as string,
      departureDate: formData.get("departureDate") as string,
      meetingPoint: formData.get("meetingPoint") as string,
      participantCount: parseInt(formData.get("participantCount") as string, 10),
      notes: formData.get("notes") as string,
    };

    const validated = customRequestSchema.safeParse(data);

    if (!validated.success) {
      return { error: validated.error.errors[0].message };
    }

    const request = await createCustomRequest({
      userId: user.id,
      ...validated.data,
    });

    revalidatePath("/dashboard/custom-requests");

    return {
      success: true,
      requestId: request.id,
      requestCode: request.requestCode,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to submit custom request" };
  }
}

export async function updateCustomRequestStatusAction(
  requestId: string,
  data: {
    status: CustomRequestStatus;
    estimatedPrice?: number;
    finalPrice?: number;
    tourGuideId?: string;
    adminNotes?: string;
  }
): Promise<CustomRequestActionState> {
  try {
    await requireAdmin();

    await updateCustomRequestStatus(requestId, data);

    revalidatePath("/admin/custom-requests");
    revalidatePath(`/admin/custom-requests/${requestId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update request status" };
  }
}

export async function cancelCustomRequestAction(
  requestId: string
): Promise<CustomRequestActionState> {
  try {
    const user = await requireAuth();

    await cancelCustomRequest(requestId, user.id);

    revalidatePath("/dashboard/custom-requests");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to cancel request" };
  }
}
