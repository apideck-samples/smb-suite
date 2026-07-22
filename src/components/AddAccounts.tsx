"use client";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import MacWindow from "./MacWindow";
import { LaunchParams } from "@/lib/launchParams";

// The five categories of tools that power the host platform's SMB suite.
// Each one can either stay on the host's in-house service (Accounting,
// Payroll, Insurance have an in-house lane by default) or use a BYO
// integration powered by Apideck. Set NEXT_PUBLIC_PROSPECT_NAME or pass
// ?prospect_name=… to brand the in-house labels per prospect.
type Category = "accounting" | "tax" | "payments" | "payroll" | "insurance";

type Provider = {
  id: string;
  name: string;
  short?: string;
  category: Category;
  brand: string;       // hex
  textOn: "white" | "ink";
  initials: string;
  recommended?: boolean;
  multi?: boolean;     // signals multi-account support (e.g. two QBO realms)
};

const PROVIDERS: Provider[] = [
  // Accounting
  { id: "quickbooks", name: "QuickBooks Online", short: "QuickBooks", category: "accounting", brand: "#2CA01C", textOn: "white", initials: "QB", recommended: true, multi: true },
  { id: "xero", name: "Xero", category: "accounting", brand: "#13B5EA", textOn: "white", initials: "Xe" },
  { id: "wave-accounting", name: "Wave", category: "accounting", brand: "#1B47B4", textOn: "white", initials: "Wv" },
  { id: "freshbooks", name: "FreshBooks", category: "accounting", brand: "#0075DD", textOn: "white", initials: "Fb" },
  { id: "sage", name: "Sage", category: "accounting", brand: "#00DC82", textOn: "ink", initials: "Sg" },
  // Tax
  { id: "turbotax", name: "TurboTax Business", short: "TurboTax", category: "tax", brand: "#377CCA", textOn: "white", initials: "TT", recommended: true },
  { id: "quickbooks-tax", name: "QuickBooks Tax", short: "QB Tax", category: "tax", brand: "#2CA01C", textOn: "white", initials: "QT" },
  // Payments
  { id: "stripe", name: "Stripe", category: "payments", brand: "#635BFF", textOn: "white", initials: "St", recommended: true },
  { id: "moneris", name: "Moneris", category: "payments", brand: "#E11B22", textOn: "white", initials: "Mn", recommended: true },
  { id: "square", name: "Square", category: "payments", brand: "#000000", textOn: "white", initials: "Sq" },
  // Payroll (Apideck HRIS unified API) — Canadian SMB focus
  { id: "wagepoint", name: "Wagepoint", category: "payroll", brand: "#F47F2A", textOn: "white", initials: "Wp", recommended: true },
  { id: "deel", name: "Deel", category: "payroll", brand: "#15101B", textOn: "white", initials: "De" },
  { id: "adp-run", name: "ADP Run", short: "ADP Run", category: "payroll", brand: "#D71E28", textOn: "white", initials: "AD" },
  { id: "sage-hr", name: "Sage HR", category: "payroll", brand: "#00DC82", textOn: "ink", initials: "Sh" },
  { id: "bamboohr", name: "BambooHR", category: "payroll", brand: "#5BB14B", textOn: "white", initials: "Bm" },
  // Insurance (illustrative — Apideck unified Insurance API not yet supported)
  { id: "sonnet", name: "Sonnet Insurance", short: "Sonnet", category: "insurance", brand: "#FF5C39", textOn: "white", initials: "So", recommended: true },
  { id: "zensurance", name: "Zensurance", category: "insurance", brand: "#00B4A0", textOn: "white", initials: "Zn" },
  { id: "apollo-insurance", name: "Apollo Insurance", short: "Apollo", category: "insurance", brand: "#1A4775", textOn: "white", initials: "Ap" },
];

type CategoryMeta = {
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  api: string;
  status: "ga" | "roadmap";
  hasInHouse?: boolean; // category supports a host-platform in-house lane
};

const CATEGORY_META: Record<Category, CategoryMeta> = {
  accounting: {
    label: "Accounting",
    sub: "P&L, balance sheet, invoices, bills, customers",
    icon: Wallet,
    api: "/accounting/*",
    status: "ga",
    hasInHouse: true,
  },
  payroll: {
    label: "Payroll",
    sub: "Employees, runs, time off, T4 prep",
    icon: Users,
    api: "/hris/*",
    status: "ga",
    hasInHouse: true,
  },
  insurance: {
    label: "Insurance",
    sub: "Commercial liability, content, business interruption",
    icon: ShieldCheck,
    api: "/insurance/*",
    status: "roadmap",
    hasInHouse: true,
  },
  tax: {
    label: "Tax",
    sub: "Latest T2 corporate return, HST filings",
    icon: Receipt,
    api: "/accounting/tax-filings",
    status: "roadmap",
  },
  payments: {
    label: "Payments",
    sub: "Live payouts, settlement batches, fees",
    icon: Banknote,
    api: "/payments/payouts",
    status: "roadmap",
  },
};

// One provider per category — SMBs typically use a single tool per
// functional area (one accounting system, one payroll, etc.).
const DEFAULT_PICKS: Record<Category, string | null> = {
  accounting: "quickbooks",
  payroll: "wagepoint",
  insurance: "sonnet",
  tax: "turbotax",
  payments: "stripe",
};

export default function AddAccounts({
  onContinue,
  launch,
}: {
  // legacy compatibility props
  onPick?: (i: unknown) => void;
  onAddManual?: () => void;
  onBack?: () => void;
  onContinue?: (picks: string[]) => void;
  launch?: LaunchParams;
}) {
  const [picks, setPicks] = useState<Record<Category, string | null>>(
    () => ({ ...DEFAULT_PICKS })
  );

  const select = (cat: Category, id: string) =>
    setPicks((prev) => ({
      ...prev,
      // Toggle off if the same provider is clicked again
      [cat]: prev[cat] === id ? null : id,
    }));

  const grouped = useMemo(() => {
    const out: Record<Category, Provider[]> = {
      accounting: [],
      payroll: [],
      insurance: [],
      tax: [],
      payments: [],
    };
    for (const p of PROVIDERS) out[p.category].push(p);
    return out;
  }, []);

  const pickedIds = (Object.values(picks).filter(Boolean) as string[]);
  const total = pickedIds.length;
  const multiAccountActive = picks.accounting === "quickbooks"; // two QBO realms under one consumer

  return (
    <MacWindow
      title="Connect your business tools"
      footer={
        <>
          <button
            type="button"
            className="text-xs px-3 py-1.5 rounded-md bg-ink-700 text-zinc-400 ring-1 ring-white/5"
            disabled
          >
            Tools selected · {total}
          </button>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-500" />
            <span className="w-2 h-2 rounded-full bg-white/15" />
            <span className="w-2 h-2 rounded-full bg-white/15" />
          </div>
          <button
            type="button"
            onClick={() => onContinue?.(pickedIds)}
            disabled={total === 0}
            className="text-xs px-4 py-1.5 rounded-md bg-accent-500 text-white hover:bg-accent-600 disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            Connect via Apideck Vault <ArrowRight className="w-3 h-3" />
          </button>
        </>
      }
    >
      <div className="px-10 py-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-wider text-accent-500 px-2 py-1 rounded-full ring-1 ring-accent-500/30 bg-accent-500/10">
            <Sparkles className="w-3 h-3" /> SMB suite · point-in-time → continuous value
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-50 mt-3">
            One connected SMB. Every service{" "}
            {launch?.prospectName ? launch.prospectName : "the platform"} powers.
          </h1>
          <p className="text-zinc-400 mt-3 max-w-2xl">
            Each category offers an in-house service{" "}
            <span className="text-zinc-200">or</span> a bring-your-own
            integration powered by Apideck. Either lane feeds the same unified
            stream — business-health insights for the SMB, AI grounded in their
            real data, and an underwriting feed for the bank to lend to SMBs
            traditional pipelines can&apos;t reach.
          </p>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(Object.keys(grouped) as Category[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            const items = grouped[cat];
            const pickedId = picks[cat];
            return (
              <section
                key={cat}
                className="rounded-2xl ring-1 ring-white/5 bg-ink-800/60 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-accent-500">
                      <Icon className="w-3.5 h-3.5" /> {meta.label}
                      {meta.status === "roadmap" && (
                        <span
                          className="text-[9px] uppercase tracking-wider text-amber-300 px-1 py-0.5 rounded bg-amber-500/10 ring-1 ring-amber-500/30"
                          title="Apideck does not yet support a unified API for this category. Demo data is illustrative."
                        >
                          Not yet supported
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-semibold text-zinc-50 mt-1">
                      {meta.sub}
                    </h2>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {meta.api}
                    </div>
                    {meta.hasInHouse && (
                      <div className="text-[10px] text-zinc-500 mt-2 inline-flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-zinc-600" />
                        Or stay on{" "}
                        <span className="text-zinc-300">
                          {launch?.prospectName
                            ? `${launch.prospectName} ${meta.label}`
                            : `your in-house ${meta.label}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 px-1.5 py-0.5 rounded ring-1 ring-white/10 shrink-0">
                    {pickedId ? "1 picked" : "—"}
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((p) => (
                    <ProviderRow
                      key={p.id}
                      p={p}
                      checked={pickedId === p.id}
                      onSelect={() => select(cat, p.id)}
                      showRecommended={!meta.hasInHouse}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Multi-account callout */}
        <div
          className={`mt-6 rounded-2xl ring-1 px-5 py-4 ${
            multiAccountActive
              ? "bg-accent-500/10 ring-accent-500/30"
              : "bg-ink-800/60 ring-white/5"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-500/20 ring-1 ring-accent-500/40 text-accent-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-zinc-50">
                Multi-account connections — required for multi-entity SMBs
              </h3>
              <p className="text-[12px] text-zinc-400 mt-0.5">
                When QuickBooks is selected the SMB can connect{" "}
                <span className="text-accent-500">two</span> QBO realms (OpCo +
                Holdings) under one Apideck consumer. The dashboard rolls them
                up; the lending view sees both balance sheets.
              </p>
            </div>
            {multiAccountActive && (
              <span className="text-[10px] uppercase tracking-wider text-accent-500 px-1.5 py-0.5 rounded bg-accent-500/15 ring-1 ring-accent-500/40 shrink-0 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            )}
          </div>
        </div>
      </div>
    </MacWindow>
  );
}

function ProviderRow({
  p,
  checked,
  onSelect,
  showRecommended,
}: {
  p: Provider;
  checked: boolean;
  onSelect: () => void;
  showRecommended: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={checked}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition ring-1 text-left ${
        checked
          ? "bg-accent-500/10 ring-accent-500/40"
          : "bg-ink-700/40 ring-white/5 hover:bg-ink-700/70"
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ring-1 transition ${
          checked
            ? "bg-accent-500 ring-accent-500"
            : "bg-ink-900/40 ring-white/20"
        }`}
        aria-hidden="true"
      >
        {checked && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0"
        style={{
          backgroundColor: p.brand,
          color: p.textOn === "white" ? "#fff" : "#0A1F44",
        }}
      >
        {p.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-zinc-100 truncate">{p.short ?? p.name}</div>
        <div className="text-[10px] text-zinc-500">
          service_id: <span className="font-mono">{p.id}</span>
        </div>
      </div>
      {p.multi && (
        <span className="text-[9px] uppercase tracking-wider text-accent-500 px-1 py-0.5 rounded bg-accent-500/15 ring-1 ring-accent-500/40 shrink-0">
          Multi-acct
        </span>
      )}
      {showRecommended && p.recommended && !p.multi && (
        <span className="text-[9px] uppercase tracking-wider text-zinc-400 px-1 py-0.5 rounded ring-1 ring-white/10 shrink-0">
          Recommended
        </span>
      )}
    </button>
  );
}
