/** Variables d'environnement serveur. Aucune n'est exposée au navigateur (pas de préfixe NEXT_PUBLIC_). */
export const env = {
  isProd: process.env.NODE_ENV === "production",
  databaseUrl: process.env.DATABASE_URL || null,
  localDbDir: process.env.LOCAL_DB_DIR || ".data/pglite",
  siteUrl: (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  authSecret: process.env.AUTH_SECRET || null,
  stripeSecret: process.env.STRIPE_SECRET_KEY || null,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
  resendKey: process.env.RESEND_API_KEY || null,
  emailFrom: process.env.EMAIL_FROM || "L’Art du Pain <commandes@lartdupain-nogent.fr>",
  staffEmail: process.env.STAFF_EMAIL || null,
  supabaseUrl: process.env.SUPABASE_URL?.replace(/\/$/, "") || null,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || null,
  publicBucket: process.env.SUPABASE_PUBLIC_BUCKET || "media",
  privateBucket: process.env.SUPABASE_PRIVATE_BUCKET || "private",
  smsWebhookUrl: process.env.SMS_WEBHOOK_URL || null,
  whatsappWebhookUrl: process.env.WHATSAPP_WEBHOOK_URL || null,
};

export function authSecret(): Uint8Array {
  const s = env.authSecret;
  if (!s || s.length < 32) {
    if (env.isProd) throw new Error("AUTH_SECRET manquant ou trop court (32 caractères minimum).");
    return new TextEncoder().encode("dev-only-secret-do-not-use-in-production-000");
  }
  return new TextEncoder().encode(s);
}
