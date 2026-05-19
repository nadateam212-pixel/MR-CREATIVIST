import type { Metadata } from "next";
import { auth } from "@/auth";
import { WalletWorkbench } from "@/components/platform/wallet-workbench";
import { getWalletSnapshot } from "@/lib/platform-ledger";

export const metadata: Metadata = {
  title: "Wallet"
};

export default async function WalletPage() {
  const session = await auth();
  let snapshot;
  let walletError = "";

  if (session?.user) {
    try {
      snapshot = await getWalletSnapshot(session.user);
    } catch {
      walletError = "Wallet service is temporarily unavailable. Your page is open, but new wallet actions may need a retry.";
    }
  }

  return <WalletWorkbench initialSnapshot={snapshot} initialError={walletError} />;
}
