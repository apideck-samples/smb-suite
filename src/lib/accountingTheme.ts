// Minimal service-id registry used only to validate ?service= launch params.
// The full per-platform branding/theming that this file used to carry was
// dropped along with the Path A bank-feeds / chart-of-accounts mock views.
// Add new service ids here if launch links should be able to pre-select
// them in the picker.

export const ACCOUNTING_THEMES = {
  quickbooks: true,
  "quickbooks-desktop": true,
  "quickbooks-online": true,
  xero: true,
  sage: true,
  "sage-intacct": true,
  "sage-business-cloud-accounting": true,
  "business-central": true,
  "wave-accounting": true,
  wave: true,
  "zoho-books": true,
  "exact-online": true,
  moneybird: true,
  odoo: true,
  pennylane: true,
  "clear-books": true,
  kashflow: true,
  freshbooks: true,
  netsuite: true,
} as const;

export type AccountingService = keyof typeof ACCOUNTING_THEMES;
