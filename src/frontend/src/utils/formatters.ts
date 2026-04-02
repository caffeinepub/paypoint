import type { Principal } from "@dfinity/principal";

export function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  const date = new Date(ms);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatShortDate(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  const date = new Date(ms);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatPrincipal(principal: Principal | string): string {
  const str = typeof principal === "string" ? principal : principal.toString();
  if (str.length <= 12) return str;
  return `${str.slice(0, 5)}...${str.slice(-3)}`;
}

export function formatAmount(amount: bigint): string {
  return Number(amount).toLocaleString("en-IN");
}
