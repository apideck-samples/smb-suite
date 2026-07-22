"use client";
import { useState } from "react";
import { Check, ChevronDown, CircleDashed, Loader2 } from "lucide-react";
import MacWindow from "./MacWindow";
import MockApiCall, { ApiResult } from "./MockApiCall";
import VaultMockModal from "./VaultMockModal";
import {
  DEMO_CONNECTIONS,
  DEMO_ENTITY,
} from "@/lib/mockData";
import { useSession } from "@/lib/session";

type StepId =
  | "vault-session"
  | "vault-link"
  | "fetch-invoices"
  | "fetch-balance-sheet"
  | "fetch-payouts"
  | "complete";

type StepState = "idle" | "running" | "done";

const STEP_ORDER: StepId[] = [
  "vault-session",
  "vault-link",
  "fetch-invoices",
  "fetch-balance-sheet",
  "fetch-payouts",
  "complete",
];

function buildHeaders(consumerId: string, service: string) {
  return {
    Authorization: "Bearer ${APIDECK_API_KEY}",
    "x-apideck-app-id": "${APIDECK_APP_ID}",
    "x-apideck-consumer-id": consumerId,
    "x-apideck-service-id": service,
    "Content-Type": "application/json",
  } as const;
}

export default function IntegrationProgress({
  consumerId = "demo-consumer",
  onFinished,
}: {
  // legacy props ignored
  institution?: unknown;
  accounts?: unknown;
  transactionsByAccount?: unknown;
  service?: string;
  onServiceChange?: (s: string) => void;
  consumerId?: string;
  onFinished: (ctx?: unknown) => void;
}) {
  // Primary accounting connection for the read demo (QBO OpCo)
  const accountingConn =
    DEMO_CONNECTIONS.find((c) => c.category === "accounting") ?? DEMO_CONNECTIONS[0];
  const paymentsConn =
    DEMO_CONNECTIONS.find((c) => c.category === "payments") ??
    DEMO_CONNECTIONS[0];
  const { session, setToken } = useSession();

  const [openStep, setOpenStep] = useState<StepId>("vault-session");
  const [stepState, setStepState] = useState<Record<StepId, StepState>>({
    "vault-session": "idle",
    "vault-link": "idle",
    "fetch-invoices": "idle",
    "fetch-balance-sheet": "idle",
    "fetch-payouts": "idle",
    complete: "idle",
  });

  const [sessionResult, setSessionResult] = useState<ApiResult>({ state: "idle" });
  const [invoicesResult, setInvoicesResult] = useState<ApiResult>({ state: "idle" });
  const [bsResult, setBsResult] = useState<ApiResult>({ state: "idle" });
  const [payoutsResult, setPayoutsResult] = useState<ApiResult>({ state: "idle" });
  const [sessionUri, setSessionUri] = useState("");
  const [vaultMockOpen, setVaultMockOpen] = useState(false);

  const advance = (from: StepId) => {
    const idx = STEP_ORDER.indexOf(from);
    setStepState((s) => ({ ...s, [from]: "done" }));
    const next = STEP_ORDER[idx + 1];
    if (next) setOpenStep(next);
  };

  const callApi = async (
    setter: (r: ApiResult) => void,
    method: "GET" | "POST",
    path: string,
    service: string,
    body?: unknown
  ) => {
    setter({ state: "running" });
    const start = performance.now();
    try {
      const r = await fetch(`/api/apideck/${path}`, {
        method,
        headers: {
          "content-type": "application/json",
          "x-apideck-app-id": "demo-app-id",
          "x-apideck-consumer-id": consumerId,
          "x-apideck-service-id": service,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await r.json();
      const ms = Math.round(performance.now() - start);
      setter({ state: r.ok ? "success" : "error", status: r.status, data, ms });
      return { ok: r.ok, data };
    } catch (e) {
      const ms = Math.round(performance.now() - start);
      const message = e instanceof Error ? e.message : String(e);
      setter({ state: "error", status: 0, data: { error: message }, ms });
      return { ok: false, data: null };
    }
  };

  const runVaultSession = async () => {
    setStepState((s) => ({ ...s, "vault-session": "running" }));
    const { ok, data } = await callApi(
      setSessionResult,
      "POST",
      "vault/sessions",
      accountingConn.service_id,
      {
        consumer_metadata: {
          account_name: DEMO_ENTITY.legal_name,
          user_name: DEMO_ENTITY.directors[0].name,
          email: DEMO_ENTITY.directors[0].email,
        },
        redirect_uri: "https://your-app.com/login/success",
      }
    );
    if (ok) {
      const payload = (data as { data?: { session_uri?: string; session_token?: string; token?: string } })?.data;
      if (payload?.session_uri) setSessionUri(payload.session_uri);
      // In live mode Apideck returns a real session JWT — store it so step 2
      // opens the real Vault widget instead of the mock modal. In mock mode
      // no token is returned and runVaultLink falls back to VaultMockModal.
      const realToken = payload?.session_token ?? payload?.token;
      if (realToken) setToken(realToken);
      advance("vault-session");
    } else setStepState((s) => ({ ...s, "vault-session": "idle" }));
  };

  const runVaultLink = async () => {
    setStepState((s) => ({ ...s, "vault-link": "running" }));
    // Real Vault widget — only available when the demo was launched via
    // /session/<jwt> (e.g. from apideck.com/samples) and so has a real JWT.
    if (session?.jwt) {
      try {
        const mod = await import("@apideck/vault-js");
        const ApideckVault =
          (mod as unknown as { ApideckVault?: { open: (opts: Record<string, unknown>) => void }; default?: { open: (opts: Record<string, unknown>) => void } }).ApideckVault ??
          (mod as unknown as { default: { open: (opts: Record<string, unknown>) => void } }).default;
        let advanced = false;
        const finish = () => {
          if (advanced) return;
          advanced = true;
          advance("vault-link");
        };
        ApideckVault.open({
          token: session.jwt,
          showAttribution: true,
          onConnectionChange: (c: { state?: string }) => {
            if (c?.state === "callable" || c?.state === "added") finish();
          },
          onClose: () => finish(),
        });
        return;
      } catch (e) {
        console.warn("Vault SDK failed to open, falling back to mock widget:", e);
      }
    }
    // Cold-launch fallback: open the in-app mock Vault modal so the demo
    // still shows a Vault-like authorization UX.
    setVaultMockOpen(true);
  };

  const runFetchInvoices = async () => {
    setStepState((s) => ({ ...s, "fetch-invoices": "running" }));
    const { ok } = await callApi(
      setInvoicesResult,
      "GET",
      "accounting/invoices?limit=5",
      accountingConn.service_id
    );
    if (ok) advance("fetch-invoices");
    else setStepState((s) => ({ ...s, "fetch-invoices": "idle" }));
  };

  const runFetchBalanceSheet = async () => {
    setStepState((s) => ({ ...s, "fetch-balance-sheet": "running" }));
    const { ok } = await callApi(
      setBsResult,
      "GET",
      "accounting/balance-sheet",
      accountingConn.service_id
    );
    if (ok) advance("fetch-balance-sheet");
    else setStepState((s) => ({ ...s, "fetch-balance-sheet": "idle" }));
  };

  const runFetchPayouts = async () => {
    setStepState((s) => ({ ...s, "fetch-payouts": "running" }));
    const { ok } = await callApi(
      setPayoutsResult,
      "GET",
      "payments/payouts?limit=5",
      paymentsConn.service_id
    );
    if (ok) advance("fetch-payouts");
    else setStepState((s) => ({ ...s, "fetch-payouts": "idle" }));
  };

  const runComplete = () => {
    setStepState((s) => ({ ...s, complete: "done" }));
    onFinished();
  };

  return (
    <MacWindow title="Apideck Unified API — pulling business-health data">
      <div className="px-8 py-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-50">
            Connect {DEMO_ENTITY.trade_name}&apos;s tools and pull live data
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            One Apideck Vault flow connects QuickBooks, Stripe, and TurboTax —
            then we issue unified read calls to assemble the business-health
            dashboard. Calls hit a local mock that mirrors the
            real{" "}
            <a
              href="https://developers.apideck.com/apis/accounting/reference"
              target="_blank"
              rel="noreferrer"
              className="text-accent-500 hover:underline"
            >
              Apideck Accounting unified API
            </a>
            ; unified Tax and Payments APIs shown here are not yet supported
            by Apideck.
          </p>
        </div>

        {/* Connections preview */}
        <div className="rounded-xl ring-1 ring-white/5 bg-ink-800/60 p-4 mb-5">
          <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2">
            Connections in scope
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {DEMO_CONNECTIONS.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-ink-700/60 ring-1 ring-white/5"
              >
                <span className="w-7 h-7 rounded-md bg-accent-500/15 ring-1 ring-accent-500/30 text-accent-500 text-[10px] font-bold flex items-center justify-center">
                  {c.service_name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-zinc-100 truncate">
                    {c.service_name}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {c.account_label}
                  </div>
                </div>
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 px-1.5 py-0.5 rounded ring-1 ring-white/10">
                  {c.category}
                </span>
                {c.is_multi_account_sibling && (
                  <span className="text-[9px] uppercase tracking-wider text-accent-500 px-1.5 py-0.5 rounded bg-accent-500/15 ring-1 ring-accent-500/40">
                    Multi-acct
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Step
            title="Step 1 — Create an Apideck Vault session"
            state={stepState["vault-session"]}
            open={openStep === "vault-session"}
            onToggle={() =>
              setOpenStep(
                openStep === "vault-session" ? ("" as StepId) : "vault-session"
              )
            }
          >
            <p className="text-sm text-zinc-300 mb-3">
              One Vault session covers every tool the SMB needs to connect —
              accounting, payments, tax. The customer authorizes each in a
              single hosted flow.
            </p>
            <MockApiCall
              method="POST"
              endpoint="https://unify.apideck.com/vault/sessions"
              headers={buildHeaders(consumerId, accountingConn.service_id)}
              body={{
                consumer_metadata: {
                  account_name: DEMO_ENTITY.legal_name,
                  user_name: DEMO_ENTITY.directors[0].name,
                  email: DEMO_ENTITY.directors[0].email,
                },
                redirect_uri: "https://your-app.com/login/success",
              }}
              result={sessionResult}
              onRun={runVaultSession}
            />
          </Step>

          <Step
            title="Step 2 — Customer connects QuickBooks, Stripe, TurboTax"
            state={stepState["vault-link"]}
            open={openStep === "vault-link"}
            onToggle={() =>
              setOpenStep(
                openStep === "vault-link" ? ("" as StepId) : "vault-link"
              )
            }
            disabled={sessionResult.state !== "success"}
          >
            <p className="text-sm text-zinc-300 mb-3">
              The customer authorizes each provider through Apideck Vault.
              Multi-account support lets them link two QuickBooks realms —
              OpCo and Holdings — under a single consumer.
            </p>
            <div className="font-mono text-[11px] text-zinc-300 bg-zinc-950 ring-1 ring-white/10 rounded-md px-3 py-2 break-all mb-3">
              {sessionUri || "<from step 1>"}
            </div>
            <button
              type="button"
              onClick={runVaultLink}
              disabled={!sessionUri || stepState["vault-link"] === "running"}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-accent-500 hover:bg-accent-600 text-white text-sm disabled:opacity-50"
            >
              {stepState["vault-link"] === "running" && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {session?.jwt
                ? "Open Vault widget & authorize all tools"
                : "Open Vault link & authorize"}
            </button>
          </Step>

          <Step
            title="Step 3 — Pull receivables from QuickBooks"
            state={stepState["fetch-invoices"]}
            open={openStep === "fetch-invoices"}
            onToggle={() =>
              setOpenStep(
                openStep === "fetch-invoices" ? ("" as StepId) : "fetch-invoices"
              )
            }
            disabled={stepState["vault-link"] !== "done"}
          >
            <p className="text-sm text-zinc-300 mb-3">
              Read live AR via{" "}
              <code className="text-accent-500">GET /accounting/invoices</code>.
              Apideck unifies QuickBooks <code>Invoice</code>, Xero{" "}
              <code>Invoice</code>, and Wave <code>Invoice</code> into one
              shape.
            </p>
            <MockApiCall
              method="GET"
              endpoint="https://unify.apideck.com/accounting/invoices?limit=5"
              headers={buildHeaders(consumerId, accountingConn.service_id)}
              result={invoicesResult}
              onRun={runFetchInvoices}
            />
          </Step>

          <Step
            title="Step 4 — Pull balance sheet snapshot"
            state={stepState["fetch-balance-sheet"]}
            open={openStep === "fetch-balance-sheet"}
            onToggle={() =>
              setOpenStep(
                openStep === "fetch-balance-sheet"
                  ? ("" as StepId)
                  : "fetch-balance-sheet"
              )
            }
            disabled={stepState["fetch-invoices"] !== "done"}
          >
            <p className="text-sm text-zinc-300 mb-3">
              The lending-side endpoint:{" "}
              <code className="text-accent-500">
                GET /accounting/balance-sheet
              </code>{" "}
              returns the assets/liabilities/equity snapshot RBC needs to
              evaluate credit.
            </p>
            <MockApiCall
              method="GET"
              endpoint="https://unify.apideck.com/accounting/balance-sheet"
              headers={buildHeaders(consumerId, accountingConn.service_id)}
              result={bsResult}
              onRun={runFetchBalanceSheet}
            />
          </Step>

          <Step
            title="Step 5 — Pull settled payouts from Stripe"
            state={stepState["fetch-payouts"]}
            open={openStep === "fetch-payouts"}
            onToggle={() =>
              setOpenStep(
                openStep === "fetch-payouts" ? ("" as StepId) : "fetch-payouts"
              )
            }
            disabled={stepState["fetch-balance-sheet"] !== "done"}
          >
            <div className="text-[10px] uppercase tracking-wider text-amber-300 inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-amber-500/10 ring-1 ring-amber-500/30 mb-3">
              Not yet supported · Payments unified API
            </div>
            <p className="text-sm text-zinc-300 mb-3">
              Apideck pulls the SMB&apos;s payments processor via{" "}
              <code className="text-accent-500">GET /payments/payouts</code>.
              The same call works for any supported processor — Stripe today,
              Square or Moneris if the SMB switches later.
            </p>
            <MockApiCall
              method="GET"
              endpoint="https://unify.apideck.com/payments/payouts?limit=5"
              headers={buildHeaders(consumerId, paymentsConn.service_id)}
              result={payoutsResult}
              onRun={runFetchPayouts}
            />
          </Step>

          <Step
            title="Step 6 — Done — dashboard is hydrated"
            state={stepState.complete}
            open={openStep === "complete"}
            onToggle={() =>
              setOpenStep(openStep === "complete" ? ("" as StepId) : "complete")
            }
            disabled={payoutsResult.state !== "success"}
          >
            <p className="text-sm text-zinc-300 mb-3">
              Same connection covers ongoing sync, webhook events for new
              invoices/payments, and the lending data feed RBC consumes for
              credit decisions.
            </p>
            <button
              type="button"
              onClick={runComplete}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-accent-500 hover:bg-accent-600 text-white text-sm"
            >
              View business health dashboard
            </button>
          </Step>
        </div>
      </div>
      {vaultMockOpen && (
        <VaultMockModal
          sessionUri={sessionUri}
          consumerLabel={DEMO_ENTITY.legal_name}
          onClose={() => {
            setVaultMockOpen(false);
            // If the user closes without authorizing all, revert the running state.
            setStepState((s) =>
              s["vault-link"] === "running"
                ? { ...s, "vault-link": "idle" }
                : s
            );
          }}
          onComplete={() => advance("vault-link")}
        />
      )}
    </MacWindow>
  );
}

function Step({
  title,
  state,
  open,
  disabled,
  onToggle,
  children,
}: {
  title: string;
  state: StepState;
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl ring-1 ring-white/5 overflow-hidden bg-ink-800/60 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <StateIcon state={state} />
          <span className="text-sm text-zinc-100 truncate">{title}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>
      {open && !disabled && (
        <div className="px-4 pb-4 pt-1 border-t border-white/5 animate-fade-up">
          {children}
        </div>
      )}
    </div>
  );
}

function StateIcon({ state }: { state: StepState }) {
  if (state === "done")
    return (
      <span className="w-6 h-6 shrink-0 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/40 flex items-center justify-center">
        <Check className="w-3.5 h-3.5 text-emerald-300" />
      </span>
    );
  if (state === "running")
    return (
      <span className="w-6 h-6 shrink-0 rounded-full bg-accent-500/20 ring-1 ring-accent-500/40 flex items-center justify-center">
        <Loader2 className="w-3.5 h-3.5 text-accent-500 animate-spin" />
      </span>
    );
  return (
    <span className="w-6 h-6 shrink-0 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
      <CircleDashed className="w-3.5 h-3.5 text-zinc-500" />
    </span>
  );
}
