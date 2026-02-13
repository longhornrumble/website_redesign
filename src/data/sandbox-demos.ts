export interface SandboxDemo {
  slug: string;
  orgName: string;
  tenantHash: string;
}

export const sandboxDemos: SandboxDemo[] = [
  { slug: 'casa', orgName: 'CASA', tenantHash: 'my87674d777bf9' },
  { slug: 'seedling', orgName: 'Seedling', tenantHash: 'defd722730e4bf' },
];
