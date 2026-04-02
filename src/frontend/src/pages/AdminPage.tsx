import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Principal } from "@dfinity/principal";
import {
  AlertCircle,
  IndianRupee,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { User } from "../backend.d";
import { useAllocatePoints, useGetAllUsers } from "../hooks/useQueries";
import { formatAmount, formatPrincipal } from "../utils/formatters";

function UserRow({
  user,
  index,
  principalStr,
}: {
  user: User;
  index: number;
  principalStr: string;
}) {
  const [amount, setAmount] = useState("");
  const [amtError, setAmtError] = useState("");
  const allocateMutation = useAllocatePoints();

  const handleAllocate = async () => {
    const amt = Number.parseInt(amount, 10);
    if (!amount || Number.isNaN(amt) || amt < 1) {
      setAmtError("Enter amount ≥ 1");
      return;
    }
    setAmtError("");
    try {
      const p = Principal.fromText(principalStr);
      await allocateMutation.mutateAsync({ user: p, amount: BigInt(amt) });
      toast.success(`₹${amt} allocated to ${user.displayName}!`);
      setAmount("");
    } catch (err: any) {
      toast.error(err?.message ?? "Allocation failed");
    }
  };

  return (
    <TableRow data-ocid={`admin.user.item.${index}`}>
      <TableCell className="font-medium">{user.displayName}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {formatPrincipal(principalStr)}
      </TableCell>
      <TableCell className="font-semibold">
        ₹{formatAmount(user.balance)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="relative w-24">
            <Input
              type="number"
              min={1}
              placeholder="Amount"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setAmtError("");
              }}
              className="h-8 text-sm pr-1 pl-2"
              data-ocid={`admin.user.amount.input.${index}`}
            />
          </div>
          <Button
            size="sm"
            className="h-8 text-xs font-semibold px-3"
            onClick={handleAllocate}
            disabled={allocateMutation.isPending}
            style={{ background: "oklch(0.48 0.14 148)", color: "white" }}
            data-ocid={`admin.user.allocate.button.${index}`}
          >
            {allocateMutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "Allocate"
            )}
          </Button>
        </div>
        {amtError && (
          <p
            className="text-destructive text-xs mt-1"
            data-ocid={`admin.user.amount.error_state.${index}`}
          >
            {amtError}
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}

export function AdminPage() {
  const { data: users, isLoading } = useGetAllUsers();

  // Build principal map from users via transactions heuristic
  // Since User doesn't contain principal directly, we derive from transactions
  // We'll use displayName as key, but need to get principals from getAllUsers differently.
  // Backend User type: { balance, displayName, transactions }
  // Transactions have sender/recipient principals — extract from user's own transactions
  const usersWithPrincipals = (users ?? []).map((user, i) => {
    // Try to get principal from transactions
    let principalStr = "";
    if (user.transactions.length > 0) {
      // Check all transactions to find this user's principal
      // If user appears as sender in any tx, that's their principal
      // We use the most common sender from their transaction history
      const senders = user.transactions.map((t) => t.sender.toString());
      const recipients = user.transactions.map((t) => t.recipient.toString());
      const allPrincipals = [...senders, ...recipients];
      // Count occurrences to find the user's own principal
      const freq: Record<string, number> = {};
      for (const p of allPrincipals) {
        freq[p] = (freq[p] ?? 0) + 1;
      }
      // Most frequent is likely the user themselves
      principalStr =
        Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    }
    return { user, principalStr, index: i + 1 };
  });

  return (
    <main className="max-w-[1100px] mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <ShieldCheck
              className="w-6 h-6"
              style={{ color: "oklch(0.48 0.14 148)" }}
            />
            Admin Panel
          </h1>
          <Badge
            className="text-xs"
            style={{
              background: "oklch(0.94 0.05 148)",
              color: "oklch(0.32 0.10 148)",
            }}
          >
            Admin
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Manage users and allocate points
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6"
      >
        {[
          {
            label: "Total Users",
            value: isLoading ? "—" : (users?.length ?? 0).toString(),
            icon: Users,
          },
          {
            label: "Total Points in Circulation",
            value: isLoading
              ? "—"
              : `₹${formatAmount((users ?? []).reduce((acc, u) => acc + u.balance, BigInt(0)))}`,
            icon: IndianRupee,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="rounded-xl shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.94 0.05 148)" }}
                >
                  <Icon
                    className="w-4 h-4"
                    style={{ color: "oklch(0.38 0.12 148)" }}
                  />
                </div>
                <div>
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Users table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="rounded-xl shadow-card" data-ocid="admin.users.card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div
                className="p-5 space-y-3"
                data-ocid="admin.users.loading_state"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !users || users.length === 0 ? (
              <div
                className="text-center py-12"
                data-ocid="admin.users.empty_state"
              >
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">
                  No registered users yet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data-ocid="admin.users.table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Allocate Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersWithPrincipals.map(
                      ({ user, principalStr, index }) => (
                        <UserRow
                          key={`${user.displayName}-${index}`}
                          user={user}
                          principalStr={principalStr}
                          index={index}
                        />
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
