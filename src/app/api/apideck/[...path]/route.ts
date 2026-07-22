import { NextRequest, NextResponse } from "next/server";
import {
  BALANCE_SHEET,
  BILLS,
  CUSTOMERS,
  INVOICES,
  MONTHLY_PNL,
  PAYMENTS,
  SUPPLIERS,
  TAX_FILING,
} from "@/lib/mockData";
import { apideckProxy, hasApideckCreds } from "@/lib/apideckServer";

// Mock of the Apideck unified APIs (Accounting + Payments) — request/response
// shapes mirror https://developers.apideck.com/apis/. Every route returns
// realistic data with a small artificial latency so the demo feels like a
// real network call.
//
// Endpoints implemented:
//   POST /vault/sessions
//   GET  /vault/connections/{service_id}
//   GET  /accounting/invoices
//   GET  /accounting/bills
//   GET  /accounting/customers
//   GET  /accounting/suppliers
//   GET  /accounting/balance-sheet
//   GET  /accounting/profit-and-loss
//   GET  /accounting/tax-filings
//   GET  /payments/payouts

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

const delay = (min = 350, max = 900) =>
  new Promise<void>((r) =>
    setTimeout(r, Math.floor(min + Math.random() * (max - min)))
  );

function requireHeaders(req: NextRequest) {
  const missing: string[] = [];
  for (const h of ["x-apideck-app-id", "x-apideck-consumer-id"]) {
    if (!req.headers.get(h)) missing.push(h);
  }
  return missing;
}

function ok(
  body: Record<string, unknown>,
  status = 200,
  service = "quickbooks",
  meta: Record<string, unknown> = {}
) {
  return NextResponse.json(
    {
      status_code: status,
      status: status >= 200 && status < 300 ? "OK" : "Error",
      service,
      ...meta,
      ...body,
    },
    { status }
  );
}

function parseLimit(url: URL, fallback = 5): number {
  const v = parseInt(url.searchParams.get("limit") ?? "", 10);
  return Number.isFinite(v) && v > 0 ? Math.min(v, 50) : fallback;
}

async function handle(method: string, route: string, req: NextRequest) {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const service = req.headers.get("x-apideck-service-id") ?? "quickbooks";
  await delay();

  // Vault — create session
  if (method === "POST" && route === "vault/sessions") {
    return ok(
      {
        resource: "Sessions",
        operation: "vaultSessionsCreate",
        data: {
          session_uri: `https://vault.apideck.com/session/${uid("vs")}`,
          expires_in: 1800,
        },
      },
      201,
      service
    );
  }

  // Vault — verify connection
  if (method === "GET" && route.startsWith("vault/connections/")) {
    const service_id = route.split("/")[2];
    return ok(
      {
        resource: "Connection",
        operation: "vaultConnectionsOne",
        data: {
          id: `connection_${service_id}_${uid("c").slice(0, 8)}`,
          service_id,
          unified_api: route.includes("payments") ? "payments" : "accounting",
          state: "callable",
          integration_state: "callable",
          updated_at: new Date().toISOString(),
        },
      },
      200,
      service
    );
  }

  // Accounting — invoices
  if (method === "GET" && route === "accounting/invoices") {
    const limit = parseLimit(url);
    return ok(
      {
        resource: "Invoices",
        operation: "invoicesAll",
        data: INVOICES.slice(0, limit).map((i) => ({
          id: i.id,
          number: i.number,
          customer: { id: i.customer_id, name: i.customer_name },
          issued_date: i.issued_date,
          due_date: i.due_date,
          total_amount: i.total,
          balance: i.balance,
          status: i.status,
          currency: i.currency,
        })),
        meta: {
          items_on_page: Math.min(limit, INVOICES.length),
          cursors: { current: "0", next: limit < INVOICES.length ? `${limit}` : null },
        },
      },
      200,
      service
    );
  }

  // Accounting — bills
  if (method === "GET" && route === "accounting/bills") {
    const limit = parseLimit(url);
    return ok(
      {
        resource: "Bills",
        operation: "billsAll",
        data: BILLS.slice(0, limit).map((b) => ({
          id: b.id,
          number: b.number,
          supplier: { id: b.supplier_id, name: b.supplier_name },
          issued_date: b.issued_date,
          due_date: b.due_date,
          total_amount: b.total,
          balance: b.balance,
          status: b.status,
          currency: b.currency,
        })),
      },
      200,
      service
    );
  }

  // Accounting — customers
  if (method === "GET" && route === "accounting/customers") {
    const limit = parseLimit(url, 10);
    return ok(
      {
        resource: "Customers",
        operation: "customersAll",
        data: CUSTOMERS.slice(0, limit).map((c) => ({
          id: c.id,
          display_name: c.name,
          email: c.email,
          balance: c.outstanding,
          ytd_revenue: c.ytd_revenue,
          last_invoice_at: c.last_invoice_at,
        })),
      },
      200,
      service
    );
  }

  // Accounting — suppliers
  if (method === "GET" && route === "accounting/suppliers") {
    const limit = parseLimit(url, 10);
    return ok(
      {
        resource: "Suppliers",
        operation: "suppliersAll",
        data: SUPPLIERS.slice(0, limit).map((s) => ({
          id: s.id,
          display_name: s.name,
          balance: s.balance_owed,
          category: s.category,
        })),
      },
      200,
      service
    );
  }

  // Accounting — balance sheet
  if (method === "GET" && route === "accounting/balance-sheet") {
    return ok(
      {
        resource: "BalanceSheet",
        operation: "balanceSheetOne",
        data: {
          id: uid("bs"),
          as_of: BALANCE_SHEET.as_of,
          currency: BALANCE_SHEET.currency,
          assets: {
            current: BALANCE_SHEET.current_assets,
            fixed: BALANCE_SHEET.fixed_assets,
          },
          liabilities: {
            current: BALANCE_SHEET.current_liabilities,
            long_term: BALANCE_SHEET.long_term_liabilities,
          },
          equity: BALANCE_SHEET.equity,
        },
      },
      200,
      service
    );
  }

  // Accounting — P&L
  if (method === "GET" && route === "accounting/profit-and-loss") {
    return ok(
      {
        resource: "ProfitAndLoss",
        operation: "profitAndLossOne",
        data: {
          id: uid("pnl"),
          currency: "CAD",
          period: "trailing_12_months",
          months: MONTHLY_PNL,
        },
      },
      200,
      service
    );
  }

  // Accounting — tax filings
  if (method === "GET" && route === "accounting/tax-filings") {
    return ok(
      {
        resource: "TaxFilings",
        operation: "taxFilingsAll",
        data: [TAX_FILING],
      },
      200,
      service
    );
  }

  // Payments — payouts
  if (method === "GET" && route === "payments/payouts") {
    const limit = parseLimit(url, 5);
    const filtered =
      service === "moneris"
        ? PAYMENTS.filter((p) => p.source === "moneris")
        : service === "stripe"
          ? PAYMENTS.filter((p) => p.source === "stripe")
          : PAYMENTS;
    return ok(
      {
        resource: "Payouts",
        operation: "payoutsAll",
        data: filtered.slice(0, limit).map((p) => ({
          id: p.id,
          source: p.source,
          description: p.description,
          gross_amount: p.amount,
          fee_amount: p.fee,
          net_amount: p.net,
          arrival_date: p.occurred_at,
          status: p.status,
          currency: "CAD",
        })),
      },
      200,
      service
    );
  }

  return NextResponse.json(
    {
      status_code: 404,
      status: "Not Found",
      detail: `Unknown route: ${method} /${route}`,
      received_body: body,
    },
    { status: 404 }
  );
}

// When APIDECK_API_KEY + APIDECK_APP_ID are set we proxy to the real
// unified API. Otherwise we serve the bundled mock data via handle().
async function route(method: "GET" | "POST", req: NextRequest, path: string[]) {
  const missing = requireHeaders(req);
  if (missing.length)
    return NextResponse.json(
      { status_code: 401, status: "Unauthorized", missing_headers: missing },
      { status: 401 }
    );

  // Cookie-based runtime override — when the user picks "Mock" in the UI
  // toggle we set apideck-mode=mock, which forces the proxy to skip the
  // live path even when credentials are configured.
  const cookieMode = req.cookies.get("apideck-mode")?.value;
  const forceMock = cookieMode === "mock";

  if (hasApideckCreds() && !forceMock) {
    const url = new URL(req.url);
    const consumerId =
      req.headers.get("x-apideck-consumer-id") || "demo-consumer";
    const serviceId = req.headers.get("x-apideck-service-id") || undefined;
    const fullPath = `${path.join("/")}${url.search}`;
    let body: unknown = undefined;
    if (method === "POST") {
      body = await req.json().catch(() => ({}));
    }
    try {
      const { status, data } = await apideckProxy({
        method,
        path: fullPath,
        consumerId,
        serviceId,
        body,
      });
      // Tag responses so the UI can show whether they came from live Apideck.
      return NextResponse.json(data, {
        status,
        headers: { "x-apideck-source": "live" },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        { status_code: 502, status: "Bad Gateway", detail: message },
        { status: 502, headers: { "x-apideck-source": "live-error" } }
      );
    }
  }

  const res = await handle(method, path.join("/"), req);
  res.headers.set("x-apideck-source", "mock");
  return res;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return route("GET", req, path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return route("POST", req, path);
}
