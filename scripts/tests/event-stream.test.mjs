import test from "node:test";
import assert from "node:assert/strict";

import {
  PROTOCOL_EVENT_TYPES,
  classifyTreeChange,
  createTreeEventPoller,
  normalizeTreeSnapshot,
} from "../../app/src/lib/event-stream.mjs";

test("normalizes tree API payloads for frontend state", () => {
  const snapshot = normalizeTreeSnapshot({
    nextIndex: "7",
    currentRoot: "abc",
    network: "testnet",
  });

  assert.equal(snapshot.depositCount, 7);
  assert.equal(snapshot.nextIndex, 7);
  assert.equal(snapshot.lastRoot, "abc");
  assert.equal(snapshot.denominationXLM, 100);
});

test("classifies increased tree index as a deposit event", () => {
  const previous = normalizeTreeSnapshot({ nextIndex: 2, currentRoot: "a" });
  const next = normalizeTreeSnapshot({ nextIndex: 3, currentRoot: "b" });

  assert.equal(
    classifyTreeChange(previous, next),
    PROTOCOL_EVENT_TYPES.DEPOSIT,
  );
});

test("poller emits initial and interval snapshots without overlapping syncs", async () => {
  const callbacks = [];
  const timers = [];
  let calls = 0;
  const poller = createTreeEventPoller({
    fetcher: async () => {
      calls += 1;
      return { nextIndex: calls, currentRoot: `root-${calls}` };
    },
    setTimer: (callback) => {
      timers.push(callback);
      return callback;
    },
    clearTimer: () => {},
    onSnapshot: (snapshot, event) => callbacks.push({ snapshot, event }),
  });

  poller.start();
  await Promise.resolve();
  await timers[0]();

  assert.equal(callbacks.length, 2);
  assert.equal(callbacks[0].event.reason, "initial");
  assert.equal(callbacks[1].event.type, PROTOCOL_EVENT_TYPES.DEPOSIT);
  assert.equal(poller.getSnapshot().nextIndex, 2);
  poller.stop();
});
