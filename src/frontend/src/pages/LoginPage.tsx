import { Button } from "@/components/ui/button";
import { IndianRupee, Loader2, Scan, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.15 0.07 243) 0%, oklch(0.22 0.07 243) 100%)",
      }}
    >
      {/* Header strip */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.48 0.14 148)" }}
          >
            <IndianRupee className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl font-display">
            PayPoint ₹
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Hero icon */}
            <div className="flex justify-center mb-8">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
                style={{ background: "oklch(0.48 0.14 148)" }}
              >
                <IndianRupee className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-white mb-3 font-display">
                PayPoint ₹
              </h1>
              <p className="text-white/60 text-lg leading-relaxed">
                Send & receive points instantly
                <br />
                using QR codes — fast, simple, secure
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex justify-center gap-3 mb-10 flex-wrap">
              {[
                { icon: Scan, label: "QR Payments" },
                { icon: Zap, label: "Instant" },
                { icon: Shield, label: "Secure" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
                  style={{
                    background: "oklch(0.28 0.07 243)",
                    color: "oklch(0.85 0.04 240)",
                  }}
                >
                  <Icon
                    className="w-3.5 h-3.5"
                    style={{ color: "oklch(0.48 0.14 148)" }}
                  />
                  {label}
                </div>
              ))}
            </div>

            {/* Login card */}
            <div
              className="rounded-2xl p-8 shadow-2xl"
              style={{ background: "oklch(1 0 0)" }}
            >
              <h2 className="text-xl font-bold text-foreground mb-2">
                Sign In
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Connect with Internet Identity to access your PayPoint wallet
              </p>

              <Button
                className="w-full h-12 text-base font-semibold rounded-xl"
                onClick={login}
                disabled={isLoggingIn}
                style={{ background: "oklch(0.48 0.14 148)", color: "white" }}
                data-ocid="auth.primary_button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>🔐 Login with Internet Identity</>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                First-time login? You'll create your wallet automatically.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
