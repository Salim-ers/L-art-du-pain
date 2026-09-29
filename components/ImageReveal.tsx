import type { Img } from "@/content/site";
import { Reveal } from "./Reveal";
import { Parallax } from "./Parallax";
import { Media } from "./Media";

type Props = { image: Img; ratio: string; speed?: number; sizes?: string; dark?: boolean; delay?: number; className?: string };

/** Photograph revealed by a vertical clip mask, with optional soft parallax. */
export function ImageReveal({ image, ratio, speed, sizes, dark, delay, className = "" }: Props) {
  const media = <Media src={image.src} alt={image.alt} placeholder={image.placeholder} sizes={sizes} dark={dark} />;
  return (
    <Reveal kind="mask" delay={delay} className={"frame " + className} style={{ aspectRatio: ratio }}>
      {speed ? <Parallax speed={speed}>{media}</Parallax> : media}
    </Reveal>
  );
}
