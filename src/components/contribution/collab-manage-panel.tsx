"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { CollabChatPanel } from "./collab-chat-panel";
import { useI18n } from "@/components/language-provider";

interface CollabRequest {
  id: string;
  status: string;
  seekingType: string;
  message?: string;
  createdAt: string;
  applicant?: {
    id: string;
    displayName: string | null;
    name: string | null;
    image: string | null;
  };
}

interface CollabData {
  counts: { total: number; pending: number; chatting: number; accepted: number };
  requests?: CollabRequest[];
  myRequest?: { id: string; status: string; createdAt: string } | null;
}

/**
 * Shows collaboration requests on a contribution.
 * - Author sees a list of requests with Accept/Decline/Chat actions
 * - Applicant sees their own request status + chat if chatting/accepted
 * - Others see only counts
 */
export function CollabManagePanel({
  contributionId,
}: {
  contributionId: string;
}) {
  const { data: session } = useSession();
  const { t, locale } = useI18n();
  const [data, setData] = useState<CollabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/contributions/${contributionId}/collab`).catch(
      () => null
    );
    if (res?.ok) {
      const d = await res.json();
      setData(d);
      setIsAuthor(!!d.requests); // author gets the requests array
    }
    setLoading(false);
  }, [contributionId]);

  useEffect(() => {
    if (session) fetchData();
    else setLoading(false);
  }, [session, fetchData]);

  if (loading || !data) return null;
  if (data.counts.total === 0 && !data.myRequest) return null;

  const { counts } = data;

  // Show reach-out counts (visible to everyone — R10: hide if < 3)
  const showCounts = counts.total >= 3;

  return (
    <div className="mt-3 space-y-2">
      {/* Public counts (social proof) */}
      {showCounts && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>&#x1F91D; {t("contribution.interestedCount", { n: counts.total })}</span>
          {counts.chatting > 0 && (
            <span>&#x1F4AC; {t("contribution.chattingCount", { n: counts.chatting })}</span>
          )}
          {counts.accepted > 0 && (
            <span>&#x2705; {t("contribution.collaboratingCount", { n: counts.accepted })}</span>
          )}
        </div>
      )}

      {/* Applicant's own request */}
      {data.myRequest && !isAuthor && (
        <div className="rounded-lg border p-2">
          <div className="flex items-center gap-2 text-xs">
            <span>{t("contribution.yourRequest")}</span>
            <Badge
              variant={
                data.myRequest.status === "accepted"
                  ? "default"
                  : data.myRequest.status === "declined"
                    ? "destructive"
                    : "secondary"
              }
              className="text-xs"
            >
              {locale === "en" ? data.myRequest.status : t(`collabStatus.${data.myRequest.status}`)}
            </Badge>
          </div>
          {["chatting", "accepted"].includes(data.myRequest.status) && (
            <div className="mt-2">
              <CollabChatPanel
                contributionId={contributionId}
                reqId={data.myRequest.id}
                isAuthor={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Author's management panel */}
      {isAuthor && data.requests && data.requests.length > 0 && (
        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-sm font-medium">
            {t("contribution.collabRequests", { n: counts.total })}
          </p>
          <div className="space-y-2">
            {data.requests.map((req) => (
              <div key={req.id} className="rounded border bg-background p-2">
                <div className="flex items-center gap-2 mb-1">
                  {req.applicant && (
                    <AvatarBadge
                      name={req.applicant.displayName || req.applicant.name}
                      seed={req.applicant.id}
                      image={req.applicant.image}
                      size="sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">
                      {req.applicant?.displayName || req.applicant?.name || t("contribution.user")}
                    </span>
                    <Badge
                      variant="secondary"
                      className="ml-2 text-xs"
                    >
                      {locale === "en" ? req.seekingType : t(`collab.${req.seekingType}`)}
                    </Badge>
                    <Badge
                      variant={
                        req.status === "accepted"
                          ? "default"
                          : req.status === "declined"
                            ? "destructive"
                            : "secondary"
                      }
                      className="ml-1 text-xs"
                    >
                      {locale === "en" ? req.status : t(`collabStatus.${req.status}`)}
                    </Badge>
                  </div>
                </div>
                {req.message && (
                  <p className="text-xs text-muted-foreground mb-2">
                    &ldquo;{req.message}&rdquo;
                  </p>
                )}

                {/* Inline chat panel for chatting/accepted */}
                {["chatting", "accepted"].includes(req.status) &&
                  openChatId === req.id && (
                    <CollabChatPanel
                      contributionId={contributionId}
                      reqId={req.id}
                      isAuthor={true}
                    />
                  )}

                {/* Action buttons for pending/chatting */}
                {["pending", "chatting"].includes(req.status) && (
                  <div className="flex gap-1.5 mt-1">
                    {openChatId !== req.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-sm min-h-[44px]"
                        onClick={() => setOpenChatId(req.id)}
                      >
                        &#x1F4AC; {t("contribution.chat")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
