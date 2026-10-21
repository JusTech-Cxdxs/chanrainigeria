// Small helpers for page text from the content registry. Safe in client components.
import { Fragment, type ReactNode } from "react";

export type Vars = Record<string, string | number>;

/** Text for one page, already filled with {company}, {enyo} and the other site-wide words. */
export type Labels = Record<string, string>;

/** Swaps {name} for vars.name. Unknown names are left as written so a later step can fill them. */
export function fill(text: string, vars: Vars = {}) {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** Text with one {token} turned into a React node, e.g. "{privacy}" into a link. */
export function withNode(text: string, token: string, node: ReactNode) {
  const parts = text.split(`{${token}}`);
  return parts.map((p, i) => (
    <Fragment key={i}>
      {p}
      {i < parts.length - 1 ? node : null}
    </Fragment>
  ));
}
