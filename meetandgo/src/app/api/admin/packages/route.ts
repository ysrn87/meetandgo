import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createPackage } from "@/services/package.service";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = await request.json();
    const pkg = await createPackage(data);
    return NextResponse.json({ success: true, data: pkg });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create package";
    const status = message === "Forbidden" ? 403 : message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
