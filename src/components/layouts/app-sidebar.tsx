"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sidebar, SidebarBody, SidebarLink } from "ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { authClient } from "auth/client";
import { toast } from "sonner";

/**
 * App sidebar component with navigation links and user profile
 */
export function AppSidebar({ 
  children, 
  onNavigate 
}: { 
  children: React.ReactNode;
  onNavigate: (page: 'dashboard' | 'profile' | 'settings') => void;
}) {
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  
  const user = session?.user;

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      toast.success("Signed out successfully");
      // Redirect to home page after sign out
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to sign out:", error);
      toast.error("Failed to sign out");
    }
  };

  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-hidden bg-background md:flex-row",
        "h-screen"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => {
                const isLogout = link.label === "Logout";
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isLogout) {
                        handleSignOut();
                      } else {
                        onNavigate(link.label.toLowerCase() as 'dashboard' | 'profile' | 'settings');
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <SidebarLink link={link} />
                  </div>
                );
              })}
            </div>
          </div>
          <div onClick={() => onNavigate('profile')} className="cursor-pointer">
            <SidebarLink
              link={{
                label: user?.name || "User",
                href: "#",
                icon: (
                  <Image
                    src={user?.image || "/pf.png"}
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                    width={28}
                    height={28}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1">
        <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-background p-2 md:p-6 dark:border-neutral-700">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Logo component for expanded sidebar
 */
export const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        Polar SaaS
      </motion.span>
    </a>
  );
};

/**
 * Logo icon component for collapsed sidebar
 */
export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </a>
  );
}; 