import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import type { Transaction } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetTransactions } from "../hooks/useQueries";
import {
  formatAmount,
  formatPrincipal,
  formatTimestamp,
} from "../utils/formatters";

function TxRow({
  tx,
  myPrincipal,
  index,
}: { tx: Transaction; myPrincipal: string; index: number }) {
  const isSent = tx.sender.toString() === myPrincipal;
  const otherParty = isSent ? tx.recipient : tx.sender;

  return (
    <div
      className="flex items-center gap-4 py-4 border-b border-border last:border-0"
      data-ocid={`activity.item.${index}`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isSent ? "bg-red-100" : "bg-green-100"
        }`}
      >
        {isSent ? (
          <ArrowUpRight className="w-5 h-5 text-red-600" />
        ) : (
          <ArrowDownLeft className="w-5 h-5 text-green-700" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">
          {isSent ? "Sent to" : "Received from"}
        </p>
        <p className="text-xs text-muted-foreground font-mono truncate">
          {formatPrincipal(otherParty)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatTimestamp(tx.timestamp)}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p
          className={`text-base font-bold ${
            isSent ? "text-red-600" : "text-green-700"
          }`}
        >
          {isSent ? "-" : "+"}₹{formatAmount(tx.amount)}
        </p>
        <Badge
          variant="secondary"
          className={`text-xs mt-1 ${
            isSent
              ? "bg-red-50 text-red-700 hover:bg-red-50"
              : "bg-green-50 text-green-700 hover:bg-green-50"
          }`}
        >
          {isSent ? "Sent" : "Received"}
        </Badge>
      </div>
    </div>
  );
}

export function ActivityPage() {
  const { data: transactions, isLoading } = useGetTransactions();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString() ?? "";

  const sorted = (transactions ?? []).slice().sort((a, b) => {
    return Number(b.timestamp - a.timestamp);
  });

  return (
    <main className="max-w-[800px] mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Activity
            className="w-6 h-6"
            style={{ color: "oklch(0.48 0.14 148)" }}
          />
          Transaction Activity
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your complete payment history
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Card className="rounded-xl shadow-card" data-ocid="activity.card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              All Transactions
              {!isLoading && (
                <span className="text-xs font-normal text-muted-foreground">
                  {sorted.length} transaction{sorted.length !== 1 ? "s" : ""}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div
                className="space-y-4 py-2"
                data-ocid="activity.loading_state"
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div
                className="text-center py-16"
                data-ocid="activity.empty_state"
              >
                <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">
                  No transactions yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Scan a QR code to make your first payment
                </p>
              </div>
            ) : (
              <div data-ocid="activity.list">
                {sorted.map((tx, i) => (
                  <TxRow
                    key={`${tx.timestamp}-${i}`}
                    tx={tx}
                    myPrincipal={myPrincipal}
                    index={i + 1}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
