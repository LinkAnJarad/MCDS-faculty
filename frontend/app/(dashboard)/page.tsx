// This file exists only to avoid a route conflict from the (dashboard) group.
// Real routing is handled by app/page.tsx (landing) and app/dashboard/page.tsx (protected).
import { redirect } from "next/navigation";

export default function DashboardGroupIndex() {
  redirect("/dashboard");
}
