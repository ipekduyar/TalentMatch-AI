import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Clock, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getCurrentUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from "@/lib/notifications-service";
import { cn } from "@/lib/utils";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const NOTIFICATIONS_UPDATED_EVENT = "notifications-updated";

const dispatchNotificationsUpdated = () => {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
};

const getNotificationIcon = (type: string) => {
  if (type === "new_message") return Mail;
  if (type === "status_update") return CheckCircle2;
  return Bell;
};

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.isRead).length, [notifications]);

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setNotifications(await getCurrentUserNotifications());
      dispatchNotificationsUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const handleMarkAsRead = async (notification: AppNotification) => {
    if (notification.isRead || markingId) return;
    setMarkingId(notification.notificationId);
    setError(null);
    try {
      await markNotificationAsRead(notification.notificationId);
      setNotifications((current) => current.map((item) => (
        item.notificationId === notification.notificationId ? { ...item, isRead: true } : item
      )));
      dispatchNotificationsUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark notification as read.");
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!unreadCount || isMarkingAll) return;
    setIsMarkingAll(true);
    setError(null);
    try {
      await markAllNotificationsAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      dispatchNotificationsUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark notifications as read.");
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-500">Notification center</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}` : "You're all caught up."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadNotifications()} disabled={isLoading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={handleMarkAllAsRead} disabled={!unreadCount || isMarkingAll}>
            Mark all as read
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-4 text-sm font-semibold text-rose-700">{error}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <Card className="bg-white">
          <CardContent className="flex items-center gap-3 p-6 text-sm font-semibold text-slate-500">
            <RefreshCw className="h-4 w-4 animate-spin" /> Loading notifications...
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="bg-white">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Bell className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No notifications yet</h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Application status changes and new messages will appear here as soon as they happen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            return (
              <Card
                key={notification.notificationId}
                role="button"
                tabIndex={0}
                onClick={() => void handleMarkAsRead(notification)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    void handleMarkAsRead(notification);
                  }
                }}
                className={cn(
                  "cursor-pointer border transition hover:border-indigo-200 hover:shadow-sm",
                  notification.isRead ? "bg-white" : "border-indigo-200 bg-indigo-50/70",
                )}
              >
                <CardContent className="flex gap-4 p-5">
                  <div className={cn(
                    "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                    notification.isRead ? "bg-slate-100 text-slate-500" : "bg-indigo-600 text-white",
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{notification.type.replace(/_/g, " ")}</p>
                      {!notification.isRead && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">Unread</span>}
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900">{notification.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{notification.message}</p>
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Clock className="h-3.5 w-3.5" /> {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
