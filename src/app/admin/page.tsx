import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/dashboard";
import { AdminLogin } from "@/components/admin/login";
import { isAdmin } from "@/lib/admin-auth";
import { listApplications, storageConfigured, type ApplicationRow } from "@/lib/store";

export const metadata: Metadata = {
  title: "Operator console · TVO",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin />;

  let rows: ApplicationRow[] = [];
  let error = "";
  if (!storageConfigured()) {
    error = "Supabase isn't configured on this deployment, so there's nothing to show yet.";
  } else {
    try {
      rows = await listApplications();
    } catch (err) {
      console.error("[admin]", err);
      error = "Couldn't load applications. Check the Supabase settings and the admin key.";
    }
  }

  return <AdminDashboard initialRows={rows} loadError={error} />;
}
