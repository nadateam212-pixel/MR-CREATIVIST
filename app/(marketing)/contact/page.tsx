import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brand } from "@/lib/brand";

export default function ContactPage() {
  return (
    <div className="app-frame py-6">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[hsl(var(--primary))]">Contact</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Message MR Creativist</h1>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="uppercase">CONTACT INFORMATION</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 size-5 text-[hsl(var(--primary))]" />
                <div>
                  <p className="font-black uppercase">OUR OFFICE</p>
                  <p className="text-[hsl(var(--muted-foreground))]">{brand.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-1 size-5 text-[hsl(var(--primary))]" />
                <div>
                  <p className="font-black uppercase">PHONE</p>
                  {brand.phones.map((phone) => (
                    <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="block text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]">
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-1 size-5 text-[hsl(var(--primary))]" />
                <div>
                  <p className="font-black uppercase">EMAIL</p>
                  <a href={`mailto:${brand.email}`} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]">
                    {brand.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-1 size-5 text-[hsl(var(--primary))]" />
                <div>
                  <p className="font-black uppercase">BUSINESS HOURS</p>
                  <p className="text-[hsl(var(--muted-foreground))]">MONDAY - FRIDAY: 9AM - 6PM</p>
                  <p className="text-[hsl(var(--muted-foreground))]">SATURDAY: 10AM - 4PM</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="min-h-[18rem] overflow-hidden rounded-lg border border-[hsl(var(--border))]">
            <iframe
              title="MR Creativist Kigali map"
              src="https://www.google.com/maps?q=Kigali%2C%20Rwanda&output=embed"
              width="100%"
              height="100%"
              className="min-h-[18rem]"
              loading="lazy"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="uppercase">SEND US A MESSAGE</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
