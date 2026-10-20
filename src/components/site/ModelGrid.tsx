"use client";
// Model cards with a quick-view dialog: specs, highlights and the enquiry actions. No prices.
import Link from "next/link";
import { useRef, useState } from "react";
import { Machine } from "@/components/Machine";
import type { SpecField } from "@/db/schema";
import { specValue } from "@/lib/format";
import { askEnyo } from "./enyo-events";

export type ModelCard = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  summary: string;
  highlights: string[];
  specs: Record<string, string | number>;
  specsVerified: boolean;
  images: string[];
  brochure: string | null;
  href: string;
};

export function ModelGrid({
  models,
  fields,
  illustration,
  familyName,
}: {
  models: ModelCard[];
  fields: SpecField[];
  illustration: string;
  familyName: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<ModelCard | null>(null);
  // Two headline figures on each card, taken from the first fields the model actually has.
  const headline = (m: ModelCard) => fields.filter((f) => m.specs[f.key] !== undefined).slice(0, 2);

  function open(m: ModelCard) {
    setActive(m);
    dialog.current?.showModal();
  }

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => open(m)}
              className="group grid h-full w-full gap-3 rounded-lg border border-line bg-surface p-5 text-left transition-colors hover:border-brand"
              aria-haspopup="dialog"
            >
              {m.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.images[0]} alt="" className="aspect-[12/7] w-full object-contain" />
              ) : (
                <Machine kind={illustration} className="w-full opacity-80" dimensions={false} />
              )}
              <span className="flex items-baseline justify-between gap-2">
                <span className="display text-2xl group-hover:text-brand">{m.name}</span>
                {m.brand ? <span className="text-sm text-ink-soft">{m.brand}</span> : null}
              </span>
              {headline(m).length ? (
                <dl className="grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
                  {headline(m).map((f) => (
                    <div key={f.key}>
                      <dt className="text-xs text-ink-soft">{f.label}</dt>
                      <dd className="num font-semibold">
                        {specValue(m.specs[f.key], f.unit)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <span className="text-sm text-ink-soft">{m.summary}</span>
              )}
              <span className="text-sm font-semibold text-brand">View details</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setActive(null)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto w-[min(48rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-lg border border-line bg-surface p-0 text-ink shadow-2xl"
        aria-labelledby="qv-title"
      >
        {active ? (
          <div className="grid gap-6 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-ink-soft">
                  {[active.brand, familyName].filter(Boolean).join(" ")}
                </p>
                <h2 id="qv-title" className="display text-3xl sm:text-4xl">
                  {active.name}
                </h2>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => dialog.current?.close()}>
                Close
              </button>
            </div>

            {active.images.length ? (
              <div className="flex snap-x gap-3 overflow-x-auto">
                {active.images.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt={active.name} className="aspect-[4/3] w-full max-w-md shrink-0 snap-start rounded object-cover" />
                ))}
              </div>
            ) : null}

            <p className="text-lg">{active.summary}</p>
            {active.highlights.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {active.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            ) : null}

            <div>
              <h3 className="heading text-lg">Specifications</h3>
              <table className="mt-2 w-full border-collapse text-[0.95rem]">
                <tbody>
                  {fields
                    .filter((f) => active.specs[f.key] !== undefined)
                    .map((f) => (
                      <tr key={f.key} className="border-b border-line-soft">
                        <th scope="row" className="py-2 pr-4 text-left font-normal text-ink-soft">
                          {f.label}
                        </th>
                        <td className="num py-2 text-right font-semibold">
                          {specValue(active.specs[f.key], f.unit)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!active.specsVerified ? (
                <p className="mt-2 text-sm text-ink-soft">
                  Figures are indicative and can vary by configuration. We confirm them with your quote.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3 border-t border-line pt-5">
              <Link href={`/contact?type=QUOTE&product=${active.slug}`} className="btn btn-primary">
                Ask for a quote
              </Link>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  dialog.current?.close();
                  askEnyo(`I'd like to know more about the ${[active.brand, active.name].filter(Boolean).join(" ")}.`);
                }}
              >
                Ask Enyo about it
              </button>
              {active.brochure ? (
                <a href={active.brochure} className="btn btn-outline" target="_blank" rel="noopener">
                  Download brochure
                </a>
              ) : null}
              <Link href={active.href} className="btn btn-quiet">
                Open full page
              </Link>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
