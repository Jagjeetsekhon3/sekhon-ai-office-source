import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/store';
import { BUSINESS_WORKSPACES } from '@shared/businessWorkspace';

/** Uses the same selection as the office header, including when opened in fullscreen. */
export function BusinessWorkspacePicker() {
  const { t } = useTranslation();
  const workspace = useStore(s => s.businessWorkspace);
  const choose = useStore(s => s.setBusinessWorkspace);
  return (
    <div role="group" aria-label={t('businessWorkspace.title')} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--cth-ink-700)' }}>{t('businessWorkspace.title')}</span>
      {BUSINESS_WORKSPACES.map(item => (
        <button key={item.id} type="button" aria-pressed={workspace === item.id}
          onClick={() => choose(item.id)} style={{
            border: 'none', cursor: 'pointer', padding: '6px 10px', fontFamily: 'var(--cth-font-ui)', fontSize: 12,
            color: 'var(--cth-ink-900)', background: workspace === item.id ? 'var(--cth-mint-light)' : 'var(--cth-paper-100)',
            boxShadow: workspace === item.id ? 'inset 0 0 0 1.5px var(--cth-mint)' : 'inset 0 0 0 1px var(--cth-ink-100)',
          }}>{item.label}</button>
      ))}
      <span style={{ fontSize: 12, color: 'var(--cth-ink-700)' }}>{t('businessWorkspace.hint')}</span>
    </div>
  );
}
