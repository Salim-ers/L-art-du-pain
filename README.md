# L’Art du Pain — site vitrine

Next.js 14 (App Router) · React 18 · TypeScript · CSS natif. Aucune dépendance d’animation : tout est fait en CSS + une seule boucle `requestAnimationFrame` partagée (60 fps, GPU).

## Démarrer

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # vérifie le build de production
```

## Déployer sur Vercel

1. Poussez ce dossier sur un dépôt GitHub.
2. Sur vercel.com → **Add New Project** → importez le dépôt. Vercel détecte Next.js tout seul, aucun réglage.
3. Ajoutez votre nom de domaine dans *Settings → Domains*.
4. **Important :** mettez ce même domaine dans `content/site.ts` → `url` (canonical, sitemap, OpenGraph, Schema.org).

## Modifier le contenu

**Tout est dans `content/site.ts`** — textes, téléphone, horaires, catégories, création signature, galerie, avis, réseaux sociaux.

Règle : une valeur `null` ou un tableau vide = l’élément n’est pas affiché. Rien d’inventé n’est publié.

| Pour… | Faire |
|---|---|
| Ajouter Instagram | `social.instagram: "https://www.instagram.com/…"` |
| Pin exact sur la carte | `geo: { lat: 49.xxx, lng: 2.xxx }` |
| Vidéo dans le hero | déposer `public/video/hero.mp4` puis `hero.video: "/video/hero.mp4"` (mp4 H.264, 1920×1080, 8–12 s, muet, < 6 Mo) |
| Photos du savoir-faire | déposer dans `public/images/` puis renseigner `craft.steps[i].image.src` |
| Photo de la séquence immersive | `immersive.image.src` |
| Afficher des avis | remplir `reviews` avec de **vrais** avis Google |
| Mentions légales | `legal.publisher`, `legal.siret` |

Les photos `pains.png`, `viennoiseries.png` et `patisseries-vitrine.png` sont en basse définition (~370 px) : remplacez-les par les originaux en gardant le même nom de fichier.

## Structure

```
app/
  layout.tsx          polices (next/font), métadonnées SEO, OpenGraph
  page.tsx            assemblage de la page + JSON-LD Bakery
  globals.css         toute la direction artistique
  sitemap.ts · robots.ts
  mentions-legales/ · confidentialite/
components/
  Intro · Header · MobileMenu · Hero · Manifesto · Editorial
  Creations · ProductCategory · SignatureProduct · Marquee
  CraftSection · ImmersiveSequence · Breath · Gallery · Reviews
  Location · Footer
  Reveal (masques au scroll) · Parallax · ImageReveal · Media
  SectionLabel · EditorialHeading · AnimatedLink · MagneticButton
content/site.ts       ← toutes les données
lib/scroll.ts         boucle rAF partagée
lib/schema.ts         Schema.org (n’émet que les champs renseignés)
public/images/        photos + logo
```

## Accessibilité & performance

- `prefers-reduced-motion` : intro, parallaxe et animations désactivées, séquence immersive affichée en statique.
- Intro jouée une seule fois par session.
- Images servies en AVIF/WebP via `next/image`, hero en `priority`, le reste en lazy.
- Navigation clavier, focus visibles, menu mobile fermable avec Échap, galerie pilotable aux flèches.
