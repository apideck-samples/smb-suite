"use client";
import { useState } from "react";
import { ExternalLink, Lock, X } from "lucide-react";
import { useSession } from "@/lib/session";

export default function SessionStatus() {
  const { session, clearSession } = useSession();
  const [opening, setOpening] = useState(false);

  if (!session) return null;

  const consumer =
    session.consumerMetadata?.accountName ||
    session.consumerMetadata?.userName ||
    session.consumerId ||
    "Vault session";

  const expiresIn = session.exp
    ? Math.max(0, Math.round(session.exp - Date.now() / 1000))
    : null;
  const expiresLabel =
    expiresIn === null
      ? null
      : expiresIn > 3600
        ? `${Math.round(expiresIn / 3600)}h`
        : expiresIn > 60
          ? `${Math.round(expiresIn / 60)}m`
          : `${expiresIn}s`;

  const openVault = async () => {
    setOpening(true);
    try {
      const mod = await import("@apideck/vault-js");
      const ApideckVault =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mod as any).ApideckVault ?? (mod as any).default;
      ApideckVault.open({
        token: session.jwt,
        showAttribution: true,
        unifiedApi: "accounting",
        onClose: () => setOpening(false),
      });
    } catch (e) {
      setOpening(false);
      alert(`Could not open Vault: ${(e as Error).message}`);
    }
  };

  return (
    <div className="mb-4 animate-fade-up">
      <div className="rounded-xl bg-white/70 backdrop-blur ring-1 ring-black/10 px-4 py-3 flex items-center gap-3 shadow-card">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30 flex items-center justify-center text-emerald-700">
          <Lock className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink-900 truncate">
            Vault session active for {consumer}
          </div>
          <div className="text-[11px] text-ink-900/60 truncate">
            {session.consumerMetadata?.email ?? "No email in claims"}
            {expiresLabel ? ` · expires in ${expiresLabel}` : ""}
            {session.applicationId
              ? ` · app ${session.applicationId.slice(0, 12)}…`
              : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={openVault}
          disabled={opening}
          className="text-xs px-3 py-1.5 rounded-md bg-ink-900 text-white hover:bg-ink-800 inline-flex items-center gap-1.5 disabled:opacity-60 whitespace-nowrap"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {opening ? "Opening…" : "Open Vault"}
        </button>
        <button
          type="button"
          onClick={clearSession}
          aria-label="Clear session"
          className="text-ink-900/40 hover:text-ink-900"
          title="Clear session"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
