import { type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/cookie";
import { queryOne } from "@/lib/db/mysql";
import { getCoupleOnlineUsers, subscribeRealtime } from "@/lib/realtime/bus";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const member = await queryOne<{ couple_id: string }>(
    "SELECT couple_id FROM couple_members WHERE user_id = ? LIMIT 1",
    [user.id]
  );

  if (!member?.couple_id) {
    return new Response("No couple space", { status: 403 });
  }

  const coupleId = member.couple_id;
  const encoder = new TextEncoder();

  let cleanup: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream closed
        }
      };

      cleanup = subscribeRealtime(coupleId, user.id, (payload) => {
        sendEvent(payload.event, payload.data);
      });

      // Immediately inform client of current presence
      sendEvent("presence", { onlineUserIds: getCoupleOnlineUsers(coupleId) });

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          if (heartbeat) clearInterval(heartbeat);
        }
      }, 25000);

      request.signal.addEventListener("abort", () => {
        if (heartbeat) clearInterval(heartbeat);
        if (cleanup) cleanup();
      });
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
