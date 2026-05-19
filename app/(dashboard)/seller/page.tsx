import { PlatformDashboard } from "@/components/platform/platform-dashboard";
import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SellerDashboardPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Building2 className="mt-1 size-5 text-[hsl(var(--primary))]" />
            <div>
              <p className="font-semibold">Business listing</p>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                Publish your logo, contact details, WhatsApp, services, address, working hours and public business profile.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/seller/shop">
              List your business
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
      <PlatformDashboard role="seller" />
    </div>
  );
}
