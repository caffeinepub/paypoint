import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Principal } from "@dfinity/principal";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  FlipHorizontal,
  ImageIcon,
  Info,
  Loader2,
  RefreshCw,
  ScanLine,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSendPoints } from "../hooks/useQueries";
import { useQRScanner } from "../qr-code/useQRScanner";
import { formatPrincipal } from "../utils/formatters";

type QRType =
  | { kind: "paypoint"; principal: Principal }
  | { kind: "upi"; pa: string; pn?: string; am?: string; raw: string }
  | { kind: "url"; url: string }
  | { kind: "text"; text: string };

function parseQRData(data: string): QRType {
  const trimmed = data.trim();

  // 1. Try PayPoint Principal
  try {
    const p = Principal.fromText(trimmed);
    return { kind: "paypoint", principal: p };
  } catch {}

  // 2. Try UPI deep-link  upi://pay?pa=...&pn=...&am=...
  if (/^upi:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const pa = url.searchParams.get("pa") ?? "";
      const pn = url.searchParams.get("pn") ?? undefined;
      const am = url.searchParams.get("am") ?? undefined;
      if (pa) return { kind: "upi", pa, pn, am, raw: trimmed };
    } catch {}
  }

  // 3. Try URL
  if (/^https?:\/\//i.test(trimmed)) {
    return { kind: "url", url: trimmed };
  }

  // 4. Fallback: plain text
  return { kind: "text", text: trimmed };
}

// Build UPI intent URLs for various apps
function buildUpiIntentUrl(
  app: "phonepe" | "gpay" | "paytm" | "generic",
  upiUrl: string,
) {
  // On Android, intent-based deep links open specific UPI apps
  // On iOS, upi:// scheme is used
  const encodedUrl = encodeURIComponent(upiUrl);
  switch (app) {
    case "phonepe":
      return `phonepe://pay?transactionId=txn_${Date.now()}&upiLink=${encodedUrl}`;
    case "gpay":
      return `tez://upi/pay?${upiUrl.replace(/^upi:\/\/pay\?/, "")}`;
    case "paytm":
      return `paytmmp://pay?${upiUrl.replace(/^upi:\/\/pay\?/, "")}`;
    default:
      return upiUrl;
  }
}

export function ScanPayPage() {
  const [qrResult, setQrResult] = useState<QRType | null>(null);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [step, setStep] = useState<"scan" | "confirm" | "success">("scan");
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanner = useQRScanner({
    facingMode: "environment",
    scanInterval: 150,
    maxResults: 1,
  });

  const sendMutation = useSendPoints();

  // Pick up first new result from camera
  useEffect(() => {
    if (scanner.qrResults.length > 0 && step === "scan") {
      const data = scanner.qrResults[0].data;
      const parsed = parseQRData(data);
      setQrResult(parsed);
      // Pre-fill amount for UPI QR if available
      if (parsed.kind === "upi" && parsed.am) {
        setAmount(parsed.am);
      }
      scanner.stopScanning();
      setStep("confirm");
    }
  }, [scanner.qrResults, scanner.stopScanning, step]);

  const handleGallerySelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (!file) return;

    if (!window.jsQR) {
      toast.error("Please wait, loading QR decoder...");
      return;
    }

    setIsProcessingImage(true);
    const objectUrl = URL.createObjectURL(file);

    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Canvas context unavailable"));
              return;
            }
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const code = window.jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
            );
            if (code?.data) {
              const parsed = parseQRData(code.data);
              setQrResult(parsed);
              if (parsed.kind === "upi" && parsed.am) {
                setAmount(parsed.am);
              }
              setStep("confirm");
              resolve();
            } else {
              reject(new Error("no_qr"));
            }
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error("image_load_failed"));
        img.src = objectUrl;
      });
    } catch (err: any) {
      if (err?.message === "no_qr") {
        toast.error("Is image mein koi QR code nahi mila");
      } else {
        toast.error("Image load karne mein error aaya. Dobara try karein.");
      }
    } finally {
      URL.revokeObjectURL(objectUrl);
      setIsProcessingImage(false);
    }
  };

  const handleSend = async () => {
    if (qrResult?.kind !== "paypoint") return;
    const amt = Number.parseInt(amount, 10);
    if (!amount || Number.isNaN(amt) || amt < 1) {
      setAmountError("Please enter an amount of at least \u20b91");
      return;
    }
    setAmountError("");
    try {
      await sendMutation.mutateAsync({
        recipient: qrResult.principal,
        amount: BigInt(amt),
      });
      setStep("success");
      toast.success(`\u20b9${amt} sent successfully!`);
    } catch (err: any) {
      const msg = err?.message ?? "Transaction failed";
      toast.error(msg.includes("trap") ? "Insufficient balance" : msg);
    }
  };

  const handleReset = () => {
    setQrResult(null);
    setAmount("");
    setAmountError("");
    setStep("scan");
    scanner.clearResults();
  };

  const handleOpenUpiApp = (app: "phonepe" | "gpay" | "paytm" | "generic") => {
    if (qrResult?.kind !== "upi") return;
    const url = buildUpiIntentUrl(app, qrResult.raw);
    window.location.href = url;
    // Fallback: after a short delay, if still on page, show a message
    setTimeout(() => {
      toast.info("Agar app nahi khula, toh manually apna UPI app open karein.");
    }, 2500);
  };

  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  // Render confirm step content based on QR type
  const renderConfirmContent = () => {
    if (!qrResult) return null;

    if (qrResult.kind === "paypoint") {
      return (
        <>
          <div className="flex items-center gap-3 mb-4">
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
              <CardTitle className="text-base">PayPoint QR Scanned!</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Recipient: {formatPrincipal(qrResult.principal)}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted text-xs font-mono break-all text-muted-foreground mb-4">
            {qrResult.principal.toString()}
          </div>

          <div className="space-y-2 mb-5">
            <Label htmlFor="sendAmount" className="font-medium">
              Amount to Send (\u20b9)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                \u20b9
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
              style={{ background: "oklch(0.48 0.14 148)", color: "white" }}
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
        </>
      );
    }

    if (qrResult.kind === "upi") {
      return (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.94 0.07 260)" }}
            >
              <Info
                className="w-5 h-5"
                style={{ color: "oklch(0.45 0.18 260)" }}
              />
            </div>
            <div>
              <CardTitle className="text-base">UPI QR Code Mila</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                UPI payment QR -- apna UPI app chunein
              </p>
            </div>
          </div>

          {/* UPI details */}
          <div className="p-4 rounded-lg bg-muted space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">UPI ID:</span>
              <span className="font-mono font-medium">{qrResult.pa}</span>
            </div>
            {qrResult.pn && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{qrResult.pn}</span>
              </div>
            )}
            {qrResult.am && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span
                  className="font-medium"
                  style={{ color: "oklch(0.48 0.14 148)" }}
                >
                  \u20b9{qrResult.am}
                </span>
              </div>
            )}
          </div>

          {/* Open in UPI app buttons */}
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Kaunse app se pay karna chahte hain?
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1 text-xs font-medium"
              onClick={() => handleOpenUpiApp("phonepe")}
            >
              <span className="text-lg">🟣</span>
              PhonePe
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1 text-xs font-medium"
              onClick={() => handleOpenUpiApp("gpay")}
            >
              <span className="text-lg">🔵</span>
              Google Pay
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1 text-xs font-medium"
              onClick={() => handleOpenUpiApp("paytm")}
            >
              <span className="text-lg">🔷</span>
              Paytm
            </Button>
          </div>

          {/* Generic UPI link */}
          <Button
            variant="outline"
            className="w-full mb-4 text-xs"
            onClick={() => handleOpenUpiApp("generic")}
          >
            <ExternalLink className="w-3 h-3 mr-2" />
            Kisi bhi UPI App mein kholo
          </Button>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800 mb-4">
            Button dabane par aapka UPI app khulega aur wahan se payment
            complete karein.
          </div>

          <Button variant="outline" className="w-full" onClick={handleReset}>
            Wapas Jaao
          </Button>
        </>
      );
    }

    if (qrResult.kind === "url") {
      return (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.94 0.07 200)" }}
            >
              <ExternalLink
                className="w-5 h-5"
                style={{ color: "oklch(0.45 0.18 200)" }}
              />
            </div>
            <div>
              <CardTitle className="text-base">URL / Website QR</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Is QR mein ek website link hai
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted text-xs font-mono break-all text-muted-foreground mb-5">
            {qrResult.url}
          </div>

          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 text-xs text-blue-800 mb-5">
            Yeh PayPoint payment QR nahi hai. Agar aap payment karna chahte
            hain, PayPoint wallet ka QR scan karein.
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              Wapas Jaao
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => window.open(qrResult.url, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Link
            </Button>
          </div>
        </>
      );
    }

    // Text / unknown QR
    return (
      <>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.94 0.03 50)" }}
          >
            <Info className="w-5 h-5" style={{ color: "oklch(0.5 0.1 50)" }} />
          </div>
          <div>
            <CardTitle className="text-base">QR Code Read Hua</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Is QR mein yeh data hai:
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted text-xs break-all text-muted-foreground mb-5">
          {qrResult.text}
        </div>

        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800 mb-5">
          Yeh PayPoint payment QR nahi hai. Payment karne ke liye kisi PayPoint
          user ka QR scan karein.
        </div>

        <Button variant="outline" className="w-full" onClick={handleReset}>
          Wapas Jaao
        </Button>
      </>
    );
  };

  return (
    <main className="max-w-[600px] mx-auto px-4 py-8">
      {/* Hidden file input for gallery selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGallerySelect}
        data-ocid="scanner.upload_button"
      />

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
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      className="flex-1 h-11 font-semibold"
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

                    <Button
                      className="flex-1 h-11 font-medium"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingImage}
                      data-ocid="scanner.gallery.button"
                    >
                      {isProcessingImage ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4 mr-2" />
                      )}
                      {isProcessingImage
                        ? "Processing..."
                        : "Select from Gallery"}
                    </Button>
                  </div>
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

        {step === "confirm" && qrResult && (
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
              <CardHeader className="pb-2">
                {/* empty header for spacing */}
              </CardHeader>
              <CardContent className="space-y-0 pt-0">
                {renderConfirmContent()}
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
                  \u20b9{amount} sent to{" "}
                  {qrResult?.kind === "paypoint"
                    ? formatPrincipal(qrResult.principal)
                    : ""}
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
