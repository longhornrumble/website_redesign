export interface SandboxDemo {
  slug: string;
  orgName: string;
  tenantId: string; // tenant_hash used in data-tenant attribute
}

export const sandboxDemos: SandboxDemo[] = [
  { slug: 'casa', orgName: 'CASA', tenantId: 'my87674d777bf9' },
  // Add new demos here:
  // { slug: 'acme', orgName: 'ACME Corp', tenantId: 'acXXXXXXXXXXXX' },
];
