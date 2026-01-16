import { NextResponse } from "next/server";
import { getPackageBySlug } from "@/services/package.service";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const pkg = await getPackageBySlug(slug);
    
    if (!pkg) {
      return NextResponse.json({ success: false, error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: pkg });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch package" }, { status: 500 });
  }
}
