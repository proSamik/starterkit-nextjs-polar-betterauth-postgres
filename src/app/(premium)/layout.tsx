"use client";

import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "auth/client";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { Settings } from "@/components/settings";
import { Profile } from "@/components/profile";

/**
 * Premium layout with sidebar navigation and dynamic content rendering
 */
export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending: isLoading } = authClient.useSession();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'profile' | 'settings'>('dashboard');

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !session) {
      redirect("/sign-in");
    }
  }, [session, isLoading]);

  const handleNavigation = (page: 'dashboard' | 'profile' | 'settings') => {
    setCurrentPage(page);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return children; // Render the original dashboard page
      case 'profile':
        return <Profile />;
      case 'settings':
        return <Settings />;
      default:
        return children;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Handled by redirect
  }

  return (
    <AppSidebar onNavigate={handleNavigation}>
      {renderContent()}
    </AppSidebar>
  );
}
