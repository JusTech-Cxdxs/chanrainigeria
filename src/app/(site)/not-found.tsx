import { NotFoundView } from "@/components/site/NotFoundView";

// Shown inside the site's header and footer when a page calls notFound() (an unknown product, post...).
export default function SiteNotFound() {
  return <NotFoundView />;
}
