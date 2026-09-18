"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/language-provider";

interface ChatMessage {
  senderId: string;
  text: string;
  createdAt: string;
}

/**
 * Chat panel for a collaboration request. Only visible to the two parties.
 * Renders the initial proposal message + subsequent chat messages.
 */
export function CollabChatPanel({
  contributionId,
  reqId,
  isAuthor,
}: {
  contributionId: string;
  reqId: string;
  isAuthor: boolean;
}) {
  const { data: session } = useSession();
  const { t, locale } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [initialMessage, setInitialMessage] = useState("");
  const [status, setStatus] = useState("pending");
  const [newText, setNewText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(
      `/api/contributions/${contributionId}/collab/${reqId}/messages`
    ).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
      setInitialMessage(data.initialMessage ?? "");
      setStatus(data.status);
    }
    setLoading(false);
  }, [contributionId, reqId]);

  useEffect(() => {
    fetchMessages();
    // Poll every 10 seconds while chat is open
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || sending) return;
    setSending(true);

    const res = await fetch(
      `/api/contributions/${contributionId}/collab/${reqId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText.trim() }),
      }
    ).catch(() => null);

    if (res?.ok) {
      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setStatus(data.status);
      setNewText("");
    }
    setSending(false);
  };

  const handleAction = async (action: "accept" | "decline" | "chat_first") => {
    const res = await fetch(
      `/api/contributions/${contributionId}/collab/${reqId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      }
    ).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setStatus(data.status);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border p-3 animate-pulse">
        <div className="h-4 w-1/3 bg-muted rounded mb-2" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  const canChat = ["pending", "chatting"].includes(status);
  const isTerminal = ["accepted", "declined", "withdrawn"].includes(status);

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t("contribution.chatTitle")}</p>
        <Badge
          variant={
            status === "accepted"
              ? "default"
              : status === "declined"
                ? "destructive"
                : "secondary"
          }
        >
          {locale === "en" ? status : t(`collabStatus.${status}`)}
        </Badge>
      </div>

      {/* Messages */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {/* Initial proposal message */}
        {initialMessage && (
          <div className="text-sm bg-background rounded p-2 border">
            <span className="text-xs text-muted-foreground">{t("contribution.proposal")}</span>
            <p className="mt-0.5">{initialMessage}</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === session?.user?.id;
          return (
            <div
              key={i}
              className={`text-sm rounded p-2 ${
                isMe
                  ? "bg-primary/10 ml-6 border border-primary/20"
                  : "bg-background mr-6 border"
              }`}
            >
              <p>{msg.text}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isMe ? t("common.you") : t("contribution.them")} ·{" "}
                {new Date(msg.createdAt).toLocaleTimeString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Send message */}
      {canChat && (
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={t("contribution.messagePlaceholder")}
            className="text-sm"
            maxLength={2000}
          />
          <Button type="submit" size="sm" disabled={sending || !newText.trim()}>
            {sending ? "..." : t("contribution.send")}
          </Button>
        </form>
      )}

      {/* Author action buttons */}
      {isAuthor && canChat && (
        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" onClick={() => handleAction("accept")}>
            {t("contribution.acceptUnlock")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction("decline")}
          >
            {t("contribution.decline")}
          </Button>
        </div>
      )}

      {/* Terminal state messages */}
      {status === "accepted" && (
        <p className="text-xs text-green-600">
          {t("contribution.collabAcceptedNote")}
        </p>
      )}
      {status === "declined" && (
        <p className="text-xs text-muted-foreground">
          {t("contribution.collabDeclinedNote")}
        </p>
      )}
    </div>
  );
}
