"use client";

import { authClient } from "auth/client";
import { useEffect, useState, Suspense} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Badge } from "ui/badge";
import { Crown, Zap, Calendar, CreditCard } from "lucide-react";
import { Skeleton } from "ui/skeleton";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

// Polar API response format
type CustomerState = {
  id: string;
  email: string;
  name: string;
  activeSubscriptions: Array<{
    id: string;
    status: string;
    amount: number;
    currency: string;
    recurringInterval: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    productId: string;
    cancelAtPeriodEnd: boolean;
  }>;
  grantedBenefits: Array<{
    id: string;
    type: string;
    description: string;
  }>;
  // Add other Polar API fields as needed
};

type Order = {
  id: string;
  amount: number;
  currency: string;
  productId: string;
  createdAt: string;
  status: string;
  product?: {
    id: string;
    name: string;
    description: string;
  };
};

type UserTier = 'free' | 'monthly' | 'yearly' | 'lifetime';

/**
 * Loading skeleton for dashboard content
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook to fetch customer state and determine user tier
 */
function useCustomerState() {
  const [customerState, setCustomerState] = useState<CustomerState | null>(null);
  const [lifetimeOrders, setLifetimeOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userTier, setUserTier] = useState<UserTier>('free');
  const { data: session } = authClient.useSession();

  const fetchCustomerState = async () => {
    try {
      setIsLoading(true);

      // Step 1: First fetch customer state (this gets updated immediately after payment)
      let newCustomerState: any = null;
      try {
        const stateResult = await authClient.customer.state();
        newCustomerState = stateResult?.data || null;
        setCustomerState(newCustomerState);
        
      } catch (error) {
        
        setCustomerState(null);
      }

      // Step 2: Then fetch lifetime orders (if needed)
      let newLifetimeOrders: any[] = [];
      try {
        const ordersResult = await authClient.customer.orders.list({
          query: {
            page: 1,
            limit: 10,
            productBillingType: "one_time",
          },
        });

        const rawOrders = ordersResult?.data?.result?.items || [];
        if (rawOrders.length > 0) {
          // Map to our Order type structure
          const mappedOrders: Order[] = rawOrders.map((order: any) => ({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            productId: order.productId,
            createdAt: order.createdAt,
            status: order.status,
            product: order.product
              ? {
                  id: order.product.id,
                  name: order.product.name,
                  description: order.product.description,
                }
              : undefined,
          }));

          setLifetimeOrders(mappedOrders);
          newLifetimeOrders = rawOrders;
          
        } else {
          setLifetimeOrders([]);
        }
      } catch (error) {
        
        setLifetimeOrders([]);
      }

      // Step 3: Determine user tier based on the fetched data
      const MONTHLY_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID;
      const YEARLY_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_YEARLY_PRODUCT_ID;

      

      // Check for lifetime orders first (highest priority)
      if (newLifetimeOrders.length > 0) {
        setUserTier('lifetime');
      } else if (newCustomerState?.activeSubscriptions) {
        // Check for active subscriptions
        const activeSubscription = newCustomerState.activeSubscriptions.find(
          (sub: any) => {
            
            return sub.status === "active" && 
              (sub.productId === MONTHLY_PRODUCT_ID || sub.productId === YEARLY_PRODUCT_ID);
          }
        );
        
        if (activeSubscription) {
          const tier = activeSubscription.productId === MONTHLY_PRODUCT_ID ? 'monthly' : 'yearly';
          
          setUserTier(tier);
        } else {
          
          setUserTier('free');
        }
      } else {
        
        setUserTier('free');
      }
    } catch (_error: any) {
      
      setCustomerState(null);
      setLifetimeOrders([]);
      setUserTier('free');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch customer state on mount and when session changes
  useEffect(() => {
    if (session?.user) {
      fetchCustomerState();
    }
  }, [session]);

  return {
    customerState,
    lifetimeOrders,
    isLoading,
    userTier,
    refetch: fetchCustomerState
  };
}

/**
 * Dashboard content component that handles the data fetching
 */
function DashboardContent() {
  const { customerState, lifetimeOrders, isLoading, userTier, refetch } = useCustomerState();
  const { data: session } = authClient.useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle successful checkout
  useEffect(() => {
    const checkoutSuccess = searchParams.get("checkout_success");
    const checkoutId = searchParams.get("checkout_id");

    if (checkoutSuccess === "true" && checkoutId && session?.user) {
      // Show success message
      toast.success("🎉 Payment successful! Welcome to premium!");

      // Refetch customer state after a short delay to ensure Polar has processed the payment
      setTimeout(() => {
        refetch();
      }, 2000);

      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout_success");
      url.searchParams.delete("checkout_id");
      url.searchParams.delete("customer_session_token");
      router.replace(url.pathname);
    }
  }, [searchParams, session, router, refetch]);

  // ... existing code ...

  /**
   * Determines the user's subscription tier based on customer state and lifetime orders
   */
  const getUserTier = (): UserTier => {
    return userTier;
  };

  /**
   * Returns a personalized welcome message based on user tier
   */
  const getWelcomeMessage = () => {
    const tier = getUserTier();
    const tierMessages = {
      free: "Welcome to your dashboard! Upgrade to unlock premium features.",
      monthly: "Welcome back, Premium Member! Enjoy your enhanced features.",
      yearly: "Welcome back, Yearly Subscriber! You're getting great value.",
      lifetime: "Welcome back, Lifetime Member! You have access to everything, forever.",
    };
    return tierMessages[tier];
  };

  /**
   * Returns tier-specific content and features
   */
  const getTierSpecificContent = () => {
    const tier = getUserTier();
    
    const tierContent = {
      free: {
        title: "Free Plan",
        icon: <CreditCard className="h-5 w-5 text-muted-foreground" />,
        badge: { text: "Free", variant: "secondary" as const },
        features: [
          { name: "Basic Authentication", enabled: true, limit: "Unlimited" },
          { name: "Database Access", enabled: true, limit: "Basic queries" },
          { name: "UI Components", enabled: true, limit: "Standard set" },
          { name: "Projects", enabled: true, limit: "3 max" },
          { name: "Email Support", enabled: false, limit: "Not included" },
          { name: "Premium Features", enabled: false, limit: "Locked" },
        ],
        description: "Perfect for getting started with basic features and learning the platform.",
        upgradeMessage: "Upgrade to unlock premium features, remove limits, and get priority support!"
      },
      monthly: {
        title: "Monthly Plan",
        icon: <Zap className="h-5 w-5 text-primary" />,
        badge: { text: "Monthly", variant: "default" as const },
        features: [
          { name: "Payment Integration", enabled: true, limit: "Full Polar.sh" },
          { name: "Premium UI Components", enabled: true, limit: "All components" },
          { name: "Email Automation", enabled: true, limit: "500/month" },
          { name: "Projects", enabled: true, limit: "10 max" },
          { name: "Priority Support", enabled: true, limit: "Email support" },
          { name: "Advanced Analytics", enabled: false, limit: "Yearly+ only" },
        ],
        description: "Great for active development with enhanced features and higher limits.",
        upgradeMessage: "Upgrade to yearly for better value and advanced features!"
      },
      yearly: {
        title: "Yearly Plan",
        icon: <Calendar className="h-5 w-5 text-secondary-foreground" />,
        badge: { text: "Yearly", variant: "default" as const },
        features: [
          { name: "Advanced Analytics", enabled: true, limit: "Full dashboard" },
          { name: "Priority Support", enabled: true, limit: "Email + Chat" },
          { name: "Team Collaboration", enabled: true, limit: "Up to 5 members" },
          { name: "Projects", enabled: true, limit: "Unlimited" },
          { name: "White-label Options", enabled: false, limit: "Lifetime only" },
          { name: "Custom Deployment", enabled: false, limit: "Lifetime only" },
        ],
        description: "Perfect for serious projects with advanced features and team collaboration.",
        upgradeMessage: "Consider lifetime for the ultimate experience with white-label options!"
      },
      lifetime: {
        title: "Lifetime Access",
        icon: <Crown className="h-5 w-5 text-accent-foreground" />,
        badge: { text: "Lifetime", variant: "default" as const },
        features: [
          { name: "Multi-tenant Support", enabled: true, limit: "Unlimited tenants" },
          { name: "White-label Solution", enabled: true, limit: "Full customization" },
          { name: "Custom Deployment", enabled: true, limit: "On-premise option" },
          { name: "Lifetime Updates", enabled: true, limit: "Forever included" },
          { name: "Premium Support", enabled: true, limit: "Priority line" },
          { name: "Early Access", enabled: true, limit: "Beta features" },
        ],
        description: "The ultimate package with all features, forever. Perfect for enterprises and power users.",
        upgradeMessage: "You have lifetime access to everything! Enjoy all premium features forever."
      }
    };

    return tierContent[tier];
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const tierContent = getTierSpecificContent();
  const tier = getUserTier();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Badge variant={tierContent.badge.variant} className="flex items-center gap-1">
            {tierContent.icon}
            {tierContent.badge.text}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {getWelcomeMessage()}
        </p>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {/* Subscription Status Card */}
        <Card className="col-span-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {tierContent.icon}
                <CardTitle>{tierContent.title}</CardTitle>
              </div>
              <Badge variant={tierContent.badge.variant}>
                {tierContent.badge.text}
              </Badge>
            </div>
            <CardDescription>
              {tierContent.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Features Grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tierContent.features.map((feature) => (
                                     <div
                     key={feature.name}
                     className={`flex items-center justify-between p-3 rounded-lg border ${
                       feature.enabled
                         ? "bg-muted/50 border-border"
                         : "bg-muted/20 border-border"
                     }`}
                   >
                     <div className="space-y-1">
                       <p className={`text-sm font-medium ${
                         feature.enabled ? "text-foreground" : "text-muted-foreground"
                       }`}>
                         {feature.name}
                       </p>
                       <p className={`text-xs ${
                         feature.enabled ? "text-muted-foreground" : "text-muted-foreground/70"
                       }`}>
                         {feature.limit}
                       </p>
                     </div>
                     <div className={`w-2 h-2 rounded-full ${
                       feature.enabled ? "bg-primary" : "bg-muted-foreground/50"
                     }`} />
                   </div>
                ))}
              </div>

                             {/* Upgrade Message */}
               {tier !== 'lifetime' && (
                 <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                   <p className="text-sm text-accent-foreground">
                     💡 {tierContent.upgradeMessage}
                   </p>
                 </div>
               )}
            </div>
          </CardContent>
        </Card>

        {/* Active Subscription Details */}
        {customerState?.activeSubscriptions && customerState.activeSubscriptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Subscription</CardTitle>
              <CardDescription>Your current subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customerState.activeSubscriptions.map((subscription) => (
                  <div key={subscription.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Amount</span>
                      <span className="text-sm">
                        ${(subscription.amount / 100).toFixed(2)} {subscription.currency.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Billing</span>
                      <span className="text-sm capitalize">
                        {subscription.recurringInterval}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Status</span>
                      <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Next Billing</span>
                      <span className="text-sm">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lifetime Purchases */}
        {lifetimeOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Lifetime Access</CardTitle>
              <CardDescription>Your lifetime purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lifetimeOrders.map((order) => (
                  <div key={order.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Purchase</span>
                      <span className="text-sm">
                        ${(order.amount / 100).toFixed(2)} {order.currency.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Date</span>
                      <span className="text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Status</span>
                      <Badge variant="default">
                        <Crown className="w-3 h-3 mr-1" />
                        Lifetime Access
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
                         <div className="space-y-3">
               <button className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/10 transition-colors">
                 <div className="font-medium text-sm text-foreground">View Analytics</div>
                 <div className="text-xs text-muted-foreground">
                   {tier === 'free' ? 'Upgrade to access' : 'Track your progress'}
                 </div>
               </button>
               <button className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/10 transition-colors">
                 <div className="font-medium text-sm text-foreground">Manage Projects</div>
                 <div className="text-xs text-muted-foreground">
                   {tierContent.features.find(f => f.name === 'Projects')?.limit}
                 </div>
               </button>
               <button className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/10 transition-colors">
                 <div className="font-medium text-sm text-foreground">Contact Support</div>
                 <div className="text-xs text-muted-foreground">
                   {tierContent.features.find(f => f.name.includes('Support'))?.limit || 'Community only'}
                 </div>
               </button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Main dashboard page component with suspense wrapper
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
