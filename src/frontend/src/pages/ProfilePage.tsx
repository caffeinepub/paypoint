import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut, Save, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetBalance, useGetTransactions } from "../hooks/useQueries";
import { formatAmount, formatPrincipal } from "../utils/formatters";

interface ProfilePageProps {
  userProfile: UserProfile | null;
}

export function ProfilePage({ userProfile }: ProfilePageProps) {
  const { identity, clear } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { data: balance } = useGetBalance();
  const { data: transactions } = useGetTransactions();
  const principal = identity?.getPrincipal().toString() ?? "";

  const [editName, setEditName] = useState(userProfile?.name ?? "");
  const [nameError, setNameError] = useState("");

  const saveMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile({ name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      toast.success("Profile updated!");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const handleSave = () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed.length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }
    setNameError("");
    saveMutation.mutate(trimmed);
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const initials = userProfile?.name
    ? userProfile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const sentCount = (transactions ?? []).filter(
    (tx) => tx.sender.toString() === principal,
  ).length;
  const receivedCount = (transactions ?? []).filter(
    (tx) => tx.recipient.toString() === principal,
  ).length;

  return (
    <main className="max-w-[640px] mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <User className="w-6 h-6" style={{ color: "oklch(0.35 0.10 243)" }} />
          My Profile
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account details
        </p>
      </motion.div>

      <div className="space-y-5">
        {/* Avatar + stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="rounded-xl shadow-card" data-ocid="profile.card">
            <CardContent className="p-6">
              <div className="flex items-center gap-5">
                <Avatar className="w-16 h-16">
                  <AvatarFallback
                    className="text-xl font-bold"
                    style={{
                      background: "oklch(0.48 0.14 148)",
                      color: "white",
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold">
                    {userProfile?.name ?? "User"}
                  </h2>
                  <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                    {formatPrincipal(principal)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                {[
                  {
                    label: "Balance",
                    value: `₹${formatAmount(balance ?? BigInt(0))}`,
                  },
                  { label: "Sent", value: sentCount.toString() },
                  { label: "Received", value: receivedCount.toString() },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="bg-muted rounded-lg p-3 text-center"
                  >
                    <p className="text-lg font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit name */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card
            className="rounded-xl shadow-card"
            data-ocid="profile.edit.card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profileName" className="font-medium">
                  Display Name
                </Label>
                <Input
                  id="profileName"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    if (nameError) setNameError("");
                  }}
                  placeholder="Your display name"
                  className="h-10"
                  data-ocid="profile.name.input"
                />
                {nameError && (
                  <p
                    className="text-destructive text-xs"
                    data-ocid="profile.name.error_state"
                  >
                    {nameError}
                  </p>
                )}
              </div>

              <Button
                className="w-full h-10 font-semibold"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                style={{ background: "oklch(0.48 0.14 148)", color: "white" }}
                data-ocid="profile.save.button"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saveMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Principal */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="rounded-xl shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Principal ID
                </p>
                <p className="text-xs font-mono bg-muted rounded p-2 break-all">
                  {principal}
                </p>
              </div>
              <Button
                variant="destructive"
                className="w-full h-10"
                onClick={handleLogout}
                data-ocid="auth.logout.button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
