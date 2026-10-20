import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Staff sign-in", robots: { index: false, follow: false } };

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="heading mb-6 text-center text-xl">{s.company.shortName}</p>
        <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">{children}</div>
      </div>
    </main>
  );
}
