import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function BookingPage() {
  return (
    <PageShell eyebrow="Booking" title="Schedule a consulting session" description="Calendar availability, notes, timezone, payment authorization, and meeting-room creation.">
      <Button>Request booking</Button>
    </PageShell>
  );
}
