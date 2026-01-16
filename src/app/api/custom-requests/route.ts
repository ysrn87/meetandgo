import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCustomRequest } from "@/services";
import { customRequestSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = customRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid data", issues: result.error.issues }, { status: 400 });
    }

    const customRequest = await createCustomRequest({
      userId: session.user.id,
      ...result.data,
    });

    return NextResponse.json({ success: true, data: customRequest }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
