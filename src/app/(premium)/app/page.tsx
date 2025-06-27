"use client";

import { authClient } from "auth/client";
import { useEffect, useState } from "react";
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

export default function DashboardPage() {
  const [customerState, setCustomerState] = useState<CustomerState | null>(
    null,
  );
  const [lifetimeOrders, setLifetimeOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = authClient.useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchCustomerState = async () => {
    try {
      setIsLoading(true);

      // Fetch both APIs in parallel - each serves different purposes
      const [ordersResult, stateResult] = await Promise.allSettled([
        // Orders API for lifetime purchases
        (async () => {
          try {
            const result = await authClient.customer.orders.list({
              query: {
                page: 1,
                limit: 10,
                productBillingType: "one_time",
              },
            });
            return result;
          } catch (error) {
            // Silently handle validation errors and return empty orders
            // This prevents error toasts while keeping the functionality intact
            console.log("Orders API validation error (expected if customer not configured):", error);
            return { data: { result: { items: [] } } };
          }
        })(),
        // State API for active subscriptions
        (async () => {
          try {
            const result = await authClient.customer.state();
            return result;
          } catch (error) {
            console.log("Customer state API error:", error);
            return { data: null };
          }
        })(),
      ]);

      // Handle lifetime orders (from orders API)
      if (ordersResult.status === "fulfilled") {
        // Extract orders from the response
        const responseData = ordersResult.value as any;

        // Extract orders from the correct path: data.result.items
        const rawOrders =
          responseData.data.result.items || responseData?.result?.items || [];

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
        } else {
          setLifetimeOrders([]);
        }
      } else {
        setLifetimeOrders([]);
      }

      // Handle customer state (from state API)
      if (stateResult.status === "fulfilled") {
        const customerData = (stateResult.value as any)?.data;
        setCustomerState(customerData || null);
      } else {
        setCustomerState(null);
      }
    } catch (_error: any) {
      setCustomerState(null);
      setLifetimeOrders([]);
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

  // Handle successful checkout
  useEffect(() => {
    const checkoutSuccess = searchParams.get("checkout_success");
    const checkoutId = searchParams.get("checkout_id");

    if (checkoutSuccess === "true" && checkoutId && session?.user) {
      // Show success message
      toast.success("🎉 Payment successful! Welcome to premium!");

      // Refetch customer state after a short delay to ensure Polar has processed the payment
      setTimeout(() => {
        fetchCustomerState();
      }, 2000);

      // Clean up URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout_success");
      url.searchParams.delete("checkout_id");
      url.searchParams.delete("customer_session_token");
      router.replace(url.pathname);
    }
  }, [searchParams, session, router]);

  if (isLoading) {
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

  // Get product IDs from environment
  const MONTHLY_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID;
  const YEARLY_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_YEARLY_PRODUCT_ID;

  const hasActiveSubscription = customerState?.activeSubscriptions?.some(
    (sub) =>
      sub.status === "active" &&
      (sub.productId === MONTHLY_PRODUCT_ID ||
        sub.productId === YEARLY_PRODUCT_ID),
  );

  // Check for any one-time purchase (lifetime deal)
  const hasLifetimeDeal = lifetimeOrders.length > 0;

  const getWelcomeMessage = () => {
    if (hasLifetimeDeal) {
      return {
        title: "Welcome to Lifetime Deal! 🎉",
        description: "You have lifetime access to all premium features.",
        icon: <Crown className="h-6 w-6 text-yellow-500" />,
      };
    }
    if (hasActiveSubscription) {
      return {
        title: "Welcome to Premium Subscription! ⭐",
        description: "Enjoy unlimited access to all premium features.",
        icon: <Zap className="h-6 w-6 text-blue-500" />,
      };
    }
    return {
      title: "No Active Plan",
      description: "Upgrade to access premium features.",
      icon: <CreditCard className="h-6 w-6 text-gray-500" />,
    };
  };

  const welcomeInfo = getWelcomeMessage();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {welcomeInfo.icon}
          <h1 className="text-3xl font-bold tracking-tight">
            {welcomeInfo.title}
          </h1>
        </div>
        <p className="text-muted-foreground">{welcomeInfo.description}</p>

        {/* Debug Info - Remove this in production */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2 text-foreground">Debug Information</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>Session User ID: {session?.user?.id || "N/A"}</div>
            <div>Customer State: {customerState ? "Loaded" : "Not loaded"}</div>
            <div>Orders Count: {lifetimeOrders.length}</div>
            <div>Active Subscriptions: {customerState?.activeSubscriptions?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Subscription Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Subscription Status
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {hasActiveSubscription ? (
              <div className="space-y-2">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  Active
                </Badge>
                {customerState?.activeSubscriptions
                  ?.filter(
                    (sub) =>
                      sub.status === "active" &&
                      (sub.productId === MONTHLY_PRODUCT_ID ||
                        sub.productId === YEARLY_PRODUCT_ID),
                  )
                  .map((sub) => (
                    <div key={sub.id} className="text-sm text-muted-foreground">
                      <p className="font-medium">
                        {sub.productId === MONTHLY_PRODUCT_ID
                          ? "Monthly Plan"
                          : "Yearly Plan"}
                      </p>
                      <p>
                        ${(sub.amount / 100).toFixed(2)} /{" "}
                        {sub.recurringInterval}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground"
              >
                No Active Subscription
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Lifetime Deal Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Lifetime Access
            </CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {hasLifetimeDeal ? (
              <div className="space-y-2">
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                >
                  Lifetime Access
                </Badge>
                {lifetimeOrders.map((order) => (
                  <div key={order.id} className="text-sm text-muted-foreground">
                    <p className="font-medium">
                      {order.product?.name || "Lifetime Access"}
                    </p>
                    <p>${(order.amount / 100).toFixed(2)} - One-time payment</p>
                    <p>
                      Purchased:{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs">Status: {order.status}</p>
                  </div>
                ))}
              </div>
            ) : (
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground"
              >
                No Lifetime Access
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Benefits
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customerState?.grantedBenefits &&
              customerState.grantedBenefits.length > 0 ? (
                customerState.grantedBenefits.map((benefit) => (
                  <div key={benefit.id} className="text-sm">
                    <Badge variant="outline" className="mb-1">
                      {benefit.type}
                    </Badge>
                    <p className="text-muted-foreground text-xs">
                      {benefit.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active benefits
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {(hasActiveSubscription || hasLifetimeDeal) && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your subscription and access premium features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Premium Chat Features</h4>
                <p className="text-sm text-muted-foreground">
                  Access to premium features, advanced components, and priority support
                  models
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Priority Support</h4>
                <p className="text-sm text-muted-foreground">
                  Get priority support and early access to new features
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
