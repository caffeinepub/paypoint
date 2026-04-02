import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  IndianRupee,
  QrCode,
  ScanLine,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import type { Transaction, UserProfile } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetBalance, useGetTransactions } from "../hooks/useQueries";
import {
  formatAmount,
  formatPrincipal,
  formatTimestamp,
} from "../utils/formatters";

interface DashboardPageProps {
  userProfile: UserProfile | null;
}

function TransactionRow({
  tx,
  myPrincipal,
  index,
}: { tx: Transaction; myPrincipal: string; index: number }) {
  const isSent = tx.sender.toString() === myPrincipal;
  const otherParty = isSent ? tx.recipient : tx.sender;
  return (
    <div
      className="flex items-center justify-between py-3 border-b border-border last:border-0"
      data-ocid={`activity.item.${index}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isSent ? "bg-red-100" : "bg-green-100"
          }`}
        >
          {isSent ? (
            <ArrowUpRight className="w-4 h-4 text-red-600" />
          ) : (
            <ArrowDownLeft className="w-4 h-4 text-green-700" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {isSent ? "Sent to" : "Received from"} {formatPrincipal(otherParty)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTimestamp(tx.timestamp)}
          </p>
        </div>
      </div>
      <span
        className={`text-sm font-bold shrink-0 ${
          isSent ? "text-red-600" : "text-green-700"
        }`}
      >
        {isSent ? "-" : "+"}₹{formatAmount(tx.amount)}
      </span>
    </div>
  );
}

export function DashboardPage({ userProfile }: DashboardPageProps) {
  const { data: balance, isLoading: balanceLoading } = useGetBalance();
  const { data: transactions, isLoading: txLoading } = useGetTransactions();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString() ?? "";

  const recentTxs = (transactions ?? [])
    .slice()
    .sort((a, b) => {
      return Number(b.timestamp - a.timestamp);
    })
    .slice(0, 5);

  return (
    <main className="max-w-[1200px] mx-auto px-4 py-8">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold font-display text-foreground">
          Welcome back, {userProfile?.name ?? "User"}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your points wallet and transactions
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (65%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet Balance card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <Card
              className="rounded-xl shadow-card overflow-hidden"
              data-ocid="balance.card"
            >
              <div
                className="p-6"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.19 0.06 243) 0%, oklch(0.28 0.09 243) 100%)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/70 text-sm font-medium mb-1">
                      Wallet Balance
                    </p>
                    {balanceLoading ? (
                      <Skeleton
                        className="h-12 w-48 bg-white/20"
                        data-ocid="balance.loading_state"
                      />
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-5xl font-bold text-white">₹</span>
                        <span className="text-5xl font-bold text-white">
                          {formatAmount(balance ?? BigInt(0))}
                        </span>
                      </div>
                    )}
                    <p className="text-white/50 text-xs mt-2">1 point = ₹1</p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "oklch(0.48 0.14 148)" }}
                  >
                    <IndianRupee className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-card flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-paygreen" />
                <span className="text-xs text-muted-foreground">
                  Your current available balance
                </span>
              </div>
            </Card>
          </motion.div>

          {/* Action cards */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            <Link to="/scan" data-ocid="dashboard.scan_button">
              <Card className="rounded-xl shadow-card hover:shadow-card-hover transition-shadow cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "oklch(0.94 0.05 148)" }}
                  >
                    <ScanLine
                      className="w-6 h-6"
                      style={{ color: "oklch(0.38 0.12 148)" }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Scan to Pay</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Scan a QR & send points
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/qr" data-ocid="dashboard.qr_button">
              <Card className="rounded-xl shadow-card hover:shadow-card-hover transition-shadow cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "oklch(0.91 0.04 243)" }}
                  >
                    <QrCode
                      className="w-6 h-6"
                      style={{ color: "oklch(0.35 0.10 243)" }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">My QR Code</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Share to receive points
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* Quick Actions pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="flex flex-wrap gap-2"
          >
            <Link
              to="/activity"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-secondary hover:bg-secondary/80 transition-colors"
              data-ocid="dashboard.activity.link"
            >
              <Zap
                className="w-3.5 h-3.5"
                style={{ color: "oklch(0.48 0.14 148)" }}
              />
              View All Activity
            </Link>
            <Link
              to="/qr"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-secondary hover:bg-secondary/80 transition-colors"
              data-ocid="dashboard.qr.link"
            >
              <QrCode
                className="w-3.5 h-3.5"
                style={{ color: "oklch(0.35 0.10 243)" }}
              />
              My QR Code
            </Link>
          </motion.div>
        </div>

        {/* Right column (35%) */}
        <div className="space-y-6">
          {/* Recent Scans */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
          >
            <Card
              className="rounded-xl shadow-card"
              data-ocid="recent_activity.card"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  Recent Transactions
                  <Link
                    to="/activity"
                    className="text-xs font-normal"
                    style={{ color: "oklch(0.48 0.14 148)" }}
                    data-ocid="recent_activity.link"
                  >
                    View all →
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {txLoading ? (
                  <div
                    className="space-y-3"
                    data-ocid="recent_activity.loading_state"
                  >
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : recentTxs.length === 0 ? (
                  <div
                    className="text-center py-6"
                    data-ocid="recent_activity.empty_state"
                  >
                    <p className="text-muted-foreground text-sm">
                      No transactions yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Scan a QR to send points
                    </p>
                  </div>
                ) : (
                  <div>
                    {recentTxs.map((tx, i) => (
                      <TransactionRow
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

          {/* Green promo card */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.18 }}
          >
            <Card className="rounded-xl overflow-hidden" data-ocid="promo.card">
              <div
                className="p-5"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.38 0.12 148) 0%, oklch(0.48 0.16 155) 100%)",
                }}
              >
                <h3 className="text-white font-bold text-base mb-1">
                  Send Points Easily
                </h3>
                <p className="text-white/80 text-xs leading-relaxed mb-4">
                  Scan any merchant or friend's QR code to send points
                  instantly. No cash needed!
                </p>
                <Link
                  to="/scan"
                  className="inline-flex items-center gap-1.5 bg-white rounded-lg px-4 py-2 text-sm font-semibold"
                  style={{ color: "oklch(0.38 0.12 148)" }}
                  data-ocid="promo.scan.button"
                >
                  <ScanLine className="w-4 h-4" />
                  Scan & Pay
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
