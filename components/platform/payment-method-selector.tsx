"use client";

import Image from "next/image";
import { CreditCard, Mail, Smartphone, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";

export type CheckoutPaymentMethod = "mtn_momo" | "paypal" | "stripe" | "wallet";

export type CheckoutPaymentDetails = {
  mobilePhone: string;
  paypalEmail: string;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvc: string;
};

type PaymentMethodSelectorProps = {
  value: CheckoutPaymentMethod;
  onChange: (value: CheckoutPaymentMethod) => void;
  details: CheckoutPaymentDetails;
  onDetailsChange: (details: CheckoutPaymentDetails) => void;
  walletBalance: string;
};

const methods: Array<{
  value: CheckoutPaymentMethod;
  label: string;
  helper: string;
  logo: string;
}> = [
  { value: "mtn_momo", label: "MTN MoMo", helper: "Mobile Money", logo: "/icons/mtn.png" },
  { value: "paypal", label: "PayPal", helper: "PayPal checkout", logo: "/icons/paypal.png" },
  { value: "stripe", label: "Stripe", helper: "Coming soon", logo: "/icons/stripe.png" },
  { value: "wallet", label: "Wallet", helper: "MR balance", logo: "/icons/logo.png" }
];

export function PaymentMethodSelector({ value, onChange, details, onDetailsChange, walletBalance }: PaymentMethodSelectorProps) {
  const update = (patch: Partial<CheckoutPaymentDetails>) => onDetailsChange({ ...details, ...patch });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {methods.map((method) => {
          const active = value === method.value;

          return (
            <label
              key={method.value}
              className={`grid cursor-pointer grid-cols-[2.25rem_1fr] items-center gap-3 rounded-md border p-3 transition ${
                active
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                  : "border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/35"
              }`}
            >
              <input className="sr-only" type="radio" name="payment-method" checked={active} onChange={() => onChange(method.value)} />
              <span className="grid size-9 place-items-center overflow-hidden rounded-md bg-white">
                <Image src={method.logo} alt="" width={28} height={28} className="max-h-7 w-auto object-contain" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">{method.label}</span>
                <span className="block truncate text-xs text-[hsl(var(--muted-foreground))]">{method.helper}</span>
              </span>
            </label>
          );
        })}
      </div>

      {value === "mtn_momo" ? (
        <div className="relative">
          <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input className="pl-9" value={details.mobilePhone} onChange={(event) => update({ mobilePhone: event.target.value })} inputMode="tel" placeholder="0788888888" />
        </div>
      ) : null}

      {value === "paypal" ? (
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input className="pl-9" value={details.paypalEmail} onChange={(event) => update({ paypalEmail: event.target.value })} inputMode="email" placeholder="paypal@email.com" />
        </div>
      ) : null}

      {value === "stripe" ? (
        <div className="grid gap-2">
          <div className="relative">
            <CreditCard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <Input className="pl-9" value={details.cardNumber} onChange={(event) => update({ cardNumber: event.target.value })} placeholder="Card number" disabled />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input value={details.cardExpiry} onChange={(event) => update({ cardExpiry: event.target.value })} placeholder="MM/YY" disabled />
            <Input value={details.cardCvc} onChange={(event) => update({ cardCvc: event.target.value })} placeholder="CVC" disabled />
          </div>
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Stripe card payments are coming soon.</p>
        </div>
      ) : null}

      {value === "wallet" ? (
        <div className="rounded-md border border-[hsl(var(--border))] p-3 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <Wallet className="size-4 text-[hsl(var(--primary))]" />
            Wallet balance
          </p>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">{walletBalance}</p>
        </div>
      ) : null}
    </div>
  );
}
