import Link from "next/link";
import { Machine } from "@/components/Machine";

export default function NotFound() {
  return (
    <main className="wrap grid min-h-[70vh] place-items-center py-16">
      <div className="max-w-xl text-center">
        <Machine kind="excavator" className="mx-auto w-64" />
        <h1 className="display mt-6 text-4xl">We couldn&apos;t find that page</h1>
        <p className="mt-3 text-ink-soft">The link may be old, or the page has moved. Try the products list or get in touch.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/products" className="btn btn-primary">
            See products
          </Link>
          <Link href="/contact" className="btn btn-outline">
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}
