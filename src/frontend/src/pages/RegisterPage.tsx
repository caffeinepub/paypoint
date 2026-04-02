import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IndianRupee, Loader2, UserCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useRegisterUser } from "../hooks/useQueries";

interface RegisterPageProps {
  onRegistered: () => void;
}

export function RegisterPage({ onRegistered }: RegisterPageProps) {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const registerMutation = useRegisterUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Please enter your display name");
      return;
    }
    if (trimmed.length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }
    setNameError("");
    try {
      await registerMutation.mutateAsync(trimmed);
      toast.success("Welcome to PayPoint! 🎉");
      onRegistered();
    } catch {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.15 0.07 243) 0%, oklch(0.22 0.07 243) 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl p-8 shadow-2xl bg-card">
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "oklch(0.48 0.14 148)" }}
            >
              <IndianRupee className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-1 font-display">
            Create Your Wallet
          </h1>
          <p className="text-muted-foreground text-sm text-center mb-8">
            Set up your PayPoint profile to start sending & receiving points
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="font-medium">
                <UserCircle className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Your Display Name
              </Label>
              <Input
                id="displayName"
                placeholder="e.g. Priya Sharma"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError("");
                }}
                className="h-11"
                autoFocus
                data-ocid="register.input"
              />
              {nameError && (
                <p
                  className="text-destructive text-xs"
                  data-ocid="register.error_state"
                >
                  {nameError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold text-base"
              disabled={registerMutation.isPending}
              style={{ background: "oklch(0.48 0.14 148)", color: "white" }}
              data-ocid="register.submit_button"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating wallet...
                </>
              ) : (
                "Create Wallet →"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
