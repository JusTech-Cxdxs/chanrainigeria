"use client";
// A select box you can type into. Built to the WAI-ARIA combobox pattern: the text box filters the list,
// up and down move through it, Enter picks, Escape closes, and a hidden input carries the value into the form.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export type SelectOption = { value: string; label: string; group?: string; hint?: string };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");

export function SearchableSelect({
  name,
  options,
  placeholder,
  defaultValue = "",
  required,
  invalid,
  labelledBy,
  describedBy,
  id,
  searchPlaceholder = "Type to search",
  noMatches = "Nothing matches. Try another word.",
  clearLabel = "Clear choice",
  onChange,
}: {
  name: string;
  options: SelectOption[];
  /** Shown until something is picked, e.g. "Choose a product" */
  placeholder: string;
  defaultValue?: string;
  required?: boolean;
  invalid?: boolean;
  /** id of the visible label */
  labelledBy?: string;
  /** id of the help or error text */
  describedBy?: string;
  id?: string;
  searchPlaceholder?: string;
  noMatches?: string;
  clearLabel?: string;
  onChange?: (value: string) => void;
}) {
  const auto = useId();
  const baseId = id ?? `ss-${auto.replace(/:/g, "")}`;
  const listId = `${baseId}-list`;
  const [value, setValue] = useState(() => (options.some((o) => o.value === defaultValue) ? defaultValue : ""));
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const words = norm(query).split(/\s+/).filter(Boolean);
    if (!words.length) return options;
    return options.filter((o) => {
      const hay = norm(`${o.label} ${o.group ?? ""} ${o.hint ?? ""}`);
      return words.every((w) => hay.includes(w));
    });
  }, [options, query]);

  // Close when focus or a click leaves the widget.
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => {
      if (box.current && !box.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("focusin", away);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("focusin", away);
    };
  }, [open]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor, open]);

  function openList() {
    setOpen(true);
    const i = filtered.findIndex((o) => o.value === value);
    setCursor(i >= 0 ? i : 0);
  }
  function close() {
    setOpen(false);
    setQuery("");
  }
  function pick(o: SelectOption) {
    setValue(o.value);
    onChange?.(o.value);
    close();
    input.current?.focus();
  }
  function clear() {
    setValue("");
    onChange?.("");
    setQuery("");
    input.current?.focus();
    setOpen(true);
    setCursor(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openList();
        else setCursor((c) => Math.min(c + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openList();
        else setCursor((c) => Math.max(c - 1, 0));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setCursor(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setCursor(filtered.length - 1);
        }
        break;
      case "Enter":
        if (open) {
          e.preventDefault();
          if (filtered[cursor]) pick(filtered[cursor]);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          close();
        }
        break;
      case "Tab":
        if (open) close();
        break;
    }
  }

  // Build the visible list with group headings, keeping a flat index for keyboard movement.
  const rows: React.ReactNode[] = [];
  let lastGroup: string | undefined;
  filtered.forEach((o, i) => {
    if (o.group && o.group !== lastGroup) {
      rows.push(
        <li
          key={`g-${o.group}-${i}`}
          role="presentation"
          // Headings scroll with their options (not sticky): a long heading that wraps onto two lines used to
          // show its second line under the next sticky heading.
          className="border-t border-line-soft px-3 pb-1 pt-3 text-xs font-semibold leading-snug text-ink-soft first:border-t-0"
        >
          {o.group}
        </li>,
      );
    }
    lastGroup = o.group;
    const isSel = o.value === value;
    rows.push(
      <li
        key={o.value}
        id={`${baseId}-opt-${i}`}
        data-index={i}
        role="option"
        aria-selected={isSel}
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => pick(o)}
        onPointerMove={() => cursor !== i && setCursor(i)}
        className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] ${
          cursor === i ? "bg-brand/10 text-ink" : ""
        } ${isSel ? "font-semibold text-brand-ink" : ""}`}
      >
        <span className="min-w-0">
          <span className="block truncate">{o.label}</span>
          {o.hint ? <span className="block truncate text-xs font-normal text-ink-soft">{o.hint}</span> : null}
        </span>
        {isSel ? <Icon name="check" size={16} className="shrink-0" /> : null}
      </li>,
    );
  });

  return (
    <div ref={box} className="relative">
      <input type="hidden" name={name} value={value} />
      <div
        className={`input flex items-center gap-2 !py-0 !pr-1.5 ${open ? "!border-brand shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_20%,transparent)]" : ""} ${
          invalid ? "!border-danger" : ""
        }`}
        onClick={() => {
          input.current?.focus();
          if (!open) openList();
        }}
      >
        <Icon name="search" size={17} className="shrink-0 text-ink-soft" />
        <input
          ref={input}
          id={baseId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          aria-activedescendant={open && filtered[cursor] ? `${baseId}-opt-${cursor}` : undefined}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
          value={open ? query : (selected?.label ?? "")}
          placeholder={open ? (selected?.label ?? searchPlaceholder) : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
            if (!open) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => !open && openList()}
          className={`min-h-[2.75rem] w-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-ink-soft/80 ${
            selected && !open ? "font-medium" : ""
          }`}
        />
        {value ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-concrete hover:text-ink"
            aria-label={clearLabel}
          >
            <Icon name="x" size={16} />
          </button>
        ) : null}
        <span className="grid h-9 w-7 shrink-0 place-items-center text-ink-soft" aria-hidden>
          <Icon name="chevron-down" size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </div>

      {open ? (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-labelledby={labelledBy}
          className="pop scroll-thin absolute inset-x-0 top-full z-40 mt-2 max-h-[min(20rem,50dvh)] overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 text-ink shadow-[0_24px_60px_-24px_rgba(6,18,10,0.45)]"
        >
          {rows.length ? rows : <li className="px-3 py-3 text-[0.95rem] text-ink-soft">{noMatches}</li>}
        </ul>
      ) : null}
    </div>
  );
}
