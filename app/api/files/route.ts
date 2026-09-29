import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { openPrivate } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Photos d'inspiration des clients : visibles uniquement par l'équipe connectée. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return new NextResponse("Non autorisé", { status: 401 });
  const ref = new URL(req.url).searchParams.get("ref") ?? "";
  const file = await openPrivate(ref);
  if (!file) return new NextResponse("Introuvable", { status: 404 });
  if ("redirect" in file) return NextResponse.redirect(file.redirect);
  return new NextResponse(new Uint8Array(file.body), {
    headers: { "Content-Type": file.mime, "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" },
  });
}
