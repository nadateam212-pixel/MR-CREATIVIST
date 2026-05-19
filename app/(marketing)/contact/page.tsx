import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { brand } from "@/lib/brand";

export default function ContactPage() {
  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[hsl(var(--primary))]">CONTACT US</p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-6xl">Let&apos;s build your next digital growth system.</h1>
          <p className="mt-5 text-lg leading-8 text-[hsl(var(--muted-foreground))]">
            Talk to MR Creativist about e-learning, marketplace selling, AI tools, multimedia production, consulting,
            partnerships, or platform support.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr]">
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
                    <a key={phone} href={`tel:${phone.replaceAll(" ", "")}`} className="block text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]">
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
