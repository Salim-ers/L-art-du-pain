import "server-only";
/**
 * Stockage des images directement dans PostgreSQL (table `files`) : aucun service externe à payer ni à configurer.
 * - Images publiques (produits, galerie, campagnes) : servies par /api/img/<id>, mises en cache par le CDN.
 * - Images privées (photos d'inspiration des clients) : servies par /api/files, réservé à l'équipe connectée.
 */
import { and, eq } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";

// Vercel limite le corps d'une requête à 4,5 Mo : les images sont compressées dans le navigateur avant l'envoi.
const MAX_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp";

type Sniffed = { ext: "jpg" | "png" | "webp"; mime: string };

/** Type réel du fichier d'après sa signature binaire (l'extension et le type MIME envoyés ne sont pas fiables). */
function sniff(b: Uint8Array): Sniffed | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png" };
  const riff = String.fromCharCode(...b.slice(0, 4));
  const webp = String.fromCharCode(...b.slice(8, 12));
  if (riff === "RIFF" && webp === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

export class UploadError extends Error {}

export async function readImage(file: unknown, maxBytes = MAX_BYTES) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > maxBytes) throw new UploadError(`Image trop lourde (${Math.round(maxBytes / 1024 / 1024)} Mo maximum).`);
  const buf = new Uint8Array(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) throw new UploadError("Format non accepté : JPG, PNG ou WEBP uniquement.");
  return { buf, ...type };
}

type Img = NonNullable<Awaited<ReturnType<typeof readImage>>>;

async function store(img: Img, isPublic: boolean) {
  const db = await getDb();
  const [row] = await db
    .insert(s.files)
    .values({ mime: img.mime, size: img.buf.byteLength, isPublic, data: Buffer.from(img.buf) })
    .returning({ id: s.files.id });
  return row.id;
}

/** Image publique (produit, galerie, campagne) → URL affichable. */
export async function savePublicImage(img: Img, _folder: string) {
  return "/api/img/" + (await store(img, true));
}

/** Image privée (photo d'inspiration client) → référence interne, lisible uniquement depuis l'admin. */
export async function savePrivateImage(img: Img, _folder: string) {
  return "db:" + (await store(img, false));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function readFile(id: string, publicOnly: boolean) {
  if (!UUID.test(id)) return null;
  const db = await getDb();
  const [f] = await db
    .select()
    .from(s.files)
    .where(and(eq(s.files.id, id), publicOnly ? eq(s.files.isPublic, true) : undefined));
  return f ? { body: f.data, mime: f.mime } : null;
}

/** Lecture d'une image privée à partir de sa référence. */
export async function openPrivate(ref: string) {
  return ref.startsWith("db:") ? readFile(ref.slice(3), false) : null;
}
