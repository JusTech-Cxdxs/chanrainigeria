import { redirect } from "next/navigation";

/** The slider and all site pictures now live together under Images. */
export default function Appearance() {
  redirect("/admin/images");
}
