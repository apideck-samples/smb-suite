"use client";
import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Landmark,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import MacWindow from "./MacWindow";
import {
  BALANCE_SHEET,
  DEMO_ENTITY,
  HEALTH,
  MONTHLY_PNL,
  TAX_FILING,
  formatMoney,
  formatPct,
} from "@/lib/mockData";

// Lending decision logic — derives a recommendation from the unified data
// Apideck pulled. In production, the bank's risk engine would call /accounting/*
// and /payments/* endpoints directly and run its own scoring.
type Decision = "approved" | "conditional" | "review" | "decline";

function decide(): {
  decision: Decision;
  recommended_limit: number;
  rate_pp_over_prime: number;
  reasons: { positive: string[]; negative: string[] };
} {
  const positive: string[] = [];
  const negative: string[] = [];

  if (HEALTH.gross_margin_pct > 0.4) positive.push("Healthy gross margin (>40%)");
  else negative.push("Thin gross margin");

  if (HEALTH.current_ratio >= 1.5) positive.push(`Current ratio ${HEALTH.current_ratio} (>=1.5)`);
  else if (HEALTH.current_ratio >= 1.2) positive.push(`Adequate current ratio ${HEALTH.current_ratio}`);
  else negative.push(`Low current ratio (${HEALTH.current_ratio})`);

  if (HEALTH.debt_service_coverage >= 1.25) positive.push(`DSCR ${HEALTH.debt_service_coverage}x covers debt`);
  else negative.push(`DSCR ${HEALTH.debt_service_coverage}x below 1.25`);

  if (HEALTH.dso <= 45) positive.push(`DSO ${HEALTH.dso}d — strong collections`);
  else negative.push(`DSO ${HEALTH.dso}d — slow collections`);

  if (HEALTH.runway_months >= 3) positive.push(`Runway ${HEALTH.runway_months}mo`);
  else negative.push(`Thin runway ${HEALTH.runway_months}mo`);

  if (TAX_FILING.status === "filed") positive.push(`${TAX_FILING.tax_year} T2 filed on time`);

  const score =
    (HEALTH.gross_margin_pct > 0.4 ? 1 : 0) +
    (HEALTH.current_ratio >= 1.2 ? 1 : 0) +
    (HEALTH.debt_service_coverage >= 1.25 ? 1 : 0) +
    (HEALTH.dso <= 45 ? 1 : 0) +
    (HEALTH.runway_months >= 3 ? 1 : 0);

  let decision: Decision;
  if (score >= 5) decision = "approved";
  else if (score >= 4) decision = "conditional";
  else if (score >= 2) decision = "review";
  else decision = "decline";

  // Recommended LOC: 10% of T12 revenue, capped between $25k–$250k.
  const recommended_limit = Math.max(
    25_000,
    Math.min(250_000, Math.round((HEALTH.t12_revenue * 0.1) / 5_000) * 5_000)
  );
  const rate_pp_over_prime =
    decision === "approved" ? 2.5 : decision === "conditional" ? 3.75 : decision === "review" ? 5.0 : 0;

  return { decision, recommended_limit, rate_pp_over_prime, reasons: { positive, negative } };
}

export default function OperatorConsole({ onBack }: { onBack: () => void }) {
  const verdict = useMemo(() => decide(), []);
  const lastMonth = MONTHLY_PNL[MONTHLY_PNL.length - 1];
  const prevMonth = MONTHLY_PNL[MONTHLY_PNL.length - 2];
  const momPct = (lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue;
  const revMax = Math.max(...MONTHLY_PNL.map((m) => m.revenue), 1);

  const decisionStyle: Record<Decision, { bg: string; text: string; label: string }> = {
    approved: { bg: "bg-emerald-500/20 ring-emerald-500/40", text: "text-emerald-300", label: "Approve" },
    conditional: { bg: "bg-sky-500/20 ring-sky-500/40", text: "text-sky-300", label: "Conditional approve" },
    review: { bg: "bg-amber-500/20 ring-amber-500/40", text: "text-amber-300", label: "Refer to underwriter" },
    decline: { bg: "bg-rose-500/20 ring-rose-500/40", text: "text-rose-300", label: "Decline" },
  };
  const ds = decisionStyle[verdict.decision];

  return (
    <MacWindow
      title="Bank credit · underwriting console (platform lending feed)"
      footer={
        <>
          <button
            onClick={onBack}
            className="text-xs px-3 py-1.5 rounded-md bg-ink-700 text-zinc-300 hover:bg-ink-600 ring-1 ring-white/5"
          >
            ← Back to SMB dashboard
          </button>
          <span className="text-[11px] text-zinc-400 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Underwriting model · Apideck unified feed · pulled just now
          </span>
          <span className="text-[11px] text-zinc-500">
            Internal use · Bank Business Credit
          </span>
        </>
      }
    >
      <div className="px-8 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-xl bg-accent-500/15 ring-1 ring-accent-500/30 flex items-center justify-center text-accent-500 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-zinc-50">
              {DEMO_ENTITY.legal_name} · credit application
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {DEMO_ENTITY.industry} · {DEMO_ENTITY.employees} employees ·
              Incorporated {DEMO_ENTITY.incorporation_date} · BN{" "}
              {DEMO_ENTITY.business_number}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Real-time data feed: QuickBooks (×2 entities, multi-account) ·
              Stripe · TurboTax — pulled through Apideck unified API
            </p>
          </div>

          {/* Decision badge */}
          <div
            className={`rounded-xl ring-1 ${ds.bg} px-4 py-3 min-w-[180px]`}
          >
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">
              Recommendation
            </div>
            <div className={`text-base font-semibold ${ds.text}`}>
              {ds.label}
            </div>
            <div className="text-[11px] text-zinc-300 mt-1">
              {formatMoney(verdict.recommended_limit)} LOC
            </div>
            {verdict.rate_pp_over_prime > 0 && (
              <div className="text-[10px] text-zinc-500">
                Prime + {verdict.rate_pp_over_prime.toFixed(2)}pp
              </div>
            )}
          </div>
        </div>

        {/* Credit signals */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <Signal
            label="T12 revenue"
            value={formatMoney(HEALTH.t12_revenue)}
            delta={
              <span
                className={`inline-flex items-center gap-0.5 ${
                  momPct >= 0 ? "text-emerald-300" : "text-rose-300"
                }`}
              >
                {momPct >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {formatPct(momPct)} MoM
              </span>
            }
            ok
          />
          <Signal
            label="Gross margin"
            value={formatPct(HEALTH.gross_margin_pct)}
            ok={HEALTH.gross_margin_pct > 0.4}
          />
          <Signal
            label="Operating margin"
            value={formatPct(HEALTH.operating_margin_pct)}
            ok={HEALTH.operating_margin_pct > 0.08}
          />
          <Signal
            label="Current ratio"
            value={HEALTH.current_ratio.toString()}
            ok={HEALTH.current_ratio >= 1.2}
            sub="(assets / liabilities)"
          />
          <Signal
            label="DSCR"
            value={`${HEALTH.debt_service_coverage}x`}
            ok={HEALTH.debt_service_coverage >= 1.25}
            sub="Debt service coverage"
          />
          <Signal
            label="Cash runway"
            value={`${HEALTH.runway_months} mo`}
            ok={HEALTH.runway_months >= 3}
          />
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 mt-8">
          {/* Reasons */}
          <section className="rounded-xl ring-1 ring-white/5 bg-ink-800/60 p-4">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 mb-3 inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent-500" />
              Decision factors
            </div>
            <div className="space-y-2">
              {verdict.reasons.positive.map((r) => (
                <Reason key={r} kind="ok" text={r} />
              ))}
              {verdict.reasons.negative.map((r) => (
                <Reason key={r} kind="warn" text={r} />
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-zinc-500">
              <span className="text-[9px] uppercase tracking-wider text-amber-300 px-1 py-0.5 rounded bg-amber-500/10 ring-1 ring-amber-500/30 mr-1.5">
                Not yet supported
              </span>
              {TAX_FILING.tax_year} T2 filed{" "}
              <span className="text-zinc-300">{TAX_FILING.filed_at}</span> ·
              taxable income{" "}
              <span className="text-zinc-300">
                {formatMoney(TAX_FILING.taxable_income)}
              </span>{" "}
              · revenue per return{" "}
              <span className="text-zinc-300">
                {formatMoney(TAX_FILING.revenue)}
              </span>
              .
              <div className="text-[10px] text-zinc-600 mt-1">
                Cross-checked against QBO P&L via Apideck unified accounting feed.
                Apideck does not yet offer a unified Tax API.
              </div>
            </div>
          </section>

          {/* Revenue trend */}
          <section className="rounded-xl ring-1 ring-white/5 bg-ink-800/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-wider text-zinc-400 inline-flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-accent-500" />
                T12 monthly revenue & operating income
              </div>
              <span className="text-[10px] text-zinc-500">
                source: Apideck /accounting/profit-and-loss
              </span>
            </div>
            <div>
              <div className="flex items-end gap-1.5 h-32">
                {MONTHLY_PNL.map((m, i) => {
                  const revH = (m.revenue / revMax) * 100;
                  const opH = (Math.max(0, m.operating_income) / revMax) * 100;
                  const isLast = i === MONTHLY_PNL.length - 1;
                  return (
                    <div
                      key={m.month}
                      className="relative flex-1 h-full flex items-end"
                      title={`${m.month}: rev ${formatMoney(m.revenue)} · op ${formatMoney(m.operating_income)}`}
                    >
                      <div
                        className={`w-full rounded-t ${
                          isLast ? "bg-accent-500" : "bg-accent-500/40"
                        }`}
                        style={{ height: `${revH}%` }}
                      />
                      <div
                        className="absolute bottom-0 w-full bg-emerald-400/80 rounded-t"
                        style={{ height: `${opH}%` }}
                      />
                    </div>
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
            <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-accent-500" /> Revenue
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-emerald-400/80" /> Operating income
              </span>
            </div>
          </section>
        </div>

        {/* Balance sheet snapshot + AR ledger */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <section className="rounded-xl ring-1 ring-white/5 bg-ink-800/60 p-4">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 mb-3 inline-flex items-center gap-2">
              <Landmark className="w-3.5 h-3.5 text-accent-500" />
              Balance sheet snapshot
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <BSGroup
                title="Current assets"
                items={[
                  ["Cash", BALANCE_SHEET.current_assets.cash],
                  ["AR", BALANCE_SHEET.current_assets.ar],
                  ["Inventory", BALANCE_SHEET.current_assets.inventory],
                  ["Other", BALANCE_SHEET.current_assets.other],
                ]}
              />
              <BSGroup
                title="Current liabilities"
                items={[
                  ["AP", BALANCE_SHEET.current_liabilities.ap],
                  ["HST payable", BALANCE_SHEET.current_liabilities.hst_payable],
                  ["LOC drawn", BALANCE_SHEET.current_liabilities.line_of_credit],
                  ["Credit card", BALANCE_SHEET.current_liabilities.credit_card],
                ]}
              />
              <BSGroup
                title="Fixed assets"
                items={[
                  ["Equipment (net)", BALANCE_SHEET.fixed_assets.equipment_net],
                  ["Vehicles (net)", BALANCE_SHEET.fixed_assets.vehicles_net],
                ]}
              />
              <BSGroup
                title="Long-term debt"
                items={[
                  ["Term loan", BALANCE_SHEET.long_term_liabilities.term_loan],
                  ["Equipment loan", BALANCE_SHEET.long_term_liabilities.equipment_loan],
                ]}
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-3">
              Pulled via Apideck{" "}
              <code className="text-accent-500">/accounting/balance-sheet</code>
              {" "}as of {BALANCE_SHEET.as_of}.
            </p>
          </section>

          <section className="rounded-xl ring-1 ring-white/5 bg-ink-800/60 p-4">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 mb-3 inline-flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-accent-500" />
              Collateral candidates · receivables aging
            </div>
            <div className="space-y-2">
              <ArRow label="Current (eligible)" value={HEALTH.ar_by_bucket.current} eligible />
              <ArRow label="1–30 days (eligible)" value={HEALTH.ar_by_bucket["1_30"]} eligible />
              <ArRow label="31–60 days (eligible)" value={HEALTH.ar_by_bucket["31_60"]} eligible />
              <ArRow label="61–90 days (ineligible)" value={HEALTH.ar_by_bucket["61_90"]} />
              <ArRow label="90+ days (ineligible)" value={HEALTH.ar_by_bucket["90_plus"]} />
            </div>
            <p className="text-[10px] text-zinc-500 mt-3">
              Eligible AR pool (≤60d):{" "}
              <span className="text-emerald-300">
                {formatMoney(
                  HEALTH.ar_by_bucket.current +
                    HEALTH.ar_by_bucket["1_30"] +
                    HEALTH.ar_by_bucket["31_60"]
                )}
              </span>{" "}
              · borrowing base @ 80% advance ={" "}
              <span className="text-zinc-200">
                {formatMoney(
                  Math.round(
                    (HEALTH.ar_by_bucket.current +
                      HEALTH.ar_by_bucket["1_30"] +
                      HEALTH.ar_by_bucket["31_60"]) *
                      0.8
                  )
                )}
              </span>
            </p>
          </section>
        </div>
      </div>
    </MacWindow>
  );
}

function Signal({
  label,
  value,
  sub,
  delta,
  ok,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: React.ReactNode;
  ok?: boolean;
}) {
  return (
    <div className="rounded-xl ring-1 ring-white/5 bg-ink-800/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        {ok ? (
          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
        ) : (
          <AlertTriangle className="w-3 h-3 text-amber-300" />
        )}
      </div>
      <div className="mt-1 text-base font-semibold text-zinc-50 tabular-nums">
        {value}
      </div>
      {sub && <div className="text-[10px] text-zinc-500 truncate">{sub}</div>}
      {delta && <div className="text-[10px] mt-0.5">{delta}</div>}
    </div>
  );
}

function Reason({ kind, text }: { kind: "ok" | "warn"; text: string }) {
  return (
    <div className="flex items-start gap-2 text-[12px]">
      {kind === "ok" ? (
        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-300 shrink-0" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-amber-300 shrink-0" />
      )}
      <span className="text-zinc-200">{text}</span>
    </div>
  );
}

function BSGroup({
  title,
  items,
}: {
  title: string;
  items: Array<[string, number]>;
}) {
  const total = items.reduce((a, [, v]) => a + v, 0);
  return (
    <div className="rounded-lg bg-ink-700/40 ring-1 ring-white/5 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">
        {title}
      </div>
      <div className="space-y-1">
        {items.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-2">
            <span className="text-zinc-400 text-[11px] truncate">{k}</span>
            <span className="text-zinc-200 tabular-nums text-[11px]">
              {formatMoney(v)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5">
        <span className="text-zinc-300 text-[11px] font-medium">Total</span>
        <span className="text-zinc-50 tabular-nums text-[12px] font-semibold">
          {formatMoney(total)}
        </span>
      </div>
    </div>
  );
}

function ArRow({
  label,
  value,
  eligible,
}: {
  label: string;
  value: number;
  eligible?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-ink-700/40 ring-1 ring-white/5">
      <span
        className={`text-[12px] ${eligible ? "text-emerald-300" : "text-zinc-400"}`}
      >
        <Activity className="w-3 h-3 inline-block mr-1" />
        {label}
      </span>
      <span className="text-[12px] tabular-nums text-zinc-200">
        {formatMoney(value)}
      </span>
    </div>
  );
}
