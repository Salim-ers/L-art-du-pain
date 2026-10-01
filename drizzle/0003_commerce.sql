ALTER TABLE "categories" ADD COLUMN "click_collect" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_orders" ADD COLUMN "kind" text DEFAULT 'cake' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "min_quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Données d'exemple d'origine (produits, prix et campagnes non validés par la boutique) : marquées « démo », jamais supprimées.
-- Un élément déjà modifié depuis la gestion (updated_at différent de created_at) est considéré comme validé et n'est pas marqué.
UPDATE "products" SET "is_demo" = true
WHERE "updated_at" = "created_at" AND "slug" IN (
  'baguette-tradition', 'baguette', 'pain-complet', 'pain-aux-cereales', 'pain-de-campagne', 'croissant', 'pain-au-chocolat',
  'pain-aux-raisins', 'chausson-aux-pommes', 'religieuse-chocolat', 'eclair-chocolat', 'tarte-au-citron', 'mille-feuille', 'paris-brest',
  'entremets-individuel', 'entremets-chocolat', 'fraisier', 'tarte-aux-fruits-de-saison', 'sandwich-jambon-beurre', 'panini',
  'quiche-lorraine', 'pizza', 'formule-dejeuner', 'cookie', 'brownie', 'financier', 'ballotin-de-chocolats', 'buche-chocolat-praline',
  'buche-vanille-fruits-rouges', 'buche-pistache-griotte', 'buche-traditionnelle-cafe', 'galette-des-rois-frangipane'
);--> statement-breakpoint
UPDATE "events" SET "is_demo" = true WHERE "updated_at" = "created_at" AND "slug" IN ('noel', 'epiphanie');--> statement-breakpoint
-- Le site met en avant les commandes et précommandes (gâteaux, fêtes, sur mesure) : la commande en ligne des produits du quotidien
-- est désactivée par défaut, et se réactive par famille dans Gestion → Catégories.
UPDATE "categories" SET "click_collect" = false WHERE "slug" IN ('pains', 'viennoiseries', 'patisseries', 'sale', 'gourmandises');
