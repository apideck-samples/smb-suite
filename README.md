# Apideck SMB Suite — Business Health & Lending

A fully interactive walk-through of how a platform serving SMBs (registration,
compliance, fintech, vertical SaaS, neobanks, anything that touches small
businesses) can use **Apideck's unified Accounting + HRIS APIs** to evolve
from a point-in-time tool into a continuous-value platform:

1. SMB picks one provider per category — the platform's in-house option **or**
   bring-your-own from **QuickBooks, Xero, Wave, FreshBooks, Sage** for
   accounting; **TurboTax / QB Tax** for tax; **Stripe, Moneris, Square** for
   payments; **Wagepoint, Deel, ADP Run, Sage HR, BambooHR** for payroll/HRIS;
   **Sonnet, Zensurance, Apollo** for insurance — through one Apideck Vault
   flow.
2. Apideck pulls live data: invoices, bills, balance sheet, P&L, customers,
   payouts.
3. The platform surfaces a **Business Health Dashboard** for the SMB — AR/AP
   aging, cash runway, revenue trend, "talk to your data" AI.
4. The same unified feed flows into a **bank's credit-underwriting engine**
   as a lending view — DSCR, current ratio, recommended LOC, automated decision.

The default mock SMB is "Northwind Roofing Inc." — a fictional Canadian
roofing company. Pass `?prospect=domain.com&prospect_name=Acme` in the URL
to brand the demo for a specific prospect.

Every API call hits a local Next.js mock (`/api/apideck/*`) that mirrors
the real [Apideck unified API](https://developers.apideck.com/apis/)
shapes — Vault, Accounting, Payments.

> **Note on API availability**
> Apideck's **Accounting** unified API is GA. The **Tax** and **Payments**
> unified APIs surfaced in this demo are *not yet supported* by Apideck —
> shown here only to illustrate where they'd plug in once available.
> Anywhere they're used the UI carries a yellow *Not yet supported* tag so
> prospects aren't misled.

## Run it

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

### Mock mode (default)

With no credentials configured the demo serves a bundled mock from
`/api/apideck/*` and the dashboard, lending view and walkthrough render
seeded fake data. A `Mock data` chip appears in the top-right of the page
header. Everything is clickable end-to-end without leaving localhost.

### Live mode (real Apideck QuickBooks connection)

Drop your Apideck credentials into `.env.local`:

```env
APIDECK_API_KEY=apideck_test_...
APIDECK_APP_ID=...
APIDECK_DEFAULT_CONSUMER_ID=northwind-roofing   # optional
```

Restart `pnpm dev`. The header chip flips to `Live Apideck` and the
catch-all proxy at `/api/apideck/[...path]/route.ts` forwards every call
to `https://unify.apideck.com`. The walkthrough then:

1. Hits the real `POST /vault/sessions` (Apideck mints a real session JWT)
2. Opens the real `@apideck/vault-js` widget — the user authorizes their
   actual QuickBooks Online realm via OAuth
3. Steps 3–5 hit the real `GET /accounting/invoices`,
   `GET /accounting/balance-sheet`, `GET /payments/payouts` against the
   connected QBO

Credentials live only in `.env.local` (gitignored). Removing them reverts
the demo to mock mode without further changes.

## The four stages

| # | Stage | What it shows |
|---|---|---|
| 1 | **Pick tools** | The SMB selects which accounting / tax / payments tools they already use. MCP (two QuickBooks realms) demoed by selecting QBO. |
| 2 | **Connect & pull** | Step-by-step API walkthrough: `POST /vault/sessions`, open Vault link, then `GET /accounting/invoices`, `GET /accounting/balance-sheet`, `GET /payments/payouts`. Each call shows request, headers, response, latency. |
| 3 | **Business health** | The SMB-facing dashboard — KPIs (cash, AR, AP, runway), AR/AP aging, top customers, revenue trend, recent payment activity, AI grounding tile. |
| 4 | **Lending view** | The RBC-side underwriting console — gross margin, DSCR, current ratio, DSO/DPO, runway, recommended credit line, automated decision. |

### Launch params

The demo accepts URL params so it can be embedded from `apideck.com/samples`
or shared with a prospect-specific frame:

| Param | Effect |
|---|---|
| `?source=apideck-samples` | Shows a "welcome from Apideck samples" banner |
| `?service=quickbooks\|xero\|sage\|freshbooks\|wave-accounting\|…` | Highlights the target accounting service in the walkthrough |
| `?consumer_id=…` | Forwarded as `x-apideck-consumer-id` in displayed API calls |
| `?prospect=domain.com&prospect_name=…` | Brand the picker for a specific prospect |

The app also serves a permissive `frame-ancestors` CSP so it can be
embedded in an iframe from `apideck.com`.

## API surface mocked

| Call | Apideck endpoint |
|---|---|
| Create Vault session | `POST /vault/sessions` |
| Verify Vault connection | `GET  /vault/connections/{service_id}` |
| List invoices (AR) | `GET  /accounting/invoices` |
| List bills (AP) | `GET  /accounting/bills` |
| List customers | `GET  /accounting/customers` |
| List suppliers | `GET  /accounting/suppliers` |
| Balance sheet | `GET  /accounting/balance-sheet` |
| Profit & loss | `GET  /accounting/profit-and-loss` |
| Tax filings | `GET  /accounting/tax-filings` |
| Payouts (Stripe + Moneris) | `GET  /payments/payouts` |

Each mock returns the realistic shape of the unified API so the walkthrough
teaches the same JSON you'd send in production.

## Stack

- Next.js 14 (App Router)
- React 18
- Tailwind CSS 3
- lucide-react
- `@apideck/vault-js` for the real Vault drop-in

## Structure

```
src/
  app/
    page.tsx                         # 4-stage state machine
    api/apideck/[...path]/route.ts   # mock unified Accounting + Payments API
  components/
    AddAccounts.tsx                  # tool picker (accounting / tax / payments)
    IntegrationProgress.tsx          # Vault + read-API walkthrough
    Dashboard.tsx                    # SMB business-health view
    OperatorConsole.tsx              # RBC lending / underwriting view
    LaunchedFromBanner.tsx           # query-param welcome banner
    MacWindow.tsx                    # macOS chrome
    MockApiCall.tsx                  # request/response panel
  lib/
    mockData.ts                      # entity, connections, AR/AP, P&L, BS, health
    launchParams.ts                  # ?source= / ?service= / ?consumer_id= parser
    accountingTheme.ts               # accounting service-id registry
    session.tsx                      # /session/<jwt> launch from samples page
```
