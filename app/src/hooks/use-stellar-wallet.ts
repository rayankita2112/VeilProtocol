"use client";

import { useCallback, useEffect, useState } from "react";
import { connectWallet, getWalletAddress, signTx } from "@/lib/stellar-wallet";
import {
  fetchXlmBalance,
  buildPaymentXdr,
  submitSignedTx,
  AccountNotFoundError,
} from "@/lib/stellar-sdk";

interface WalletState {
  address: string | null;
  balance: string | null;
  isFunded: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    isFunded: true,
    isConnected: false,
    isLoading: false,
    error: null,
  });

  const refreshBalance = useCallback(
    async (address?: string) => {
      const target = address ?? state.address;
      if (!target) return;
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const balance = await fetchXlmBalance(target);
        setState((s) => ({ ...s, balance, isFunded: true, isLoading: false }));
      } catch (err) {
        if (err instanceof AccountNotFoundError) {
          setState((s) => ({
            ...s,
            balance: "0",
            isFunded: false,
            isLoading: false,
          }));
          return;
        }
        setState((s) => ({
          ...s,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to fetch balance",
        }));
      }
    },
    [state.address],
  );

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const address = await connectWallet();
      setState((s) => ({
        ...s,
        address,
        isConnected: true,
        isLoading: false,
      }));
      await refreshBalance(address);
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to connect wallet",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      balance: null,
      isFunded: true,
      isConnected: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const sendXlm = useCallback(
    async (to: string, amount: string): Promise<{ hash: string }> => {
      if (!state.address) {
        throw new Error("Wallet not connected");
      }
      setState((s) => ({ ...s, isLoading: true, error: null }));
      try {
        const xdr = await buildPaymentXdr(state.address, to, amount);
        const signedXdr = await signTx(xdr);
        const result = await submitSignedTx(signedXdr);
        setState((s) => ({ ...s, isLoading: false }));
        await refreshBalance(state.address);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to send XLM";
        setState((s) => ({ ...s, isLoading: false, error: message }));
        throw new Error(message, { cause: err });
      }
    },
    [state.address, refreshBalance],
  );

  // Restore an already-authorized wallet session on mount.
  useEffect(() => {
    (async () => {
      const address = await getWalletAddress();
      if (address) {
        setState((s) => ({ ...s, address, isConnected: true }));
        await refreshBalance(address);
      }
    })();
  }, []);

  return {
    address: state.address,
    balance: state.balance,
    isFunded: state.isFunded,
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    error: state.error,
    connect,
    disconnect,
    refreshBalance: () => refreshBalance(),
    sendXlm,
  };
}
