# L’Art du Pain — site, commande en ligne et gestion

Boulangerie • Pâtisserie artisanale — 28 Avenue Saint-Exupéry, 60180 Nogent-sur-Oise.

Une seule application Next.js :

- **Site vitrine premium** (identité d’origine conservée) + **catalogue**, **panier**, **Click & Collect** avec créneaux, **paiement Stripe** (CB, Apple Pay, Google Pay) ou sur place ;
- **gâteaux sur mesure** (configurateur 10 étapes, photo d’inspiration, devis ou acompte 30/50/100 %) ;
- **campagnes saisonnières** (Noël, Épiphanie, Pâques, Ramadan, Aïd…) avec fenêtre de précommande, dates de retrait et quota « Complet » ;
- **back-office `/admin`** : tableau de bord du jour, commandes, planning de production imprimable, clients (CRM), produits, catégories, stock, commandes personnalisées, événements, promotions, messages, statistiques, galerie, paramètres, équipe et rôles.

Stack : Next.js 14 (App Router) · TypeScript · CSS natif (la direction artistique d’origine) · PostgreSQL (Neon, offre gratuite) via Drizzle ORM · Stripe · Resend · Zod.

## Démarrer en local (aucun compte externe nécessaire)

```bash
npm install
npm run dev          # http://localhost:3000
```

Sans `DATABASE_URL`, une vraie base PostgreSQL embarquée (PGlite) est créée dans `.data/pglite`, migrée et remplie d’un **catalogue de démonstration**.
Administration : http://localhost:3000/admin — `admin@lartdupain.local` / `boulangerie-dev` (compte local uniquement).

Sans Stripe configuré, seul le paiement en boutique est proposé. Sans Resend, les emails sont journalisés (visibles dans `/admin/messages`) mais non expédiés.

`npm run db:reset-local` repart d’une base locale vierge.

> ⚠️ **Le catalogue, les prix et les dates de campagne sont des exemples.** Vérifiez-les et remplacez-les depuis `/admin` avant la mise en ligne.

## Mise en production (Vercel + Neon, gratuit)

1. **Base de données** : dans Vercel → le projet → **Storage** → **Create Database** → **Neon** → offre **Free** → région Europe (Frankfurt) → *Connect* au projet.
   Vercel ajoute seul `DATABASE_URL` et `DATABASE_URL_UNPOOLED`. Offre gratuite Neon : 0,5 Go, sans carte bancaire, largement suffisant (les photos, compressées, sont stockées dans la base).
2. **Variables** (Vercel → *Settings → Environment Variables*) : `AUTH_SECRET` (32 caractères minimum), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, et plus tard `SITE_URL` / `NEXT_PUBLIC_SITE_URL` avec le nom de domaine.
3. **Redéployer** (*Deployments* → ⋯ → *Redeploy*). Au premier démarrage, les tables sont créées, le **Row Level Security** activé, les données initiales et le compte super administrateur insérés — aucune commande à lancer.
4. **Stripe** (facultatif) : `STRIPE_SECRET_KEY` + webhook vers `https://<domaine>/api/stripe/webhook` (événements `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`) → `STRIPE_WEBHOOK_SECRET`. Sans Stripe : paiement en boutique uniquement.
5. **Emails** (facultatif) : Resend (offre gratuite 3 000 emails/mois) → `RESEND_API_KEY`, `EMAIL_FROM`.

Sans base connectée, le site reste visible (base temporaire) mais la commande en ligne, les demandes sur mesure et le formulaire de contact sont fermés, et l’administration l’indique en rouge.

`npm run db:migrate` reste disponible pour migrer une base à la main.

Modifier le schéma : éditer `lib/db/schema.ts` puis `npm run db:generate` et `npm run db:migrate`.

## Sécurité

- Secrets uniquement côté serveur (aucune variable `NEXT_PUBLIC_` sensible) ; la base n’est jamais interrogée depuis le navigateur.
- Admin : mot de passe bcrypt, session JWT signée en cookie `httpOnly` / `SameSite=Lax`, relue en base à chaque requête (compte désactivé ou sessions révoquées = déconnexion immédiate), middleware sur `/admin`.
- Rôles : **SUPER_ADMIN** (tout, y compris les administrateurs), **ADMIN** (prix, produits, campagnes, promotions, paiements, paramètres, équipe), **STAFF** (commandes, planning, clients, stock, messages). Chaque action serveur revérifie le rôle.
- Toutes les entrées revalidées avec Zod côté serveur ; prix, stock, créneaux, quotas et promotions **recalculés côté serveur** dans une transaction (verrous sur créneau, stock et campagne).
- Server Actions (protection d’origine intégrée à Next.js = CSRF), limitation de débit (connexion, commande, contact, sur-mesure), pot de miel anti-robots.
- Uploads : compressés dans le navigateur (≤ 2000 px, WebP), type vérifié par signature binaire (JPG/PNG/WEBP), 4 Mo max. ; stockés en base, photos clients **privées**, servies uniquement à l’équipe connectée.
- En-têtes : CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy. Journal d’audit (`audit_logs`) des actions sensibles et des connexions.
- Webhook Stripe à signature vérifiée ; paiements idempotents ; paiements abandonnés libérés automatiquement (créneau + stock) après 45 min.

La limitation de débit est en mémoire (suffisant pour une boutique) ; pour plusieurs instances, brancher un store partagé (ex. Upstash Redis) dans `lib/security.ts`.

## SEO local

- Pages ciblées sans bourrage de mots-clés : `/nous-trouver` (boulangerie Nogent-sur-Oise, près de Creil), `/commander` et `/commander/<catégorie>` (Click & Collect, viennoiserie, pâtisserie…), `/gateaux-sur-mesure` (gâteau anniversaire / personnalisé), `/noel` (bûche de Noël).
- Schema.org : `Bakery` (adresse, téléphone, horaires, zone desservie, action de commande), `Organization`, `Product` / `Offer` / `AggregateOffer`, `ItemList`, `BreadcrumbList`, `FAQPage`.
- Section « Boulangerie pâtisserie à Nogent-sur-Oise » + communes proches (Creil, Montataire, Villers-Saint-Paul, Monchy-Saint-Éloi) dans un seul bloc utile, pas de pages clonées.
- Boutons Google Maps, itinéraire, **Waze**, appeler, commander, laisser un avis.

**NAP** : le nom, l’adresse et le téléphone (`content/site.ts`) doivent rester **strictement identiques** à la fiche Google Business Profile. À faire hors site :
- renseigner `geo` (coordonnées GPS exactes) dans `content/site.ts` → pin exact sur la carte, Waze et Schema.org ;
- coller le lien « Laisser un avis » de la fiche Google dans `/admin/parametres` ;
- **vérifier la fiche Waze** : point bien placé, catégorie *Bakery*, nom et adresse exacts, horaires, téléphone ;
- vérifier que les horaires de `content/site.ts` (Schema.org) et de `/admin/parametres` (créneaux) correspondent à Google.

## Contenus

| Quoi | Où |
|---|---|
| Produits, prix, formats, allergènes, photos, stock | `/admin/produits`, `/admin/stock` |
| Catégories (textes SEO inclus) | `/admin/categories` |
| Noël et autres campagnes | `/admin/evenements` (raccourci `/admin/noel`) |
| Horaires, créneaux, capacité, fermetures | `/admin/parametres`, `/admin/planning` |
| Options du configurateur de gâteaux | `/admin/parametres` |
| Avis Google (de vrais avis uniquement) | `/admin/parametres` |
| Galerie | `/admin/galerie` |
| Textes éditoriaux, NAP, navigation | `content/site.ts`, `content/faq.ts` |
| Mentions légales, CGV (SIRET, médiateur) | `content/site.ts` → `legal`, `app/(site)/cgv` |

## Structure

```
app/(site)/          site public (accueil, catalogue, produit, panier, commande, suivi, sur-mesure, noël, événements…)
app/(site)/actions.ts  Server Actions publiques (panier, créneaux, commande, contact)
app/admin/           back-office (login, tableau de bord, …) + actions.ts
app/api/stripe/webhook  webhook Stripe      app/api/files  photos privées (équipe)
components/          composants du site (identité d’origine) + shop/ + admin/
lib/db/              schéma Drizzle, connexion (Postgres / PGlite), données initiales
lib/orders.ts        création de commande, paiement, statuts      lib/custom.ts  gâteaux sur mesure
lib/slots.ts         créneaux de retrait      lib/catalog.ts  catalogue public      lib/admin.ts  requêtes back-office
lib/notify.ts        emails / SMS / WhatsApp / tableau de bord      lib/stripe.ts · lib/storage.ts · lib/security.ts
drizzle/             migrations SQL (dont RLS)
```

## Évolutions préparées

Codes promo (déjà actifs), notifications SMS / WhatsApp (webhook fournisseur), acomptes, multi-rôles, journal d’audit. Le schéma accepte sans refonte : fidélité, cartes cadeaux, livraison, ticket cuisine, facturation, multi-boutiques.
