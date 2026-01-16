"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createPackage,
  updatePackage,
  deletePackage,
  addDeparture,
  togglePackageStatus,
} from "@/services/package.service";
import type { TourPackageFormData, DepartureFormData } from "@/types";

export type PackageActionState = {
  error?: string;
  success?: boolean;
  packageId?: string;
  slug?: string;
};

export async function createPackageAction(
  data: TourPackageFormData
): Promise<PackageActionState> {
  try {
    await requireAdmin();

    const pkg = await createPackage(data);

    revalidatePath("/admin/packages");
    revalidatePath("/packages");

    return {
      success: true,
      packageId: pkg.id,
      slug: pkg.slug,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to create package" };
  }
}

export async function updatePackageAction(
  id: string,
  data: Partial<TourPackageFormData>
): Promise<PackageActionState> {
  try {
    await requireAdmin();

    const pkg = await updatePackage(id, data);

    revalidatePath("/admin/packages");
    revalidatePath(`/admin/packages/${id}/edit`);
    revalidatePath(`/packages/${pkg.slug}`);
    revalidatePath("/packages");

    return {
      success: true,
      packageId: pkg.id,
      slug: pkg.slug,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update package" };
  }
}

export async function deletePackageAction(
  id: string
): Promise<PackageActionState> {
  try {
    await requireAdmin();

    await deletePackage(id);

    revalidatePath("/admin/packages");
    revalidatePath("/packages");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to delete package" };
  }
}

export async function addDepartureAction(
  packageId: string,
  data: DepartureFormData
): Promise<PackageActionState> {
  try {
    await requireAdmin();

    await addDeparture(packageId, {
      departureDate: data.departureDate,
      pricePerPerson: data.pricePerPerson,
      maxParticipants: data.maxParticipants,
      groups: data.groups,
    });

    revalidatePath("/admin/packages");
    revalidatePath(`/admin/packages/${packageId}/edit`);
    revalidatePath("/packages");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to add departure" };
  }
}

export async function togglePackageStatusAction(
  id: string,
  isActive: boolean
): Promise<PackageActionState> {
  try {
    await requireAdmin();

    await togglePackageStatus(id, isActive);

    revalidatePath("/admin/packages");
    revalidatePath("/packages");

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update package status" };
  }
}
