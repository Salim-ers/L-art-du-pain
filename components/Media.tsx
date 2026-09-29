import Image from "next/image";

type MediaProps = {
  src: string | null;
  alt: string;
  placeholder?: string;
  sizes?: string;
  priority?: boolean;
  dark?: boolean;
  fit?: "cover" | "contain";
};

/** Real photo via next/image, or a clearly-labelled placeholder when no asset is provided yet. */
export function Media({ src, alt, placeholder, sizes = "100vw", priority, dark, fit = "cover" }: MediaProps) {
  if (!src) {
    return (
      <div className={"ph" + (dark ? " ph--dark" : "")} role="img" aria-label={placeholder ?? alt}>
        <span>{placeholder ?? alt}</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className="media-img"
      style={{ objectFit: fit }}
    />
  );
}
