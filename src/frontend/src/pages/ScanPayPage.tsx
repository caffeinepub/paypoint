import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Principal } from "@dfinity/principal";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  FlipHorizontal,
  Loader2,
  RefreshCw,
  ScanLine,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSendPoints } from "../hooks/useQueries";
import { useQRScanner } from "../qr-code/useQRScanner";
import { formatPrincipal } from "../utils/formatters";

export function ScanPayPage() {
  const [scannedPrincipal, setScannedPrincipal] = useState<Principal | null>(
    null,
  );
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [step, setStep] = useState<"scan" | "confirm" | "success">("scan");

  const scanner = useQRScanner({
    facingMode: "environment",
    scanInterval: 150,
    maxResults: 1,
  });

  const sendMutation = useSendPoints();

  // Pick up first new result
  useEffect(() => {
    if (scanner.qrResults.length > 0 && step === "scan") {
      const data = scanner.qrResults[0].data;
      try {
        const p = Principal.fromText(data);
        setScannedPrincipal(p);
        scanner.stopScanning();
        setStep("confirm");
      } catch {
        toast.error("Invalid QR code. Please scan a PayPoint QR.");
        scanner.clearResults();
      }
    }
  }, [scanner.qrResults, scanner.stopScanning, scanner.clearResults, step]);

  const handleSend = async () => {
    const amt = Number.parseInt(amount, 10);
    if (!amount || Number.isNaN(amt) || amt < 1) {
      setAmountError("Please enter an amount of at least ₹1");
      return;
    }
    setAmountError("");
    if (!scannedPrincipal) return;
    try {
      await sendMutation.mutateAsync({
        recipient: scannedPrincipal,
        amount: BigInt(amt),
      });
      setStep("success");
      toast.success(`₹${amt} sent successfully!`);
    } catch (err: any) {
      const msg = err?.message ?? "Transaction failed";
      toast.error(msg.includes("trap") ? "Insufficient balance" : msg);
    }
  };

  const handleReset = () => {
    setScannedPrincipal(null);
    setAmount("");
    setAmountError("");
    setStep("scan");
    scanner.clearResults();
  };

  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  return (
    <main className="max-w-[600px] mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <ScanLine
            className="w-6 h-6"
            style={{ color: "oklch(0.48 0.14 148)" }}
          />
          Scan & Pay
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Scan a QR code to send points
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === "scan" && (
          <motion.div
            key="scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card
              className="rounded-xl shadow-card overflow-hidden"
              data-ocid="scanner.card"
            >
              {/* Video area */}
              <div className="relative bg-black aspect-square max-h-[380px] w-full">
                <video
                  ref={scanner.videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={scanner.canvasRef} className="hidden" />

                {!scanner.isActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/40 flex items-center justify-center">
                      <ScanLine className="w-10 h-10 text-white/60" />
                    </div>
                    <p className="text-white/70 text-sm">Camera not started</p>
                  </div>
                )}

                {scanner.isActive && (
                  <>
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-52 h-52 relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-lg" />
                        {scanner.isScanning && (
                          <div
                            className="absolute inset-x-0 h-0.5 bg-green-400/80 animate-bounce"
                            style={{ top: "50%" }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                        {scanner.isScanning
                          ? "Scanning for QR..."
                          : "Camera active"}
                      </span>
                    </div>
                  </>
                )}

                {scanner.error && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/70"
                    data-ocid="scanner.error_state"
                  >
                    <div className="text-center text-white px-6">
                      <AlertCircle className="w-10 h-10 mx-auto mb-2 text-red-400" />
                      <p className="text-sm">{scanner.error.message}</p>
                    </div>
                  </div>
                )}
              </div>

              <CardContent className="p-5 space-y-3">
                {scanner.error ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => scanner.retry()}
                    data-ocid="scanner.retry.button"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Camera
                  </Button>
                ) : scanner.isActive ? (
                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={scanner.stopScanning}
                      disabled={scanner.isLoading}
                      data-ocid="scanner.stop.button"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                    {isMobile && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={scanner.switchCamera}
                        disabled={scanner.isLoading}
                        data-ocid="scanner.switch.button"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full h-11 font-semibold"
                    onClick={scanner.startScanning}
                    disabled={
                      scanner.isLoading || scanner.isSupported === false
                    }
                    style={{
                      background: "oklch(0.48 0.14 148)",
                      color: "white",
                    }}
                    data-ocid="scanner.start.button"
                  >
                    {scanner.isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ScanLine className="w-4 h-4 mr-2" />
                    )}
                    {scanner.isLoading
                      ? "Starting camera..."
                      : "Start Scanning"}
                  </Button>
                )}

                {scanner.isSupported === false && (
                  <p
                    className="text-destructive text-xs text-center"
                    data-ocid="scanner.error_state"
                  >
                    Camera not supported on this device
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "confirm" && scannedPrincipal && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card
              className="rounded-xl shadow-card"
              data-ocid="payment.confirm.dialog"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(0.94 0.05 148)" }}
                  >
                    <CheckCircle
                      className="w-5 h-5"
                      style={{ color: "oklch(0.48 0.14 148)" }}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      QR Code Scanned!
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recipient: {formatPrincipal(scannedPrincipal)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="p-3 rounded-lg bg-muted text-xs font-mono break-all text-muted-foreground">
                  {scannedPrincipal.toString()}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendAmount" className="font-medium">
                    Amount to Send (₹)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                      ₹
                    </span>
                    <Input
                      id="sendAmount"
                      type="number"
                      min={1}
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setAmountError("");
                      }}
                      className="pl-7 h-11"
                      autoFocus
                      data-ocid="payment.amount.input"
                    />
                  </div>
                  {amountError && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="payment.amount.error_state"
                    >
                      {amountError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleReset}
                    disabled={sendMutation.isPending}
                    data-ocid="payment.cancel.button"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 font-semibold"
                    onClick={handleSend}
                    disabled={sendMutation.isPending}
                    style={{
                      background: "oklch(0.48 0.14 148)",
                      color: "white",
                    }}
                    data-ocid="payment.confirm_button"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    {sendMutation.isPending ? "Sending..." : "Send Points"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card
              className="rounded-xl shadow-card text-center py-12"
              data-ocid="payment.success_state"
            >
              <CardContent>
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: "oklch(0.94 0.05 148)" }}
                >
                  <CheckCircle
                    className="w-10 h-10"
                    style={{ color: "oklch(0.48 0.14 148)" }}
                  />
                </div>
                <h2 className="text-2xl font-bold mb-2 font-display">
                  Payment Sent!
                </h2>
                <p className="text-muted-foreground text-sm mb-2">
                  ₹{amount} sent to {formatPrincipal(scannedPrincipal!)}
                </p>
                <p className="text-xs text-muted-foreground mb-8">
                  Transaction complete
                </p>
                <Button
                  className="w-full h-11 font-semibold"
                  onClick={handleReset}
                  style={{ background: "oklch(0.48 0.14 148)", color: "white" }}
                  data-ocid="payment.scan_again.button"
                >
                  Scan Again
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
