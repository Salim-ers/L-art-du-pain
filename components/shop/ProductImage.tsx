import Image from "next/image";

/** Photo produit, ou — tant qu'aucune photo n'est ajoutée depuis l'admin — un aplat éditorial au nom de la création. */
export function ProductImage({ src, alt, sizes, priority, tone = "light" }: { src: string | null; alt: string; sizes: string; priority?: boolean; tone?: "light" | "dark" }) {
  if (!src) {
    return (
      <div className={"pimg-ph pimg-ph--" + tone} role="img" aria-label={alt}>
        <span className="pimg-ph-mark" aria-hidden="true">L’Art du Pain</span>
        <span className="pimg-ph-name">{alt}</span>
      </div>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="media-img" style={{ objectFit: "cover" }} />;
}
