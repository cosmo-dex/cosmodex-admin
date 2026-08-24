import { NextRequest } from 'next/server';
import { notificationEmitter, NotificationBroadcastEvent } from '@/lib/notificationEvents';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get(SESSION_COOKIE);
  const session = await verifySession(sessionCookie?.value);
  const currentUserId = session?.userId;
  const currentRole = session?.role;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ connected: true, timestamp: new Date().toISOString() })}\n\n`)
      );

      const onNotificationEvent = (event: NotificationBroadcastEvent) => {
        try {
          if (event.notification?.target_type === 'user' && event.notification?.target_user_id) {
            if (event.notification.target_user_id !== currentUserId) {
              return;
            }
          }

          if (event.notification?.target_type === 'role' && event.notification?.target_role) {
            if (event.notification.target_role !== currentRole) {
              return;
            }
          }

          controller.enqueue(
            encoder.encode(`event: notification\ndata: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
        }
      };

      notificationEmitter.on('notification_event', onNotificationEvent);

      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 20000);

      req.signal.addEventListener('abort', () => {
        notificationEmitter.off('notification_event', onNotificationEvent);
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
