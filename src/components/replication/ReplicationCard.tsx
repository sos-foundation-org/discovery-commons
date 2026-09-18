"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ReplicationStatus } from "./ReplicationStatus";
import { useI18n } from "@/components/language-provider";
import { formatDateL } from "@/lib/i18n";

interface ReplicationCardData {
  id: string;
  outcome: string;
  notes?: string | null;
  createdAt: string | Date;
  replicationThread: { id: string; title: string };
}

// Single replication summary card shown on an original thread.
export function ReplicationCard({ replication }: { replication: ReplicationCardData }) {
  const { t, locale } = useI18n();
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/threads/${replication.replicationThread.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {replication.replicationThread.title}
          </Link>
          <ReplicationStatus outcome={replication.outcome} />
        </div>
        {replication.notes && (
          <p className="mt-2 text-sm text-muted-foreground">{replication.notes}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {t("thread.rep.registeredOn", {
            date: formatDateL(new Date(replication.createdAt), locale),
          })}
        </p>
      </CardContent>
    </Card>
  );
}
