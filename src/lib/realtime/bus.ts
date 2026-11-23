import { EventEmitter } from "events";

export interface RealtimePayload {
  event:
    | "notification"
    | "chat_insert"
    | "chat_update"
    | "chat_delete"
    | "typing"
    | "presence"
    | "virtual_hug"
    | "love_garden";
  data: unknown;
}

interface RealtimeBusStore {
  emitter: EventEmitter;
  onlineByCouple: Map<string, Set<string>>;
}

const globalForRealtime = globalThis as unknown as {
  __olwRealtimeBus?: RealtimeBusStore;
};

function getBus(): RealtimeBusStore {
  if (!globalForRealtime.__olwRealtimeBus) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(200);
    globalForRealtime.__olwRealtimeBus = {
      emitter,
      onlineByCouple: new Map(),
    };
  }
  return globalForRealtime.__olwRealtimeBus;
}

export function publishCoupleEvent(coupleId: string, payload: RealtimePayload) {
  getBus().emitter.emit(`couple:${coupleId}`, payload);
}

export function publishUserNotification(userId: string, notification: unknown) {
  getBus().emitter.emit(`user:${userId}`, {
    event: "notification",
    data: notification,
  } satisfies RealtimePayload);
}

export function subscribeRealtime(
  coupleId: string,
  userId: string,
  listener: (payload: RealtimePayload) => void
): () => void {
  const bus = getBus();
  const coupleKey = `couple:${coupleId}`;
  const userKey = `user:${userId}`;

  bus.emitter.on(coupleKey, listener);
  bus.emitter.on(userKey, listener);

  // Presence tracking
  if (!bus.onlineByCouple.has(coupleId)) {
    bus.onlineByCouple.set(coupleId, new Set());
  }
  const set = bus.onlineByCouple.get(coupleId)!;
  set.add(userId);
  publishCoupleEvent(coupleId, {
    event: "presence",
    data: { onlineUserIds: Array.from(set) },
  });

  return () => {
    bus.emitter.off(coupleKey, listener);
    bus.emitter.off(userKey, listener);
    const activeSet = bus.onlineByCouple.get(coupleId);
    if (activeSet) {
      activeSet.delete(userId);
      publishCoupleEvent(coupleId, {
        event: "presence",
        data: { onlineUserIds: Array.from(activeSet) },
      });
    }
  };
}

export function getCoupleOnlineUsers(coupleId: string): string[] {
  return Array.from(getBus().onlineByCouple.get(coupleId) ?? []);
}
