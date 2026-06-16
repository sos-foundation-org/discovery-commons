"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    if (status === "authenticated") fetchNotifications();
  }, [status, router]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    const res = await fetch("/api/notifications").catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
    setIsLoading(false);
  };

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="h-8 w-48 animate-pulse rounded bg-muted mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No notifications yet. Activity on your threads will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                notif.isRead ? "bg-background" : "bg-primary/5 border-primary/20"
              }`}
            >
              {!notif.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{notif.title}</p>
                <p className="text-sm text-muted-foreground">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {timeAgo(notif.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {notif.linkUrl && (
                  <Link
                    href={notif.linkUrl}
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </Link>
                )}
                {!notif.isRead && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
