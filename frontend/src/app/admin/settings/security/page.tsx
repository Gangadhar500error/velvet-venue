import { redirect } from "next/navigation";

export default function SecuritySettingsPage() {
  redirect("/admin/settings/profile");
}

