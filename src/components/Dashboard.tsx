"use client";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Building2,
  ChevronRight,
  CreditCard,
  FileText,
  Landmark,
  Layers,
  PieChart,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Wallet,
  Wifi,
} from "lucide-react";
import MacWindow from "./MacWindow";
import {
  AgingBucket,
  Connection,
  CUSTOMERS,
  DEMO_CONNECTIONS,
  DEMO_ENTITY,
  HEALTH,
  INVOICES,
  MONTHLY_PNL,
  PAYMENTS,
  formatMoney,
  formatPct,
} from "@/lib/mockData";

const BUCKET_LABEL: Record<AgingBucket, string> = {
  current: "Current",
  "1_30": "1–30 days",
  "31_60": "31–60 days",
  "61_90": "61–90 days",
  "90_plus": "90+ days",
};

const BUCKET_TONE: Record<AgingBucket, string> = {
  current: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  "1_30": "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  "31_60": "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  "61_90": "bg-orange-500/15 text-orange-300 ring-orange-500/30",
  "90_plus": "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

const SERVICE_BG: Record<string, string> = {
  quickbooks: "bg-[#2CA01C]",
  xero: "bg-[#13B5EA]",
  wave: "bg-[#1B47B4]",
  freshbooks: "bg-[#0075DD]",
  sage: "bg-[#00DC82]",
  stripe: "bg-[#635BFF]",
  square: "bg-[#000000]",
  moneris: "bg-[#E11B22]",
  turbotax: "bg-[#377CCA]",
};

function ServiceChip({ service_id, name }: { service_id: string; name: string }) {
  return (
    <span
      className={`shrink-0 w-7 h-7 rounded-md ${
        SERVICE_BG[service_id] ?? "bg-zinc-600"
      } text-white text-[10px] font-bold flex items-center justify-center ring-1 ring-white/10`}
      title={name}
    >
      {name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)}
    </span>
  );
}

export default function Dashboard({
  onReset,
  onLending,
}: {
  // legacy props from page.tsx — accepted but ignored
  institution?: unknown;
  accounts?: unknown;
  transactionsByAccount?: unknown;
  service?: unknown;
  onReset: () => void;
  onOperator?: () => void;
  onLending?: () => void;
  onAccounting?: () => void;
}) {
  const goLending = onLending ?? (() => {});
  const [aiOpen, setAiOpen] = useState(false);

  const arBuckets = HEALTH.ar_by_bucket;
  const apBuckets = HEALTH.ap_by_bucket;
  const arMax = Math.max(...Object.values(arBuckets), 1);
  const apMax = Math.max(...Object.values(apBuckets), 1);

  const revMax = Math.max(...MONTHLY_PNL.map((m) => m.revenue), 1);
  const lastMonth = MONTHLY_PNL[MONTHLY_PNL.length - 1];
  const prevMonth = MONTHLY_PNL[MONTHLY_PNL.length - 2];
  const momPct = (lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue;

  const recentPayments = PAYMENTS.slice(0, 6);
  const topCustomers = useMemo(
    () => [...CUSTOMERS].sort((a, b) => b.outstanding - a.outstanding).slice(0, 5),
    []
  );
  const overdueCount = INVOICES.filter((i) => i.status === "overdue").length;

  return (
    <MacWindow
      title={`Business health — ${DEMO_ENTITY.trade_name}`}
      footer={
        <>
          <button
            onClick={onReset}
            className="text-xs px-3 py-1.5 rounded-md bg-ink-700 text-zinc-300 hover:bg-ink-600 ring-1 ring-white/5 inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" /> Reconnect tools
          </button>
          <span className="text-[11px] text-zinc-400 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live · unified Apideck feed
          </span>
          <button
            onClick={goLending}
            className="text-xs px-3 py-1.5 rounded-md bg-accent-500/15 ring-1 ring-accent-500/30 text-accent-500 hover:bg-accent-500/25 inline-flex items-center gap-1.5"
          >
            RBC underwriting view <ChevronRight className="w-3 h-3" />
          </button>
        </>
      }
    >
      <div className="px-8 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-accent-500/15 ring-1 ring-accent-500/30 flex items-center justify-center text-accent-500 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-zinc-50">
              {DEMO_ENTITY.legal_name}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {DEMO_ENTITY.industry} · {DEMO_ENTITY.employees} employees ·
              Incorporated {DEMO_ENTITY.incorporation_date} · BN{" "}
              {DEMO_ENTITY.business_number}
            </p>
          </div>
          <ConnectionsMenu />
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <Kpi
            tone="emerald"
            icon={Wallet}
            label="Cash on hand"
            value={formatMoney(HEALTH.cash)}
            sub="Sum of operating + savings"
            source="QBO · Bank balances"
          />
          <Kpi
            tone="sky"
            icon={FileText}
            label="Accounts receivable"
            value={formatMoney(HEALTH.ar_total)}
            sub={`${overdueCount} overdue · DSO ${HEALTH.dso} days`}
            source="QBO · /accounting/invoices"
          />
          <Kpi
            tone="amber"
            icon={CreditCard}
            label="Accounts payable"
            value={formatMoney(HEALTH.ap_total)}
            sub={`DPO ${HEALTH.dpo} days`}
            source="QBO · /accounting/bills"
          />
          <Kpi
            tone={HEALTH.runway_months < 3 ? "rose" : "emerald"}
            icon={TrendingUp}
            label="Cash runway"
            value={`${HEALTH.runway_months} mo`}
            sub={`Burn ${formatMoney(HEALTH.monthly_burn)}/mo · 3-mo avg`}
            source="Derived · P&L + balances"
          />
        </div>

        {/* Two-col body */}
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-6 mt-8">
          {/* Left: AR/AP aging + customers/suppliers */}
          <div className="space-y-6">
            <Card title="Receivables aging" icon={FileText}>
              <AgingBars
                buckets={arBuckets}
                max={arMax}
                tone="ar"
                total={HEALTH.ar_total}
              />
              <p className="mt-3 text-[11px] text-zinc-500">
                Pulled from QuickBooks via Apideck{" "}
                <code className="text-accent-500">GET /accounting/invoices</code>
                . {overdueCount} of {INVOICES.length} invoices flagged overdue.
              </p>
            </Card>

            <Card title="Payables aging" icon={CreditCard}>
              <AgingBars
                buckets={apBuckets}
                max={apMax}
                tone="ap"
                total={HEALTH.ap_total}
              />
              <p className="mt-3 text-[11px] text-zinc-500">
                Pulled from QuickBooks via Apideck{" "}
                <code className="text-accent-500">GET /accounting/bills</code>.
              </p>
            </Card>

            <Card title="Top customers by open balance" icon={Layers}>
              <div className="space-y-2">
                {topCustomers.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-ink-700/50 ring-1 ring-white/5"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-zinc-100 truncate">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        YTD {formatMoney(c.ytd_revenue)} · {c.id}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm tabular-nums text-zinc-100">
                        {formatMoney(c.outstanding)}
                      </div>
                      <span
                        className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ring-1 ${BUCKET_TONE[c.bucket]}`}
                      >
                        {BUCKET_LABEL[c.bucket]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Revenue trend + payments + AI tile */}
          <div className="space-y-6">
            <Card
              title="Revenue trend · trailing 12 months"
              icon={TrendingUp}
              right={
                <span
                  className={`text-[11px] inline-flex items-center gap-1 ${
                    momPct >= 0 ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {momPct >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {formatPct(momPct)} MoM
                </span>
              }
            >
              <div>
                <div className="flex items-end gap-1.5 h-28">
                  {MONTHLY_PNL.map((m, i) => {
                    const h = Math.max(6, (m.revenue / revMax) * 100);
                    const isLast = i === MONTHLY_PNL.length - 1;
                    return (
                      <div
                        key={m.month}
                        className={`flex-1 rounded-t ${
                          isLast ? "bg-accent-500" : "bg-accent-500/40"
                        }`}
                        style={{ height: `${h}%` }}
                        title={`${m.month}: ${formatMoney(m.revenue)}`}
                      />
                    );
                  })}
                </div>
                <div className="flex gap-1.5 mt-1">
                  {MONTHLY_PNL.map((m) => (
                    <span
                      key={m.month}
                      className="flex-1 text-[9px] text-zinc-500 text-center"
                    >
                      {m.month.slice(5)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                <Mini
                  label="T12 revenue"
                  value={formatMoney(HEALTH.t12_revenue)}
                />
                <Mini
                  label="Gross margin"
                  value={formatPct(HEALTH.gross_margin_pct)}
                />
                <Mini
                  label="Operating margin"
                  value={formatPct(HEALTH.operating_margin_pct)}
                />
              </div>
            </Card>

            <Card title="Recent payment activity" icon={Banknote}>
              <div className="space-y-1.5">
                {recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-ink-700/50 ring-1 ring-white/5"
                  >
                    <ServiceChip
                      service_id={p.source}
                      name={p.source_label}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-zinc-100 truncate">
                        {p.description}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Net {formatMoney(p.net)} · fee {formatMoney(p.fee)} ·{" "}
                        {new Date(p.occurred_at).toLocaleDateString("en-CA")}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm tabular-nums text-emerald-300">
                        +{formatMoney(p.amount)}
                      </div>
                      <div
                        className={`text-[9px] uppercase tracking-wider ${
                          p.status === "settled"
                            ? "text-emerald-400"
                            : p.status === "pending"
                              ? "text-amber-300"
                              : "text-rose-300"
                        }`}
                      >
                        {p.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-zinc-500">
                Stripe payouts stream via Apideck{" "}
                <code className="text-accent-500">GET /payments/payouts</code>.{" "}
                <span className="text-amber-300/90">
                  Payments unified API not yet supported — illustrative.
                </span>
              </p>
            </Card>

            <button
              onClick={() => setAiOpen((v) => !v)}
              className="w-full text-left rounded-2xl bg-gradient-to-br from-accent-500/15 to-violet-500/10 ring-1 ring-accent-500/30 px-4 py-4 hover:from-accent-500/25 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-500/20 ring-1 ring-accent-500/40 flex items-center justify-center text-accent-500">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-zinc-50">
                    Talk to your data
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    AI assistant grounded in your live QBO + Stripe + payroll feeds.
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-1 transition" />
              </div>
              {aiOpen && (
                <div className="mt-3 space-y-2 text-[12px] text-zinc-300">
                  <Suggestion q="Which customers are most overdue and how much do they owe?" />
                  <Suggestion q="What was my gross margin trend over the last 6 months?" />
                  <Suggestion q="If a customer paid me 3 days faster, how much runway would that buy?" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </MacWindow>
  );
}

function Card({
  title,
  icon: Icon,
  right,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl ring-1 ring-white/5 bg-ink-800/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-400">
          <Icon className="w-3.5 h-3.5 text-accent-500" />
          {title}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Kpi({
  tone,
  icon: Icon,
  label,
  value,
  sub,
  source,
}: {
  tone: "emerald" | "sky" | "amber" | "rose";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  source: string;
}) {
  const ring: Record<typeof tone, string> = {
    emerald: "ring-emerald-500/30 text-emerald-300",
    sky: "ring-sky-500/30 text-sky-300",
    amber: "ring-amber-500/30 text-amber-300",
    rose: "ring-rose-500/30 text-rose-300",
  };
  return (
    <div className="rounded-xl ring-1 ring-white/5 bg-ink-800/60 p-4">
      <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-400">
        <span
          className={`w-5 h-5 rounded-md flex items-center justify-center ring-1 ${ring[tone]}`}
        >
          <Icon className="w-3 h-3" />
        </span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-zinc-50 tabular-nums">
        {value}
      </div>
      <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>
      <div className="text-[10px] text-zinc-600 mt-2 inline-flex items-center gap-1">
        <Wifi className="w-2.5 h-2.5" /> {source}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-ink-700/50 ring-1 ring-white/5 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="text-sm font-semibold text-zinc-100 tabular-nums">
        {value}
      </div>
    </div>
  );
}

function AgingBars({
  buckets,
  max,
  tone,
  total,
}: {
  buckets: Record<AgingBucket, number>;
  max: number;
  tone: "ar" | "ap";
  total: number;
}) {
  const order: AgingBucket[] = ["current", "1_30", "31_60", "61_90", "90_plus"];
  const barColor: Record<AgingBucket, string> = {
    current: "bg-emerald-400",
    "1_30": "bg-sky-400",
    "31_60": "bg-amber-400",
    "61_90": "bg-orange-400",
    "90_plus": "bg-rose-400",
  };
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl font-semibold text-zinc-50 tabular-nums">
          {formatMoney(total)}
        </span>
        <span className="text-[11px] text-zinc-500">
          total {tone === "ar" ? "receivable" : "payable"}
        </span>
      </div>
      <div className="space-y-1.5">
        {order.map((b) => {
          const v = buckets[b];
          const pct = (v / max) * 100;
          return (
            <div key={b} className="grid grid-cols-[80px_1fr_90px] items-center gap-3">
              <span className="text-[11px] text-zinc-400">
                {BUCKET_LABEL[b]}
              </span>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor[b]} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] text-zinc-300 tabular-nums text-right">
                {formatMoney(v)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConnectionsMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-zinc-100 px-2.5 py-1.5 rounded-md ring-1 ring-white/10 bg-ink-800/40 hover:bg-ink-700/60 transition"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {DEMO_CONNECTIONS.length} connections
        <ChevronRight
          className={`w-3 h-3 transition ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-80 z-40 rounded-xl bg-ink-800/95 ring-1 ring-white/10 shadow-xl backdrop-blur p-2 animate-fade-up">
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 flex items-center justify-between">
              <span>Connected via Apideck Vault</span>
              <span className="text-emerald-400">Synced just now</span>
            </div>
            <div className="space-y-1">
              {DEMO_CONNECTIONS.map((c) => (
                <ConnectionRow key={c.id} c={c} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ConnectionRow({ c }: { c: Connection }) {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-white/5">
      <ServiceChip service_id={c.service_id} name={c.service_name} />
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-zinc-100 truncate">
          {c.service_name}
        </div>
        <div className="text-[10px] text-zinc-500 truncate">
          {c.account_label}
        </div>
      </div>
      {c.is_multi_account_sibling && (
        <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-accent-500/15 ring-1 ring-accent-500/30 text-accent-500 shrink-0">
          Multi-acct
        </span>
      )}
    </div>
  );
}

function Suggestion({ q }: { q: string }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-ink-800/80 ring-1 ring-white/10 text-zinc-300 hover:bg-ink-700 cursor-pointer">
      <span className="text-accent-500">→</span> {q}
    </div>
  );
}

// Used by old page.tsx props passthrough — unused locally.
export const _DASHBOARD_TOUCH = { _: true, _icon: PieChart, _land: Landmark, _alert: AlertTriangle };
