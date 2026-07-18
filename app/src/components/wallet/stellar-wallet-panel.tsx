"use client";

import { useEffect, useState } from "react";
import { detectFreighter, FREIGHTER_INSTALL_URL } from "@/lib/stellar-wallet";
import { useWallet } from "@/hooks/use-stellar-wallet";

type TxBanner =
  { type: "success"; hash: string } | { type: "error"; message: string } | null;

export function StellarWalletPanel() {
  const [freighterDetected, setFreighterDetected] = useState<boolean | null>(
    null,
  );
  const {
    address,
    balance,
    isFunded,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    refreshBalance,
    sendXlm,
  } = useWallet();

  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [txBanner, setTxBanner] = useState<TxBanner>(null);

  useEffect(() => {
    (async () => {
      const detected = await detectFreighter();
      setFreighterDetected(detected);
    })();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxBanner(null);
    setIsSending(true);
    try {
      const result = await sendXlm(destination, amount);
      setTxBanner({ type: "success", hash: result.hash });
      setDestination("");
      setAmount("");
    } catch (err) {
      setTxBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Transaction failed",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#eaecef]">
          Stellar Wallet — Freighter Integration
        </h1>
        <p className="text-xs font-mono text-[#848e9c] mt-1">
          Testnet · Horizon: horizon-testnet.stellar.org
        </p>
      </div>

      {/* Step 1: Detection */}
      {freighterDetected === false && (
        <div className="rounded-xl border border-[#f7a600]/30 bg-[#f7a600]/10 p-5 space-y-3">
          <p className="text-sm text-[#eaecef]">
            Freighter extension not detected. Install it to continue.
          </p>
          <a
            href={FREIGHTER_INSTALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-mono font-bold text-[#f7a600] hover:text-[#f7a600]/80"
          >
            Install Freighter →
          </a>
        </div>
      )}

      {/* Step 2: Connect / Address */}
      {freighterDetected !== false && (
        <div className="rounded-xl border border-[#1e2329] bg-[#131722] p-5 space-y-4">
          {!isConnected ? (
            <button
              onClick={connect}
              disabled={isLoading || freighterDetected === null}
              className="w-full h-11 rounded-lg bg-[#f7a600] text-[#0b0e11] font-bold text-sm disabled:opacity-50"
            >
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#848e9c] mb-1">
                  Connected Address
                </p>
                <p className="text-xs font-mono text-[#eaecef] break-all bg-[#0b0e11] border border-[#1e2329] rounded-lg p-3">
                  {address}
                </p>
              </div>
              <button
                onClick={disconnect}
                className="w-full h-10 rounded-lg border border-[#1e2329] text-sm font-mono font-bold text-[#848e9c] hover:text-[#eaecef] hover:border-[#f7a600]/40 transition-colors"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 3: Balance */}
      {isConnected && (
        <div className="rounded-xl border border-[#1e2329] bg-[#131722] p-5 space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#848e9c]">
            XLM Balance
          </p>
          <p className="text-3xl font-mono font-black text-[#eaecef]">
            {isLoading && balance === null
              ? "Loading..."
              : isFunded
                ? `${balance ?? "0"} XLM`
                : "0 XLM (account not funded)"}
          </p>
          <button
            onClick={refreshBalance}
            disabled={isLoading}
            className="text-xs font-mono font-bold text-[#f7a600] hover:text-[#f7a600]/80 disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh Balance"}
          </button>
        </div>
      )}

      {/* Step 4: Send XLM */}
      {isConnected && (
        <div className="rounded-xl border border-[#1e2329] bg-[#131722] p-5 space-y-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#848e9c]">
            Send XLM
          </p>
          <form onSubmit={handleSend} className="space-y-3">
            <input
              type="text"
              placeholder="Destination G-address"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              pattern="^G[A-Z0-9]{55}$"
              className="w-full h-11 rounded-lg border border-[#1e2329] bg-[#0b0e11] px-4 text-sm font-mono text-[#eaecef] focus:outline-none focus:ring-2 focus:ring-[#f7a600]/40"
            />
            <input
              type="number"
              step="0.0000001"
              min="0.0000001"
              placeholder="Amount (XLM)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full h-11 rounded-lg border border-[#1e2329] bg-[#0b0e11] px-4 text-sm font-mono text-[#eaecef] focus:outline-none focus:ring-2 focus:ring-[#f7a600]/40"
            />
            <button
              type="submit"
              disabled={isSending}
              className="w-full h-11 rounded-lg bg-[#f7a600] text-[#0b0e11] font-bold text-sm disabled:opacity-50"
            >
              {isSending ? "Sending..." : "Send XLM"}
            </button>
          </form>
        </div>
      )}

      {/* Transaction feedback */}
      {txBanner?.type === "success" && (
        <div className="rounded-xl border border-[#0ecb81]/40 bg-[#0ecb81]/10 p-4 space-y-1">
          <p className="text-sm font-mono font-bold text-[#0ecb81]">
            Transaction sent! Hash: {txBanner.hash}
          </p>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txBanner.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-[#0ecb81] underline underline-offset-2"
          >
            View on Stellar Expert →
          </a>
        </div>
      )}
      {txBanner?.type === "error" && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-sm font-mono font-bold text-red-400">
            Transaction failed: {txBanner.message}
          </p>
        </div>
      )}

      {/* General wallet errors */}
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-sm font-mono text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
