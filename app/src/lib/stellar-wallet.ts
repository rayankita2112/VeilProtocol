/**
 * Freighter wallet integration — detection, connect/disconnect, and signing.
 * All operations target Stellar TESTNET.
 */
import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";

export const STELLAR_TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
export const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";

export const FREIGHTER_INSTALL_URL = "https://freighter.app";

/** Detects whether the Freighter browser extension is present. */
export async function detectFreighter(): Promise<boolean> {
  const result = await isConnected();
  if (result.error) return false;
  return result.isConnected;
}

/**
 * Requests permission to access the wallet and returns the connected
 * G-address. Falls back to requestAccess() if the app isn't allowed yet.
 */
export async function connectWallet(): Promise<string> {
  const allowed = await isAllowed();
  if (allowed.error) {
    throw new Error(allowed.error.message);
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error.message);
  }
  if (!access.address) {
    throw new Error("Freighter did not return a wallet address");
  }
  return access.address;
}

/** Returns the currently authorized wallet address, or null if not allowed/connected. */
export async function getWalletAddress(): Promise<string | null> {
  const allowed = await isAllowed();
  if (allowed.error || !allowed.isAllowed) return null;

  const result = await getAddress();
  if (result.error || !result.address) return null;
  return result.address;
}

/** Signs a transaction XDR with Freighter using the testnet network passphrase. */
export async function signTx(xdr: string): Promise<string> {
  const result = await signTransaction(xdr, {
    networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
  });
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.signedTxXdr;
}
