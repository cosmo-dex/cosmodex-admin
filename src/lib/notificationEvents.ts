import { EventEmitter } from 'events';

export interface NotificationPayload {
  id: string;
  title: string;
  description?: string | null;
  type?: string | null;
  link?: string | null;
  target_type?: string | null;
  target_role?: string | null;
  target_user_id?: string | null;
  created_at?: string | Date | null;
  read?: boolean;
}

export type NotificationEventType =
  | 'notification:created'
  | 'notification:updated'
  | 'notification:deleted'
  | 'notification:read_all'
  | 'notification:cleared_all';

export interface NotificationBroadcastEvent {
  type: NotificationEventType;
  notification?: NotificationPayload;
  notificationId?: string;
  userId?: string;
  timestamp: string;
}

declare global {
  var __adminNotificationEmitter: EventEmitter | undefined;
}

export const notificationEmitter: EventEmitter =
  globalThis.__adminNotificationEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__adminNotificationEmitter = notificationEmitter;
}

notificationEmitter.setMaxListeners(500);

export function broadcastNotificationEvent(event: NotificationBroadcastEvent) {
  notificationEmitter.emit('notification_event', event);
}
