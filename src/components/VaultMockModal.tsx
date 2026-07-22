"use client";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { DEMO_CONNECTIONS, type Connection } from "@/lib/mockData";

type RowState = "idle" | "connecting" | "connected";

const SERVICE_BG: Record<string, string> = {
  quickbooks: "bg-[#2CA01C]",
  stripe: "bg-[#635BFF]",
  moneris: "bg-[#E11B22]",
  turbotax: "bg-[#377CCA]",
};

// Mock of the Apideck Vault drop-in widget. We open it whenever the demo
// doesn't have a real Vault session JWT (i.e. cold launches from /) so the
// flow still surfaces a Vault-like authorization UX. When the user does
// arrive with a real JWT (via /session/<jwt>) IntegrationProgress opens the
// real @apideck/vault-js widget instead.
export default function VaultMockModal({
  sessionUri,
  consumerLabel,
  onClose,
  onComplete,
}: {
  sessionUri: string;
  consumerLabel: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [states, setStates] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(DEMO_CONNECTIONS.map((c) => [c.id, "idle"])) as Record<
      string,
      RowState
    >
  );

  const allConnected = DEMO_CONNECTIONS.every(
    (c) => states[c.id] === "connected"
  );
  const anyBusy = DEMO_CONNECTIONS.some((c) => states[c.id] === "connecting");

  const authorize = useCallback((id: string) => {
    setStates((s) => ({ ...s, [id]: "connecting" }));
    const ms = 700 + Math.random() * 600;
    setTimeout(() => {
      setStates((s) => ({ ...s, [id]: "connected" }));
    }, ms);
  }, []);

  const authorizeAll = useCallback(() => {
    DEMO_CONNECTIONS.forEach((c, i) => {
      if (states[c.id] !== "idle") return;
      setTimeout(() => authorize(c.id), i * 250);
    });
  }, [authorize, states]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !anyBusy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [anyBusy, onClose]);

  const finish = () => {
    onComplete();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-up"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !anyBusy) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white text-ink-900 shadow-2xl ring-1 ring-black/10 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-black/5">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-ink-900 text-white flex items-center justify-center font-bold text-[13px]">
              A
            </span>
            <div>
              <div className="text-[13px] font-semibold leading-none">
                Apideck Vault
              </div>
              <div className="text-[10px] text-ink-900/55 leading-none mt-0.5">
                Securely connect your business tools
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={anyBusy}
            aria-label="Close"
            className="text-ink-900/40 hover:text-ink-900 disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Consumer + session uri */}
        <div className="px-5 py-3 bg-zinc-50 border-b border-black/5 text-[11px] text-ink-900/60 flex items-center justify-between gap-3">
          <span className="truncate">
            Authorizing as{" "}
            <span className="text-ink-900 font-medium">{consumerLabel}</span>
          </span>
          <span className="font-mono text-[10px] text-ink-900/50 truncate max-w-[180px]">
            {sessionUri.replace("https://vault.apideck.com/session/", "")}
          </span>
        </div>

        {/* Provider list */}
        <div className="px-5 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {DEMO_CONNECTIONS.map((c) => (
            <ProviderRow
              key={c.id}
              c={c}
              state={states[c.id]}
              onAuthorize={() => authorize(c.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-black/5 flex items-center justify-between gap-3 bg-zinc-50">
          <div className="flex items-center gap-1.5 text-[11px] text-ink-900/55">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            OAuth handled by Apideck — credentials never leave the provider
          </div>
          {allConnected ? (
            <button
              onClick={finish}
              className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Done
            </button>
          ) : (
            <button
              onClick={authorizeAll}
              disabled={anyBusy}
              className="inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-md bg-ink-900 text-white hover:bg-ink-800 disabled:opacity-50"
            >
              {anyBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Connect all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProviderRow({
  c,
  state,
  onAuthorize,
}: {
  c: Connection;
  state: RowState;
  onAuthorize: () => void;
}) {
  const initials = c.service_name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ring-1 transition ${
        state === "connected"
          ? "bg-emerald-50 ring-emerald-200"
          : state === "connecting"
            ? "bg-sky-50 ring-sky-200"
            : "bg-white ring-black/10"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-md ${
          SERVICE_BG[c.service_id] ?? "bg-zinc-700"
        } text-white text-[12px] font-bold flex items-center justify-center shrink-0`}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{c.service_name}</div>
        <div className="text-[11px] text-ink-900/55 truncate">
          {c.account_label}
          {c.is_multi_account_sibling && (
            <span className="ml-2 text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-accent-500/10 text-accent-500 ring-1 ring-accent-500/30">
              Multi-acct
            </span>
          )}
        </div>
      </div>
      {state === "connected" && (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" /> Connected
        </span>
      )}
      {state === "connecting" && (
        <span className="inline-flex items-center gap-1 text-[11px] text-sky-700">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Connecting…
        </span>
      )}
      {state === "idle" && (
        <button
          onClick={onAuthorize}
          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md bg-ink-900 text-white hover:bg-ink-800"
        >
          <Lock className="w-3 h-3" /> Authorize
        </button>
      )}
    </div>
  );
}
