import { getSession } from "auth/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { SidebarProvider } from "ui/sidebar";
import { cookies } from "next/headers";
import { COOKIE_KEY_SIDEBAR_STATE } from "lib/const";

export default async function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([getSession(), cookies()]);

  if (!session) {
    return redirect("/sign-in");
  }

  const isCollapsed =
    cookieStore.get(COOKIE_KEY_SIDEBAR_STATE)?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <main className="relative bg-background w-full flex flex-col h-screen">
        <DashboardHeader />
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
