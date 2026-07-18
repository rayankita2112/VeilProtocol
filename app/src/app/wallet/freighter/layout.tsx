import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stellar Wallet — Freighter Integration",
};

export default function FreighterWalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
