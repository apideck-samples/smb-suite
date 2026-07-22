"use client";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { LaunchParams } from "@/lib/launchParams";

const COPY: Record<string, { title: string; body: string }> = {
  "apideck-samples": {
    title: "Welcome from apideck.com/samples",
    body: "A walk-through of how a platform can use Apideck's unified Accounting + HRIS APIs to pull live financial data from an SMB's existing tools, surface a business-health dashboard, and feed a bank's credit-underwriting engine.",
  },
  apideck: {
    title: "Launched from apideck.com",
    body: "Walk through the live API surface end-to-end. Feel free to share with your team — every screen is interactive.",
  },
};

export default function LaunchedFromBanner({
  params,
}: {
  params: LaunchParams;
}) {
  const [dismissed, setDismissed] = useState(false);
  const copy = params.source ? COPY[params.source] : null;
  if (!params.source || dismissed) return null;

  return (
    <div className="mb-4 animate-fade-up">
      <div className="rounded-xl bg-ink-900 text-white px-4 py-3 ring-1 ring-black/10 shadow-card flex items-start gap-3">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-amber-300">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">
            {copy?.title ?? `Launched from ${params.source}`}
          </div>
          <p className="text-[12px] text-white/70 mt-0.5">
            {copy?.body ??
              "This sample mirrors the live Apideck Accounting Unified API surface."}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
            {params.service && <Pill label={`service: ${params.service}`} />}
            {params.consumerId && (
              <Pill label={`consumer: ${params.consumerId}`} />
            )}
            {params.prospectDomain && (
              <Pill label={`prospect: ${params.prospectDomain}`} />
            )}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-white/50 hover:text-white shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center font-mono px-1.5 py-0.5 rounded ring-1 ring-white/15 bg-white/5 text-white/80">
      {label}
    </span>
  );
}
