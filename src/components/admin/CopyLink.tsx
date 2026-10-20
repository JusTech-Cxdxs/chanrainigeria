"use client";
import { useState } from "react";

export function CopyLink({ path }: { path: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="mt-1 text-sm font-semibold text-brand"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
    >
      {done ? "Copied" : "Copy link"}
    </button>
  );
}
