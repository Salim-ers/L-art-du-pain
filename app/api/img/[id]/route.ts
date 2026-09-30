import { NextResponse } from "next/server";
import { readFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Images publiques (produits, galerie, campagnes). Contenu immuable : mis en cache un an par le navigateur et le CDN. */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const file = await readFile(params.id, true);
  if (!file) return new NextResponse("Introuvable", { status: 404 });
  return new NextResponse(new Uint8Array(file.body), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
