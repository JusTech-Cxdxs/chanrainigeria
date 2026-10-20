import type { SpecField } from "@/db/schema";
import { formatSpec, specValue } from "@/lib/format";

export function SpecTable({
  fields,
  specs,
  verified,
}: {
  fields: SpecField[];
  specs: Record<string, string | number>;
  verified: boolean;
}) {
  const rows = fields.filter((f) => specs[f.key] !== undefined && specs[f.key] !== "");
  // Specs not described by the family's field list still show, labelled by key.
  const extra = Object.keys(specs).filter((k) => !fields.some((f) => f.key === k));
  if (!rows.length && !extra.length) {
    return <p className="text-ink-soft">Specifications are available on request from our sales team.</p>;
  }
  return (
    <div>
      <table className="w-full border-collapse text-[0.95rem]">
        <tbody>
          {rows.map((f) => (
            <tr key={f.key} className="border-b border-line-soft">
              <th scope="row" className="py-2 pr-4 text-left font-normal text-ink-soft">
                {f.label}
              </th>
              <td className="num py-2 text-right font-semibold">
                {specValue(specs[f.key], f.unit)}
              </td>
            </tr>
          ))}
          {extra.map((k) => (
            <tr key={k} className="border-b border-line-soft">
              <th scope="row" className="py-2 pr-4 text-left font-normal text-ink-soft">
                {k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
              </th>
              <td className="num py-2 text-right font-semibold">{formatSpec(specs[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!verified ? (
        <p className="mt-3 text-sm text-ink-soft">
          Figures are indicative and can vary by configuration. Our sales team will confirm them for your quote.
        </p>
      ) : null}
    </div>
  );
}
