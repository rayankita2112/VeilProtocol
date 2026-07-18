export const PROTOCOL_EVENT_TYPES = Object.freeze({
  DEPOSIT: "deposit",
  WITHDRAWAL: "withdrawal",
  RATE_UPDATED: "rate_updated",
  SWAP_EXECUTED: "swap_executed",
  TREE_SYNC: "tree_sync",
});

const DEFAULT_INTERVAL_MS = 12_000;

export function normalizeTreeSnapshot(payload = {}) {
  const nextIndex = Number(payload.nextIndex ?? payload.depositCount ?? 0);
  const currentRoot = String(
    payload.currentRoot ?? payload.lastRoot ?? "0".repeat(64),
  );
  const network = String(payload.network ?? "testnet");
  const denominationXLM = Number(payload.denominationXLM ?? 100);

  return {
    contractId: payload.contractId ?? "",
    nextIndex: Number.isFinite(nextIndex) && nextIndex >= 0 ? nextIndex : 0,
    depositCount: Number.isFinite(nextIndex) && nextIndex >= 0 ? nextIndex : 0,
    currentRoot,
    lastRoot: currentRoot,
    currentRootIndex: Number(payload.currentRootIndex ?? 0),
    denominationXLM:
      Number.isFinite(denominationXLM) && denominationXLM > 0
        ? denominationXLM
        : 100,
    network,
    syncedAt: new Date().toISOString(),
  };
}

export function classifyTreeChange(previous, next) {
  if (!previous) return PROTOCOL_EVENT_TYPES.TREE_SYNC;
  if (next.nextIndex > previous.nextIndex) return PROTOCOL_EVENT_TYPES.DEPOSIT;
  if (next.currentRoot !== previous.currentRoot) {
    return PROTOCOL_EVENT_TYPES.TREE_SYNC;
  }
  return PROTOCOL_EVENT_TYPES.TREE_SYNC;
}

export function createTreeEventPoller({
  fetcher,
  poolId = "",
  intervalMs = DEFAULT_INTERVAL_MS,
  onSnapshot = () => {},
  onError = () => {},
  setTimer = globalThis.setInterval?.bind(globalThis),
  clearTimer = globalThis.clearInterval?.bind(globalThis),
} = {}) {
  let timer = null;
  let stopped = true;
  let latest = null;
  let inFlight = false;

  const readTree =
    fetcher ??
    (async () => {
      const suffix = poolId ? `?poolId=${encodeURIComponent(poolId)}` : "";
      const response = await fetch(`/api/tree${suffix}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Tree sync failed with status ${response.status}`);
      }
      return response.json();
    });

  async function syncNow(reason = "manual") {
    if (inFlight) return latest;
    inFlight = true;
    try {
      const raw = await readTree();
      const snapshot = normalizeTreeSnapshot(raw);
      const eventType = classifyTreeChange(latest, snapshot);
      latest = snapshot;
      onSnapshot(snapshot, {
        type: eventType,
        reason,
        recovered: reason === "online" || reason === "visibility",
      });
      return snapshot;
    } catch (error) {
      onError(error);
      return latest;
    } finally {
      inFlight = false;
    }
  }

  function start() {
    if (!stopped) return;
    stopped = false;
    void syncNow("initial");
    if (setTimer && intervalMs > 0) {
      timer = setTimer(() => {
        void syncNow("interval");
      }, intervalMs);
    }
  }

  function stop() {
    stopped = true;
    if (timer && clearTimer) clearTimer(timer);
    timer = null;
  }

  function handleVisibilityChange() {
    if (globalThis.document?.visibilityState === "visible") {
      void syncNow("visibility");
    }
  }

  function handleOnline() {
    void syncNow("online");
  }

  return {
    start,
    stop,
    syncNow,
    handleVisibilityChange,
    handleOnline,
    getSnapshot: () => latest,
  };
}
