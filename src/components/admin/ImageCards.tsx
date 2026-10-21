"use client";
import { useState, useTransition } from "react";
import { setGallery, setImage, type ImageResult, type ImageTarget } from "@/app/admin/actions/images";
import { Icon } from "@/components/ui/Icon";
import { MediaPicker, MultiMediaPicker } from "./MediaPicker";

function Status({ pending, result }: { pending: boolean; result: ImageResult | null }) {
  if (pending)
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
        <Icon name="refresh" size={13} className="animate-spin" /> Saving…
      </span>
    );
  if (!result) return null;
  return (
    <span role="status" className={`inline-flex items-center gap-1.5 text-xs font-semibold ${result.ok ? "text-brand" : "text-danger"}`}>
      <Icon name={result.ok ? "check" : "alert"} size={13} /> {result.ok ? `${result.message}. The website is updated.` : result.message}
    </span>
  );
}

/** One picture with a fixed place on the site. Choosing a new one saves at once. */
export function ImageCard({
  target,
  title,
  where,
  size,
  value,
  originalUrl,
  folder,
  href,
}: {
  target: ImageTarget;
  title: string;
  where: string;
  size?: string;
  value: string;
  originalUrl?: string;
  folder: string;
  href?: string;
}) {
  const [v, setV] = useState(value);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ImageResult | null>(null);
  return (
    <li className="rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="text-[0.8125rem] text-ink-soft">
            {where}
            {size ? (
              <>
                {" "}
                · best at <span className="num">{size}</span> pixels
              </>
            ) : null}
          </p>
        </div>
        {href ? (
          <a href={href} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
            View <Icon name="external" size={13} />
          </a>
        ) : null}
      </div>
      <MediaPicker
        value={v}
        folder={folder}
        originalUrl={originalUrl}
        removable={!originalUrl}
        onChange={(next) => {
          setV(next);
          start(async () => {
            setResult(null);
            const r = await setImage(target, next);
            setResult(r);
            if (!r.ok) setV(v);
          });
        }}
      />
      <div className="mt-2 min-h-5">
        <Status pending={pending} result={result} />
      </div>
    </li>
  );
}

/** A model's photos: add, reorder, remove. Saves after each change. */
export function GalleryCard({ productId, title, where, ids, href }: { productId: string; title: string; where: string; ids: string[]; href?: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ImageResult | null>(null);
  return (
    <li className="rounded-xl border border-line bg-surface p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="text-[0.8125rem] text-ink-soft">{where}</p>
        </div>
        {href ? (
          <a href={href} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
            View <Icon name="external" size={13} />
          </a>
        ) : null}
      </div>
      <MultiMediaPicker
        defaultValue={ids}
        folder="Products"
        onChange={(next) =>
          start(async () => {
            setResult(null);
            setResult(await setGallery(productId, next));
          })
        }
      />
      <div className="mt-2 min-h-5">
        <Status pending={pending} result={result} />
      </div>
    </li>
  );
}
