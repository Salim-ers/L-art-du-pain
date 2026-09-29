import "server-only";
/**
 * Stockage des images.
 * - Supabase Storage si SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY : bucket public (catalogue, galerie) et bucket privé (photos clients).
 * - Sinon (développement) : public/uploads et .data/private.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

const MAX_BYTES = 8 * 1024 * 1024;
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

const name = (folder: string, ext: string) =>
  `${folder.replace(/[^a-z0-9-]/gi, "")}/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;

const supabase = () => (env.supabaseUrl && env.supabaseServiceKey ? { url: env.supabaseUrl, key: env.supabaseServiceKey } : null);

async function supaUpload(bucket: string, key: string, buf: Uint8Array, mime: string) {
  const sb = supabase()!;
  const res = await fetch(`${sb.url}/storage/v1/object/${bucket}/${key}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sb.key}`, "Content-Type": mime, "x-upsert": "false", "cache-control": "31536000" },
    body: Buffer.from(buf),
  });
  if (!res.ok) throw new UploadError("Envoi de l’image impossible (" + res.status + ").");
}

/** Image publique (produit, galerie, campagne) → URL affichable. */
export async function savePublicImage(img: NonNullable<Awaited<ReturnType<typeof readImage>>>, folder: string) {
  const key = name(folder, img.ext);
  if (supabase()) {
    await supaUpload(env.publicBucket, key, img.buf, img.mime);
    return `${env.supabaseUrl}/storage/v1/object/public/${env.publicBucket}/${key}`;
  }
  if (env.isProd && process.env.VERCEL) throw new UploadError("Stockage non configuré (Supabase Storage requis en production).");
  const file = path.join(process.cwd(), "public", "uploads", key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, img.buf);
  return "/uploads/" + key;
}

/** Image privée (photo d'inspiration client) → clé interne, lisible uniquement depuis l'admin. */
export async function savePrivateImage(img: NonNullable<Awaited<ReturnType<typeof readImage>>>, folder: string) {
  const key = name(folder, img.ext);
  if (supabase()) {
    await supaUpload(env.privateBucket, key, img.buf, img.mime);
    return "sb:" + key;
  }
  if (env.isProd && process.env.VERCEL) throw new UploadError("Stockage non configuré (Supabase Storage requis en production).");
  const file = path.join(process.cwd(), ".data", "private", key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, img.buf);
  return "local:" + key;
}

/** Lecture d'une image privée : URL signée (Supabase) ou contenu local. */
export async function openPrivate(ref: string): Promise<{ redirect: string } | { body: Buffer; mime: string } | null> {
  if (ref.startsWith("sb:")) {
    const sb = supabase();
    if (!sb) return null;
    const key = ref.slice(3);
    const res = await fetch(`${sb.url}/storage/v1/object/sign/${env.privateBucket}/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sb.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: 300 }),
    });
    if (!res.ok) return null;
    const { signedURL } = (await res.json()) as { signedURL: string };
    return { redirect: `${sb.url}/storage/v1${signedURL}` };
  }
  if (ref.startsWith("local:")) {
    const key = ref.slice(6);
    if (key.includes("..")) return null;
    try {
      const body = await readFile(path.join(process.cwd(), ".data", "private", key));
      const ext = key.split(".").pop();
      return { body, mime: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg" };
    } catch {
      return null;
    }
  }
  return null;
}
