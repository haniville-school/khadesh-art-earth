import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import CategoryManager from "./category-manager";

export default async function AdminCategoriesPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <DashboardShell
      title="Categories"
      nav={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/vendors", label: "Vendors" },
        { href: "/admin/categories", label: "Categories" },
      ]}
    >
      <CategoryManager initialCategories={categories ?? []} />
    </DashboardShell>
  );
}