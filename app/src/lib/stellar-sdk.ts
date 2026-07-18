/**
 * Stellar SDK helpers for balance lookups and payment transactions on testnet.
 */
import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import {
  STELLAR_TESTNET_PASSPHRASE,
  HORIZON_TESTNET_URL,
} from "./stellar-wallet";

const server = new Horizon.Server(HORIZON_TESTNET_URL);

/** Thrown by fetchXlmBalance when the account has never been funded on testnet. */
export class AccountNotFoundError extends Error {
  constructor(address: string) {
    super(`Account ${address} not found on testnet (not funded)`);
    this.name = "AccountNotFoundError";
  }
}

/**
 * Fetches the native XLM balance for an address from Horizon testnet.
 * Throws AccountNotFoundError when the account is unfunded (HTTP 404).
 */
export async function fetchXlmBalance(address: string): Promise<string> {
  try {
    const account = await server.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    return native?.balance ?? "0";
  } catch (err: unknown) {
    if (isNotFoundError(err)) {
      throw new AccountNotFoundError(address);
    }
    throw err;
  }
}

function isNotFoundError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const response = (err as { response?: { status?: number } }).response;
  return response?.status === 404;
}

/** Builds an unsigned payment transaction XDR for sending native XLM. */
export async function buildPaymentXdr(
  from: string,
  to: string,
  amount: string,
): Promise<string> {
  const account = await server.loadAccount(from);

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: to,
        asset: Asset.native(),
        amount,
      }),
    )
    .setTimeout(30)
    .build();

  return transaction.toXDR();
}

/** Submits a signed payment transaction XDR to Horizon testnet. */
export async function submitSignedTx(
  signedXdr: string,
): Promise<{ hash: string }> {
  const transaction = TransactionBuilder.fromXDR(
    signedXdr,
    STELLAR_TESTNET_PASSPHRASE,
  );
  const result = await server.submitTransaction(transaction);
  return { hash: result.hash };
}
