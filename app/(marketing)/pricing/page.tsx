"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceDisplay } from "@/components/ui/price-display";
import { useI18n } from "@/hooks/use-i18n";

const plans = [
  {
    nameKey: "pricing.starter",
    price: "$0",
    features: ["pricing.feature.browse", "pricing.feature.account", "pricing.feature.wishlist", "pricing.feature.ai"]
  },
  {
    nameKey: "pricing.creatorPro",
    price: "$29",
    features: ["pricing.feature.sell", "pricing.feature.publish", "pricing.feature.affiliate", "pricing.feature.wallet"]
  },
  {
    nameKey: "pricing.enterprise",
    price: "$199",
    features: ["pricing.feature.team", "pricing.feature.multimedia", "pricing.feature.analytics", "pricing.feature.consulting"]
  }
];

export default function PricingPage() {
  const { t } = useI18n();

  return (
    <PageShell
      eyebrow={t("pricing.eyebrow")}
      title={t("pricing.title")}
      description={t("pricing.description")}
    >
      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.nameKey}>
            <CardHeader>
              <CardTitle className="uppercase">{t(plan.nameKey)}</CardTitle>
              <PriceDisplay price={plan.price} className="text-3xl font-black text-[hsl(var(--primary))]" />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3">
                {plan.features.map((feature) => (
                  <p key={feature} className="flex gap-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-[hsl(var(--primary))]" />
                    {t(feature)}
                  </p>
                ))}
              </div>
              <Button asChild className="w-full">
                <Link href="/register">{plan.nameKey === "pricing.starter" ? t("pricing.startFree") : t("pricing.choosePlan")}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
