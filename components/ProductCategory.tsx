import type { Img } from "@/content/site";
import { Media } from "./Media";

type Props = {
  index: number;
  title: string;
  image: Img;
  href: string;
  onEnter: () => void;
  onLeave: () => void;
};

/** One row of the collection index. Touch devices get an inline thumbnail instead of the cursor preview. */
export function ProductCategory({ index, title, image, href, onEnter, onLeave }: Props) {
  return (
    <a href={href} className="cat" onMouseEnter={onEnter} onMouseLeave={onLeave} onFocus={onEnter} onBlur={onLeave}>
      <span className="cat-main">
        <span className="cat-num">{String(index + 1).padStart(2, "0")}</span>
        <span className="cat-thumb" aria-hidden="true">
          <Media src={image.src} alt="" sizes="72px" />
        </span>
        <span className="cat-title">{title}</span>
      </span>
      <span className="cat-cta">
        Découvrir <span className="arrow" aria-hidden="true">→</span>
      </span>
    </a>
  );
}
