import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Copy, QrCode, Share2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// Simple QR code using a free QR generation service
function QRCodeDisplay({ value }: { value: string }) {
  const size = 220;
  const encodedValue = encodeURIComponent(value);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&format=png&margin=16`;

  return (
    <div className="flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-4 shadow-inner border border-border">
        <img
          src={qrUrl}
          alt="Your PayPoint QR Code"
          width={size}
          height={size}
          className="block"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    </div>
  );
}

export function MyQRCodePage() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(principal);
      setCopied(true);
      toast.success("Principal copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My PayPoint QR",
          text: `Send me points on PayPoint: ${principal}`,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  return (
    <main className="max-w-[520px] mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <QrCode
            className="w-6 h-6"
            style={{ color: "oklch(0.35 0.10 243)" }}
          />
          My QR Code
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Share this QR code to receive points
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="rounded-xl shadow-card" data-ocid="myqr.card">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-base">
              Scan to Send Points to Me
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Others scan this QR to send you points instantly
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {principal ? (
              <QRCodeDisplay value={principal} />
            ) : (
              <div
                className="h-52 flex items-center justify-center"
                data-ocid="myqr.loading_state"
              >
                <p className="text-muted-foreground text-sm">Loading...</p>
              </div>
            )}

            {/* Principal display */}
            <div className="mx-4 rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1 font-medium">
                Your Principal ID
              </p>
              <p className="text-xs font-mono break-all text-foreground leading-relaxed">
                {principal}
              </p>
            </div>

            <div className="flex gap-3 px-4 pb-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopy}
                data-ocid="myqr.copy.button"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy ID"}
              </Button>
              <Button
                className="flex-1 font-semibold"
                onClick={handleShare}
                style={{ background: "oklch(0.48 0.14 148)", color: "white" }}
                data-ocid="myqr.share.button"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground pb-2">
              💡 Share this to receive points from anyone
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
