export type BusinessWorkspace = 'studio' | 'agency';
export const BUSINESS_WORKSPACE_KEY = 'sekhon.businessWorkspace';
export const BUSINESS_WORKSPACES: readonly { id: BusinessWorkspace; label: string }[] = [
  { id: 'studio', label: '3D STUDIO' }, { id: 'agency', label: 'AGENCY' },
];
export function resolveBusinessWorkspace(saved: string | null | undefined): BusinessWorkspace {
  return saved === 'agency' ? 'agency' : 'studio';
}
