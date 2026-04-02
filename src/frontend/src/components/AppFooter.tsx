import { IndianRupee } from "lucide-react";

export function AppFooter() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);
  return (
    <footer
      className="w-full py-5 mt-auto"
      style={{ background: "oklch(0.19 0.06 243)" }}
    >
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center"
            style={{ background: "oklch(0.48 0.14 148)" }}
          >
            <IndianRupee className="w-3 h-3 text-white" />
          </div>
          <span className="text-white/80 text-sm font-semibold">
            PayPoint ₹
          </span>
        </div>
        <p className="text-white/50 text-xs text-center">
          © {year}. Built with <span className="text-red-400">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white underline-offset-2 hover:underline transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
