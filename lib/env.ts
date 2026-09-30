/** Variables d'environnement serveur. Aucune n'est exposée au navigateur (pas de préfixe NEXT_PUBLIC_). */
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

export const env = {
  isProd: process.env.NODE_ENV === "production",
  databaseUrl,
  // Connexion directe (hors pooler) pour les migrations — fournie par l'intégration Neon de Vercel.
  databaseDirectUrl: process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || null,
  // Sur Vercel sans base configurée : base temporaire, commande en ligne fermée.
  ephemeralDb: !databaseUrl && !!process.env.VERCEL,
  // Connexions par instance : petites valeurs recommandées en serverless (le pooler Neon mutualise).
  dbPoolMax: Math.max(1, Number(process.env.DB_POOL_MAX) || 3),
  localDbDir: process.env.LOCAL_DB_DIR || ".data/pglite",
  siteUrl: (process.env.SITE_URL || (vercelUrl ? "https://" + vercelUrl : "http://localhost:3000")).replace(/\/$/, ""),
  authSecret: process.env.AUTH_SECRET || null,
  stripeSecret: process.env.STRIPE_SECRET_KEY || null,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
  resendKey: process.env.RESEND_API_KEY || null,
  emailFrom: process.env.EMAIL_FROM || "L’Art du Pain <commandes@lartdupain-nogent.fr>",
  staffEmail: process.env.STAFF_EMAIL || null,
  smsWebhookUrl: process.env.SMS_WEBHOOK_URL || null,
  whatsappWebhookUrl: process.env.WHATSAPP_WEBHOOK_URL || null,
};

/**
 * Clé de signature des sessions admin : AUTH_SECRET si fourni, sinon dérivée de l'URL de la base
 * (valeur secrète, déjà présente sur Vercel) — aucune variable supplémentaire à créer.
 */
export async function authSecret(): Promise<Uint8Array> {
  const s = env.authSecret;
  if (s && s.length >= 32) return new TextEncoder().encode(s);
  if (env.databaseUrl) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("adp-session-v1:" + env.databaseUrl));
    return new Uint8Array(digest);
  }
  if (env.isProd) throw new Error("Ni AUTH_SECRET ni base de données : connexion admin impossible.");
  return new TextEncoder().encode("dev-only-secret-do-not-use-in-production-000");
}

/** La connexion admin est possible (clé de session disponible). */
export const canSignSessions = () => !env.isProd || !!env.databaseUrl || (!!env.authSecret && env.authSecret.length >= 32);
