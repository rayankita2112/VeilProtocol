"use client";

import AppShell from "@/components/AppShell";
import { StellarWalletPanel } from "@/components/wallet/stellar-wallet-panel";

export default function FreighterWalletPage() {
  return (
    <AppShell>
      <StellarWalletPanel />
    </AppShell>
  );
}
