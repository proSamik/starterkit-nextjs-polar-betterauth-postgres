"use client";

import { Check, Star } from "lucide-react";
import { authClient } from "auth/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface PricingTier {
  name: string;
  price: string;
  originalPrice?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
  planSlug?: "Free" | "yearly" | "lifetime";
}

const pricingTiers: PricingTier[] = [
  {
    name: "Open Source",
    price: "Free",
    description: "Perfect for personal projects and learning",
    features: [
      "Complete source code access",
      "Basic authentication setup",
      "Database schema & migrations",
      "Tailwind CSS components",
      "Docker configuration",
      "MIT License",
    ],
    cta: "Get Started Free",
    planSlug: "Free",
  },
  {
    name: "Pro",
    price: "$49",
    description: "Best for professional developers and small teams",
    features: [
      "Everything in Open Source",
      "Polar.sh payment integration",
      "Advanced auth configurations",
      "Premium UI components",
      "Email templates & automation",
      "Priority support & updates",
      "Commercial license",
    ],
    cta: "Get Pro Version",
    highlighted: true,
    badge: "Most Popular",
    planSlug: "lifetime",
  },
  {
    name: "Enterprise",
    price: "$199",
    description: "For teams and production applications",
    features: [
      "Everything in Pro",
      "Multi-tenant architecture",
      "Advanced security features",
      "Custom deployment scripts",
      "Team collaboration tools",
      "White-label options",
      "1-on-1 setup consultation",
      "Lifetime updates",
    ],
    cta: "Get Enterprise",
    badge: "Best Value",
    planSlug: "yearly",
  },
];

export function PricingSection() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [customerState, setCustomerState] = useState<any>(null);
  const [lifetimeOrders, setLifetimeOrders] = useState<any[]>([]);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const fetchCustomerState = async () => {
    if (!session?.user) return;

    try {
      setIsLoadingState(true);
      const response = await authClient.customer.state();
      const data = (response as any)?.data;
      setCustomerState(data || null);

      // Check for one-time purchases (lifetime deals) only if no active subscriptions
      if (
        data &&
        (!data.activeSubscriptions || data.activeSubscriptions.length === 0)
      ) {
        try {
          const ordersResponse = await authClient.customer.orders.list({
            query: {
              page: 1,
              limit: 10,
              productBillingType: "one_time",
            },
          });
          const ordersData = (ordersResponse as any)?.data?.items || [];
          setLifetimeOrders(ordersData);
        } catch (_ordersError: any) {
          setLifetimeOrders([]);
        }
      } else {
        setLifetimeOrders([]);
      }
    } catch (error: any) {
      // If customer doesn't exist in Polar yet, that's expected for existing users
      if (
        error?.message?.includes("ResourceNotFound") ||
        error?.message?.includes("Not found")
      ) {
        setCustomerState(null);
        setLifetimeOrders([]);
      } else {
        setCustomerState(null);
        setLifetimeOrders([]);
      }
    } finally {
      setIsLoadingState(false);
    }
  };

  // Fetch customer state when user is authenticated
  useEffect(() => {
    if (session?.user) {
      fetchCustomerState();
    }
  }, [session]);

  // Refetch customer state if coming back from successful checkout
  useEffect(() => {
    const checkoutSuccess = searchParams.get("checkout_success");
    if (checkoutSuccess === "true" && session?.user) {
      // Refetch after a delay to ensure Polar has processed the payment
      setTimeout(() => {
        fetchCustomerState();
      }, 1000);
    }
  }, [searchParams, session]);

  const handleCheckout = async (
    planSlug: "Free" | "yearly" | "lifetime",
  ) => {
    // Check if user is authenticated
    if (!session?.user) {
      toast.error("Please sign in to purchase a plan");
      return;
    }

    // Check if user already has an active subscription or lifetime access
    // Only check if we have customer state (customer exists in Polar)
    if (customerState) {
      // Get product IDs from environment
      const MONTHLY_PRODUCT_ID =
        process.env.NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID;
      const YEARLY_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_YEARLY_PRODUCT_ID;

      // Check for any one-time purchase (lifetime deal)
      const hasLifetimeAccess = lifetimeOrders.length > 0;

      const hasActiveSubscription = customerState?.activeSubscriptions?.some(
        (sub: any) =>
          sub.status === "active" &&
          (sub.productId === MONTHLY_PRODUCT_ID ||
            sub.productId === YEARLY_PRODUCT_ID),
      );

      if (hasLifetimeAccess) {
        toast.info("You already have lifetime access!");
        return;
      }

      if (hasActiveSubscription && planSlug !== "lifetime") {
        toast.info(
          "You already have an active subscription. You can manage it in your dashboard.",
        );
        return;
      }
    }

    try {
      setCheckoutLoading(planSlug);

      // Use Better Auth Polar checkout
      // Polar will automatically create a customer if one doesn't exist
      await authClient.checkout({
        slug: planSlug,
      });
    } catch (error: any) {
      // Provide more specific error messages
      if (error?.message?.includes("ResourceNotFound")) {
        toast.error("Product not found. Please contact support.");
      } else if (error?.message?.includes("Unauthorized")) {
        toast.error("Please sign in again and try checkout.");
      } else {
        toast.error("Failed to start checkout. Please try again.");
      }
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getButtonState = (tier: PricingTier) => {
    if (!tier.planSlug) return { disabled: false, text: tier.cta };

    if (sessionLoading || isLoadingState) {
      return { disabled: true, text: "Loading..." };
    }

    if (!session?.user) {
      return { disabled: false, text: "Sign In to Purchase" };
    }

    if (customerState || lifetimeOrders.length > 0) {
      // Get product IDs from environment
      const MONTHLY_PRODUCT_ID =
        process.env.NEXT_PUBLIC_POLAR_MONTHLY_PRODUCT_ID;
      const YEARLY_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_YEARLY_PRODUCT_ID;

      // Check for any one-time purchase (lifetime deal)
      const hasLifetimeAccess = lifetimeOrders.length > 0;

      const hasActiveSubscription = customerState?.activeSubscriptions?.some(
        (sub: any) =>
          sub.status === "active" &&
          (sub.productId === MONTHLY_PRODUCT_ID ||
            sub.productId === YEARLY_PRODUCT_ID),
      );

      if (hasLifetimeAccess) {
        return { disabled: true, text: "You have Lifetime Access" };
      }

      if (hasActiveSubscription && tier.planSlug !== "lifetime") {
        return { disabled: true, text: "Currently Active" };
      }
    }

    if (checkoutLoading === tier.planSlug) {
      return { disabled: true, text: "Processing..." };
    }

    return { disabled: false, text: tier.cta };
  };

  return (
    <section className="py-2 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-12">
            <Star className="h-4 w-4 mr-2" />
            Complete Next.js Starter Kit
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Choose Your Development Package
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            From open source basics to enterprise-ready features. Start building 
            your SaaS application with the tools you need.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, _index) => {
            const buttonState = getButtonState(tier);

            return (
              <div
                key={tier.name}
                className={`relative bg-white rounded-2xl shadow-sm border ${
                  tier.highlighted
                    ? "border-blue-500 shadow-lg scale-105"
                    : "border-gray-200"
                } p-8`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      {tier.badge}
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {tier.name}
                  </h3>
                  <div className="mb-4">
                    {tier.originalPrice && (
                      <span className="text-lg text-gray-400 line-through mr-2">
                        {tier.originalPrice}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-gray-900">
                      {tier.price}
                    </span>
                    {tier.name === "Pro" && (
                      <span className="text-gray-600 ml-1"> one-time</span>
                    )}
                    {tier.name === "Enterprise" && (
                      <span className="text-gray-600 ml-1"> one-time</span>
                    )}
                  </div>
                  <p className="text-gray-600">{tier.description}</p>
                </div>

                <ul className="space-y-6 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-center">
                  {tier.planSlug ? (
                    <button
                      onClick={() =>
                        !session?.user
                          ? (window.location.href = "/sign-in")
                          : handleCheckout(tier.planSlug!)
                      }
                      disabled={buttonState.disabled}
                      className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
                        buttonState.disabled
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : tier.highlighted
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {buttonState.text}
                    </button>
                  ) : (
                    <button
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                      onClick={() => {
                        if (tier.name === "Open Source") {
                          window.open("https://github.com/cgoinglove/nextjs-polar-starter-kit", "_blank");
                        } else {
                          toast.info("Contact sales for enterprise pricing");
                        }
                      }}
                    >
                      {tier.cta}
                    </button>
                  )}
                  <p className="text-sm text-gray-500 mt-3">
                    {tier.name === "Open Source"
                      ? "MIT License, no restrictions"
                      : tier.name === "Pro"
                        ? "One-time payment, lifetime updates"
                        : "One-time payment, enterprise support"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-20">
          <p className="text-lg text-gray-600 mb-8">
            All packages include documentation, examples, and community support
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="flex items-center text-sm text-gray-600">
              <Check className="h-4 w-4 text-blue-600 mr-2" />
              Complete source code
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Check className="h-4 w-4 text-blue-600 mr-2" />
              Production ready
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Check className="h-4 w-4 text-blue-600 mr-2" />
              Regular updates
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
