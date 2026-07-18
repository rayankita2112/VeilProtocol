declare module "@/lib/event-stream.mjs" {
  export const PROTOCOL_EVENT_TYPES: Readonly<{
    DEPOSIT: "deposit";
    WITHDRAWAL: "withdrawal";
    RATE_UPDATED: "rate_updated";
    SWAP_EXECUTED: "swap_executed";
    TREE_SYNC: "tree_sync";
  }>;

  export interface TreeSnapshot {
    contractId: string;
    nextIndex: number;
    depositCount: number;
    currentRoot: string;
    lastRoot: string;
    currentRootIndex: number;
    denominationXLM: number;
    network: string;
    syncedAt: string;
    leafCount?: number;
  }

  export interface TreeEvent {
    type: string;
    reason: string;
    recovered: boolean;
  }

  export function normalizeTreeSnapshot(payload?: unknown): TreeSnapshot;
  export function classifyTreeChange(
    previous: TreeSnapshot | null,
    next: TreeSnapshot,
  ): string;
  export function createTreeEventPoller(options?: {
    fetcher?: () => Promise<unknown>;
    poolId?: string;
    intervalMs?: number;
    onSnapshot?: (snapshot: TreeSnapshot, event: TreeEvent) => void;
    onError?: (error: unknown) => void;
    setTimer?: (callback: () => void, intervalMs: number) => unknown;
    clearTimer?: (timer: unknown) => void;
  }): {
    start: () => void;
    stop: () => void;
    syncNow: (reason?: string) => Promise<TreeSnapshot | null>;
    handleVisibilityChange: () => void;
    handleOnline: () => void;
    getSnapshot: () => TreeSnapshot | null;
  };
}
