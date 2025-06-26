"use client";

import { useSidebar } from "ui/sidebar";
import { PanelLeft } from "lucide-react";
import { Button } from "ui/button";

export function DashboardHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      <div className="flex-1">
        <h1 className="text-lg font-semibold">Premium Dashboard</h1>
      </div>
    </header>
  );
}
