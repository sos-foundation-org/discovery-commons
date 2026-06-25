import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ReplicationStatus } from "./ReplicationStatus";
import { formatDate } from "@/lib/utils";

interface ReplicationCardData {
  id: string;
  outcome: string;
  notes?: string | null;
  createdAt: string | Date;
  replicationThread: { id: string; title: string };
}

// Single replication summary card shown on an original thread.
export function ReplicationCard({ replication }: { replication: ReplicationCardData }) {
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
          Registered {formatDate(new Date(replication.createdAt))}
        </p>
      </CardContent>
    </Card>
  );
}
