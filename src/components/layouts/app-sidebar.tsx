"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sidebar, SidebarBody, SidebarLink } from "ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconCreditCard,
  IconCrown,
  IconStar,
  IconCalendar,
  IconGift,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { authClient } from "auth/client";
import { useSidebar, useStoreActions } from "../../app/store";

type UserTier = 'free' | 'monthly' | 'yearly' | 'lifetime';

/**
 * App sidebar component with navigation links and user profile
 */
export function AppSidebar({ 
  children, 
  onNavigate,
  userTier = 'free'
}: { 
  children: React.ReactNode;
  onNavigate: (page: 'dashboard' | 'profile' | 'settings') => void;
  userTier?: UserTier;
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { isCollapsed, toggle } = useSidebar();
  const { setUser } = useStoreActions();
  
  // Sync user data with store when session changes
  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatar: session.user.image || undefined,
      });
    }
  }, [session, setUser]);
  
  const user = session?.user;

  /**
   * Get tier-specific icon and color
   */
  const getTierIcon = () => {
    switch (userTier) {
      case 'free':
        return <IconGift className="h-4 w-4 text-gray-500" />;
      case 'monthly':
        return <IconStar className="h-4 w-4 text-blue-500" />;
      case 'yearly':
        return <IconCalendar className="h-4 w-4 text-purple-500" />;
      case 'lifetime':
        return <IconCrown className="h-4 w-4 text-yellow-500" />;
      default:
        return <IconGift className="h-4 w-4 text-gray-500" />;
    }
  };

  /**
   * Get tier display name
   */
  const getTierName = () => {
    switch (userTier) {
      case 'free':
        return 'Free';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
      case 'lifetime':
        return 'Lifetime';
      default:
        return 'Free';
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      // Redirect to home page after sign out
      window.location.href = "/";
    } catch (error) {
      // Redirect anyway in case of error
      window.location.href = "/";
    }
  };

  const handleSubscriptionManagement = async () => {
    try {
      // Check both customer state and orders (like in dashboard)
      const [stateResult, ordersResult] = await Promise.allSettled([
        // State API for active subscriptions
        (async () => {
          try {
            const result = await authClient.customer.state();
            return result;
          } catch (error) {
            return { data: null };
          }
        })(),
        // Orders API for lifetime purchases
        (async () => {
          try {
            const result = await authClient.customer.orders.list();
            return result;
          } catch (error) {
            return { data: { result: { items: [] } } };
          }
        })(),
      ]);

      let hasActiveSubscription = false;
      let hasLifetimeAccess = false;

      // Check subscription status
      if (stateResult.status === "fulfilled") {
        const customerData = (stateResult.value as any)?.data;
        hasActiveSubscription = customerData?.activeSubscriptions?.some(
          (sub: any) => sub.status === "active"
        );
      }

      // Check lifetime orders
      if (ordersResult.status === "fulfilled") {
        const ordersData = ordersResult.value as any;
        const rawOrders = ordersData.data?.result?.items || ordersData?.result?.items || [];
        hasLifetimeAccess = rawOrders.length > 0;
      }
      
      if (hasActiveSubscription || hasLifetimeAccess) {
        // Try to open customer portal - this redirects to Polar's customer portal
        await authClient.customer.portal();
      } else {
        router.push("/pricing");
      }
      
    } catch (error: any) {
      // Always fallback to pricing page
      router.push("/pricing");
    }
  };

  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <div className="flex items-center gap-2">
          <IconBrandTabler className="h-5 w-5 shrink-0 text-sidebar-foreground" />
          {getTierIcon()}
        </div>
      ),
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-sidebar-foreground" />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-sidebar-foreground" />
      ),
    },
    {
      label: "Manage Subscription",
      href: "#",
      icon: (
        <IconCreditCard className="h-5 w-5 shrink-0 text-sidebar-foreground" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="h-5 w-5 shrink-0 text-sidebar-foreground" />
      ),
    },
  ];

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col bg-background md:flex-row",
        "h-screen"
      )}
    >
      <Sidebar open={!isCollapsed} setOpen={(open) => {
        // If the new open state is different from current, toggle
        if (open !== !isCollapsed) {
          toggle();
        }
      }}>
        <SidebarBody className="justify-between gap-10 overflow-x-hidden overflow-y-auto">
          <div className="flex flex-1 flex-col ">
            {!isCollapsed ? <Logo /> : <LogoIcon />}
            
            {/* Tier Badge */}
            {!isCollapsed && (
              <div className="mt-4 px-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-border/50">
                  {getTierIcon()}
                  <span className="text-xs font-medium text-sidebar-foreground/70">
                    {getTierName()} Plan
                  </span>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex flex-col gap-2">
              {links.map((link, idx) => {
                const isLogout = link.label === "Logout";
                const isSubscription = link.label === "Manage Subscription";
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isLogout) {
                        handleSignOut();
                      } else if (isSubscription) {
                        handleSubscriptionManagement();
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
        <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-sidebar-border bg-background p-2 md:p-6">
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
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-sidebar-foreground"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-sidebar-foreground" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-sidebar-foreground"
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
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-sidebar-foreground"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-sidebar-foreground" />
    </a>
  );
}; 