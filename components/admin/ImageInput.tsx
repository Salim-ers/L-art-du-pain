"use client";

import { useState } from "react";
import { resizeImage } from "@/lib/resize-image";

/** Champ fichier qui compresse les photos avant l'envoi du formulaire. */
export function ImageInput({ name, multiple, required, max = 6 }: { name: string; multiple?: boolean; required?: boolean; max?: number }) {
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  return (
    <>
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        required={required}
        onChange={async (e) => {
          const input = e.currentTarget;
          const picked = [...(input.files ?? [])].slice(0, max);
          if (!picked.length) return setInfo(null);
          setBusy(true);
          const out = await Promise.all(picked.map((f) => resizeImage(f)));
          const dt = new DataTransfer();
          out.forEach((f) => dt.items.add(f));
          input.files = dt.files;
          const total = out.reduce((t, f) => t + f.size, 0);
          setInfo(`${out.length} image(s) prête(s) — ${(total / 1024 / 1024).toFixed(1)} Mo${picked.length < (e.target.files?.length ?? 0) ? ` (${max} max. par envoi)` : ""}`);
          setBusy(false);
        }}
      />
      {(busy || info) && <small className="amuted">{busy ? "Compression…" : info}</small>}
    </>
  );
}
