// Mock data for the Apideck SMB Suite business-health + lending demo.
//
// The demo's narrative: a newly-incorporated Canadian SMB (Northwind Roofing
// Inc.) connects its existing SaaS tools — QuickBooks (×2 to show multi-
// account), Stripe, TurboTax, Wagepoint — through Apideck. The unified API
// pulls real-time financial data, which the host platform surfaces as a
// Business Health Dashboard and pipes into a bank's credit-underwriting
// engine.
//
// Everything below is deterministic (seeded RNG) so the demo renders the
// same numbers every load.

// Deterministic seeded RNG (sin-based, same trick used elsewhere).
function seeded(seed: number) {
  return (n: number) => {
    const x = Math.sin(seed + n * 9301) * 10000;
    return x - Math.floor(x);
  };
}
const rnd = seeded(7331);

// --- Entity --------------------------------------------------------------

export type SmbEntity = {
  legal_name: string;
  trade_name: string;
  jurisdiction: "ON" | "BC" | "AB" | "QC" | "FED";
  business_number: string;
  incorporation_date: string;
  fiscal_year_end: string;
  base_currency: "CAD";
  directors: Array<{ name: string; email: string; role: string }>;
  industry: string;
  employees: number;
  website: string;
};

export const DEMO_ENTITY: SmbEntity = {
  legal_name: "Northwind Roofing Inc.",
  trade_name: "Northwind Roofing",
  jurisdiction: "ON",
  business_number: "789456123 RC0001",
  incorporation_date: "2024-03-18",
  fiscal_year_end: "12-31",
  base_currency: "CAD",
  industry: "Residential & light-commercial roofing",
  employees: 14,
  website: "northwindroofing.example.ca",
  directors: [
    { name: "Avery Chen", email: "avery@northwind.example", role: "Director, CEO" },
    { name: "Jordan Patel", email: "jordan@northwind.example", role: "Director, COO" },
  ],
};

// --- Connections --------------------------------------------------------
// A connection is one (consumer × service × account) tuple in Apideck terms.
// Multiple connections for the same service demonstrates multi-account support.

export type ConnectionCategory = "accounting" | "tax" | "payments";

export type Connection = {
  id: string;
  category: ConnectionCategory;
  service_id: string;          // Apideck service slug
  service_name: string;
  account_label: string;       // friendly label (e.g. "Northwind OpCo · QuickBooks")
  status: "ready" | "syncing" | "error";
  connected_at: string;
  // For multi-account demo — multiple connections share the same service_id.
  is_multi_account_sibling?: boolean;
};

export const DEMO_CONNECTIONS: Connection[] = [
  {
    id: "conn_qbo_opco",
    category: "accounting",
    service_id: "quickbooks",
    service_name: "QuickBooks Online",
    account_label: "Northwind Roofing OpCo",
    status: "ready",
    connected_at: "2026-05-24T14:02:11Z",
    is_multi_account_sibling: true,
  },
  {
    id: "conn_qbo_holdings",
    category: "accounting",
    service_id: "quickbooks",
    service_name: "QuickBooks Online",
    account_label: "Northwind Roofing Holdings",
    status: "ready",
    connected_at: "2026-05-24T14:03:47Z",
    is_multi_account_sibling: true,
  },
  {
    id: "conn_stripe",
    category: "payments",
    service_id: "stripe",
    service_name: "Stripe",
    account_label: "Stripe · acct_1QnA…",
    status: "ready",
    connected_at: "2026-05-24T14:05:02Z",
  },
  {
    id: "conn_turbotax",
    category: "tax",
    service_id: "turbotax",
    service_name: "TurboTax Business",
    account_label: "TurboTax · 2025 T2 return",
    status: "ready",
    connected_at: "2026-05-24T14:07:33Z",
  },
];

// --- Customers + AR ------------------------------------------------------

export type AgingBucket = "current" | "1_30" | "31_60" | "61_90" | "90_plus";

export type Customer = {
  id: string;
  name: string;
  email: string;
  outstanding: number;   // total open AR for this customer
  bucket: AgingBucket;   // worst aging bucket they sit in
  last_invoice_at: string;
  ytd_revenue: number;
};

const CUSTOMER_NAMES = [
  "Sunfield Property Management",
  "Maplebrook Developments",
  "Cedarpoint Homes Inc.",
  "Greaves & Sons Contracting",
  "Beaufort Realty Group",
  "Lakeside Estates Ltd.",
  "Harbourview Construction",
  "Trillium Property Trust",
  "Riverbend Builders",
  "Northern Heights HOA",
  "Ironwood Commercial",
  "Pinecrest Holdings",
];

export const CUSTOMERS: Customer[] = CUSTOMER_NAMES.map((name, i) => {
  const outstanding = Math.round((4_000 + rnd(i + 1) * 38_000) / 100) * 100;
  const bucket: AgingBucket =
    i === 0 ? "90_plus" : i < 3 ? "61_90" : i < 6 ? "31_60" : i < 9 ? "1_30" : "current";
  const ytd = Math.round((28_000 + rnd(i + 11) * 220_000) / 1000) * 1000;
  const daysAgo = Math.floor(8 + rnd(i + 21) * 60);
  return {
    id: `cust_${(i + 1).toString().padStart(4, "0")}`,
    name,
    email: `ap@${name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.example`,
    outstanding,
    bucket,
    last_invoice_at: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    ytd_revenue: ytd,
  };
});

// --- Suppliers + AP ------------------------------------------------------

export type Supplier = {
  id: string;
  name: string;
  balance_owed: number;
  bucket: AgingBucket;
  category: string;
};

const SUPPLIER_NAMES: Array<[string, string]> = [
  ["BMR Pro Roofing Supply", "Materials"],
  ["GAF Canada Distribution", "Materials"],
  ["IKO Industries", "Materials"],
  ["Home Depot Pro", "Materials"],
  ["Enbridge Gas", "Utilities"],
  ["Bell Mobility Business", "Telecom"],
  ["ADP Canada", "Payroll"],
  ["Intuit QuickBooks", "Software"],
  ["RBC Visa Business", "Card"],
  ["WSIB Ontario", "Insurance"],
];

export const SUPPLIERS: Supplier[] = SUPPLIER_NAMES.map(([name, category], i) => {
  const owed = Math.round((1_200 + rnd(i + 31) * 18_000) / 100) * 100;
  const bucket: AgingBucket =
    i === 0 ? "61_90" : i < 3 ? "31_60" : i < 6 ? "1_30" : "current";
  return {
    id: `sup_${(i + 1).toString().padStart(4, "0")}`,
    name,
    balance_owed: owed,
    bucket,
    category,
  };
});

// --- Invoices (AR) -------------------------------------------------------

export type InvoiceStatus = "paid" | "open" | "overdue" | "draft";

export type Invoice = {
  id: string;
  number: string;
  customer_id: string;
  customer_name: string;
  issued_date: string;
  due_date: string;
  total: number;
  balance: number;       // amount outstanding
  status: InvoiceStatus;
  currency: "CAD";
};

function buildInvoices(): Invoice[] {
  const out: Invoice[] = [];
  let n = 1024;
  for (const c of CUSTOMERS) {
    const count = 1 + Math.floor(rnd(parseInt(c.id.slice(-3))) * 4);
    for (let k = 0; k < count; k++) {
      n += 1;
      const issuedDays = 8 + Math.floor(rnd(n) * 110);
      const total = Math.round((1_800 + rnd(n + 7) * 22_000) / 100) * 100;
      const issued = new Date(Date.now() - issuedDays * 86_400_000);
      const due = new Date(issued.getTime() + 30 * 86_400_000);
      const overdue = due.getTime() < Date.now();
      const paid = rnd(n + 13) < 0.45 && !overdue;
      const status: InvoiceStatus = paid ? "paid" : overdue ? "overdue" : "open";
      out.push({
        id: `inv_${n.toString(36)}`,
        number: `INV-${(n).toString().padStart(5, "0")}`,
        customer_id: c.id,
        customer_name: c.name,
        issued_date: issued.toISOString(),
        due_date: due.toISOString(),
        total,
        balance: paid ? 0 : total,
        status,
        currency: "CAD",
      });
    }
  }
  return out.sort(
    (a, b) => new Date(b.issued_date).getTime() - new Date(a.issued_date).getTime()
  );
}

export const INVOICES: Invoice[] = buildInvoices();

// --- Bills (AP) ----------------------------------------------------------

export type Bill = {
  id: string;
  number: string;
  supplier_id: string;
  supplier_name: string;
  issued_date: string;
  due_date: string;
  total: number;
  balance: number;
  status: InvoiceStatus;
  currency: "CAD";
};

function buildBills(): Bill[] {
  const out: Bill[] = [];
  let n = 5301;
  for (const s of SUPPLIERS) {
    const count = 1 + Math.floor(rnd(n + 3) * 3);
    for (let k = 0; k < count; k++) {
      n += 1;
      const issuedDays = 6 + Math.floor(rnd(n) * 70);
      const total = Math.round((300 + rnd(n + 5) * 9_000) / 100) * 100;
      const issued = new Date(Date.now() - issuedDays * 86_400_000);
      const due = new Date(issued.getTime() + 30 * 86_400_000);
      const overdue = due.getTime() < Date.now();
      const paid = rnd(n + 17) < 0.55;
      const status: InvoiceStatus = paid ? "paid" : overdue ? "overdue" : "open";
      out.push({
        id: `bill_${n.toString(36)}`,
        number: `BILL-${(n).toString().padStart(5, "0")}`,
        supplier_id: s.id,
        supplier_name: s.name,
        issued_date: issued.toISOString(),
        due_date: due.toISOString(),
        total,
        balance: paid ? 0 : total,
        status,
        currency: "CAD",
      });
    }
  }
  return out.sort(
    (a, b) => new Date(b.issued_date).getTime() - new Date(a.issued_date).getTime()
  );
}

export const BILLS: Bill[] = buildBills();

// --- Payment activity (Stripe + Moneris) ---------------------------------

export type PaymentSource = "stripe" | "moneris";

export type Payment = {
  id: string;
  source: PaymentSource;
  source_label: string;       // "Stripe payout", "Moneris settlement"
  description: string;
  amount: number;
  fee: number;                // processor fee
  net: number;
  occurred_at: string;
  status: "settled" | "pending" | "failed";
};

function buildPayments(): Payment[] {
  const out: Payment[] = [];
  const stripeTitles = [
    "Stripe payout — sp_1QnA",
    "Stripe payout — sp_1QnB",
    "Stripe payout — sp_1QnC",
    "Stripe payout — sp_1QnD",
  ];
  // 28 days of Stripe payout activity. (SMBs typically use a single
  // payments processor; Stripe is the one Northwind selected.)
  for (let i = 0; i < 28; i++) {
    const amount = Math.round((2_400 + rnd(i + 41) * 12_000) / 10) * 10;
    const fee = Math.round(amount * 0.029 * 100) / 100;
    const net = Math.round((amount - fee) * 100) / 100;
    const occurred = new Date(Date.now() - i * 86_400_000);
    out.push({
      id: `pay_${(i + 1).toString(36)}s`,
      source: "stripe",
      source_label: "Stripe",
      description: stripeTitles[i % stripeTitles.length],
      amount,
      fee,
      net,
      occurred_at: occurred.toISOString(),
      status: i === 4 ? "pending" : i === 14 ? "failed" : "settled",
    });
  }
  return out;
}

export const PAYMENTS: Payment[] = buildPayments();

// --- Balance sheet snapshot ---------------------------------------------

export type BalanceSheet = {
  as_of: string;
  currency: "CAD";
  current_assets: { cash: number; ar: number; inventory: number; other: number };
  fixed_assets: { equipment_net: number; vehicles_net: number };
  current_liabilities: { ap: number; hst_payable: number; line_of_credit: number; credit_card: number };
  long_term_liabilities: { term_loan: number; equipment_loan: number };
  equity: { common_shares: number; retained_earnings: number };
};

export const BALANCE_SHEET: BalanceSheet = {
  as_of: new Date().toISOString().slice(0, 10),
  currency: "CAD",
  current_assets: { cash: 94_820, ar: 148_300, inventory: 22_400, other: 6_100 },
  fixed_assets: { equipment_net: 78_500, vehicles_net: 42_300 },
  current_liabilities: {
    ap: 62_140,
    hst_payable: 11_800,
    line_of_credit: 38_000,
    credit_card: 9_650,
  },
  long_term_liabilities: { term_loan: 64_500, equipment_loan: 28_900 },
  equity: { common_shares: 1_000, retained_earnings: 0 /* computed */ },
};

// Plug retained_earnings so the balance sheet balances.
(function plugRetainedEarnings() {
  const a =
    BALANCE_SHEET.current_assets.cash +
    BALANCE_SHEET.current_assets.ar +
    BALANCE_SHEET.current_assets.inventory +
    BALANCE_SHEET.current_assets.other +
    BALANCE_SHEET.fixed_assets.equipment_net +
    BALANCE_SHEET.fixed_assets.vehicles_net;
  const l =
    BALANCE_SHEET.current_liabilities.ap +
    BALANCE_SHEET.current_liabilities.hst_payable +
    BALANCE_SHEET.current_liabilities.line_of_credit +
    BALANCE_SHEET.current_liabilities.credit_card +
    BALANCE_SHEET.long_term_liabilities.term_loan +
    BALANCE_SHEET.long_term_liabilities.equipment_loan;
  BALANCE_SHEET.equity.retained_earnings =
    a - l - BALANCE_SHEET.equity.common_shares;
})();

// --- 12-month P&L --------------------------------------------------------

export type MonthlyPnl = {
  month: string;             // "2025-06"
  revenue: number;
  cogs: number;
  opex: number;
  gross_profit: number;
  operating_income: number;
};

function buildPnl(): MonthlyPnl[] {
  const out: MonthlyPnl[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    // Seasonal roofing curve: peak May–Sept (months 4-8), trough Dec-Feb.
    const m = d.getMonth();
    const seasonal =
      m >= 4 && m <= 8 ? 1.35 : m >= 9 && m <= 10 ? 1.0 : m === 11 || m <= 1 ? 0.55 : 0.9;
    const revenue = Math.round((52_000 + rnd(i + 51) * 22_000) * seasonal);
    const cogs = Math.round(revenue * (0.42 + rnd(i + 61) * 0.08));
    const opex = Math.round(28_000 + rnd(i + 71) * 6_000);
    out.push({
      month,
      revenue,
      cogs,
      opex,
      gross_profit: revenue - cogs,
      operating_income: revenue - cogs - opex,
    });
  }
  return out;
}

export const MONTHLY_PNL: MonthlyPnl[] = buildPnl();

// --- Tax filing (TurboTax) ---------------------------------------------

export type TaxFiling = {
  tax_year: number;
  filed_at: string;
  jurisdiction: "CRA-Federal";
  form: "T2 Corporate";
  revenue: number;
  taxable_income: number;
  tax_owed: number;
  status: "filed" | "draft";
};

export const TAX_FILING: TaxFiling = {
  tax_year: 2025,
  filed_at: "2026-03-12",
  jurisdiction: "CRA-Federal",
  form: "T2 Corporate",
  revenue: 612_400,
  taxable_income: 58_900,
  tax_owed: 7_657,
  status: "filed",
};

// --- Derived business-health metrics ------------------------------------

export type HealthMetrics = {
  ar_total: number;
  ar_by_bucket: Record<AgingBucket, number>;
  ap_total: number;
  ap_by_bucket: Record<AgingBucket, number>;
  cash: number;
  monthly_burn: number;
  runway_months: number;
  t12_revenue: number;
  gross_margin_pct: number;
  operating_margin_pct: number;
  dso: number;            // days sales outstanding
  dpo: number;            // days payable outstanding
  current_ratio: number;
  quick_ratio: number;
  debt_service_coverage: number;
};

function calcAging<T extends { bucket: AgingBucket }>(
  items: T[],
  field: keyof T
): Record<AgingBucket, number> {
  const acc: Record<AgingBucket, number> = {
    current: 0, "1_30": 0, "31_60": 0, "61_90": 0, "90_plus": 0,
  };
  for (const it of items) {
    const v = (it[field] as unknown as number) ?? 0;
    acc[it.bucket] += v;
  }
  return acc;
}

export function computeHealth(): HealthMetrics {
  const arBuckets = calcAging(CUSTOMERS, "outstanding");
  const apBuckets = calcAging(SUPPLIERS, "balance_owed");
  const ar = Object.values(arBuckets).reduce((a, b) => a + b, 0);
  const ap = Object.values(apBuckets).reduce((a, b) => a + b, 0);
  const t12_revenue = MONTHLY_PNL.reduce((a, m) => a + m.revenue, 0);
  const t12_cogs = MONTHLY_PNL.reduce((a, m) => a + m.cogs, 0);
  const t12_opex = MONTHLY_PNL.reduce((a, m) => a + m.opex, 0);
  const gross_margin_pct = (t12_revenue - t12_cogs) / t12_revenue;
  const operating_margin_pct =
    (t12_revenue - t12_cogs - t12_opex) / t12_revenue;
  const monthly_burn = Math.round(
    MONTHLY_PNL.slice(-3).reduce((a, m) => a + m.cogs + m.opex, 0) / 3
  );
  const cash = BALANCE_SHEET.current_assets.cash;
  const dso = Math.round((ar / t12_revenue) * 365);
  const dpo = Math.round((ap / t12_cogs) * 365);
  const currentAssets =
    BALANCE_SHEET.current_assets.cash +
    BALANCE_SHEET.current_assets.ar +
    BALANCE_SHEET.current_assets.inventory +
    BALANCE_SHEET.current_assets.other;
  const currentLiabilities =
    BALANCE_SHEET.current_liabilities.ap +
    BALANCE_SHEET.current_liabilities.hst_payable +
    BALANCE_SHEET.current_liabilities.line_of_credit +
    BALANCE_SHEET.current_liabilities.credit_card;
  const annualDebtService = (
    BALANCE_SHEET.long_term_liabilities.term_loan +
    BALANCE_SHEET.long_term_liabilities.equipment_loan
  ) * 0.18; // rough principal+interest annual
  return {
    ar_total: ar,
    ar_by_bucket: arBuckets,
    ap_total: ap,
    ap_by_bucket: apBuckets,
    cash,
    monthly_burn,
    runway_months: +(cash / monthly_burn).toFixed(1),
    t12_revenue,
    gross_margin_pct,
    operating_margin_pct,
    dso,
    dpo,
    current_ratio: +(currentAssets / currentLiabilities).toFixed(2),
    quick_ratio: +((currentAssets - BALANCE_SHEET.current_assets.inventory) / currentLiabilities).toFixed(2),
    debt_service_coverage: +(((t12_revenue - t12_cogs - t12_opex)) / annualDebtService).toFixed(2),
  };
}

export const HEALTH: HealthMetrics = computeHealth();

// --- Formatters ----------------------------------------------------------

export const formatMoney = (n: number, currency: string = "CAD") =>
  n.toLocaleString("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export const formatMoneyCents = (n: number, currency: string = "CAD") =>
  n.toLocaleString("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatPct = (n: number, digits = 1) =>
  `${(n * 100).toFixed(digits)}%`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

