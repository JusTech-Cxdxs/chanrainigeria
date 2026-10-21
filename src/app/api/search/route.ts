import { clientKey, rateLimit } from "@/lib/guard";
import { searchSite } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await rateLimit(`search:${await clientKey()}`, 90, 60_000))) {
    return Response.json({ error: "Too many searches. Wait a moment." }, { status: 429 });
  }
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const groups = await searchSite(q).catch(() => []);
  return Response.json({ groups }, { headers: { "cache-control": "private, max-age=30" } });
}
