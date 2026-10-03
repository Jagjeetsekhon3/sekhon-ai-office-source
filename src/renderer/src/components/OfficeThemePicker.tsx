import type { HarnessConfig } from '@/store/config';

/**
 * Sekhon AI Office uses one original product identity instead of TV-show themes.
 * Keeping this component preserves the Settings layout and gives us a safe place
 * to add more first-party office styles later without the old destructive
 * theme-switch flow.
 */
export function OfficeThemePicker({ config: _config }: { config: HarnessConfig }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--cth-font-display)', fontSize: 8, lineHeight: '12px',
        color: 'var(--cth-ink-500)', textTransform: 'uppercase', marginBottom: 10
      }}>
        Office Visual
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 10,
        background: 'var(--cth-paper-100)',
        boxShadow: 'inset 0 0 0 1.5px var(--cth-ink-500)'
      }}>
        <span style={{
          width: 34, height: 34, flexShrink: 0,
          background: '#15242b',
          boxShadow: 'inset 0 0 0 3px #61d6c5',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--cth-font-display)', fontSize: 8, color: '#f6fbfa'
        }}>
          SA
        </span>

        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 13, lineHeight: '18px', color: 'var(--cth-ink-900)' }}>
              Sekhon Office
            </span>
            <span style={{
              fontFamily: 'var(--cth-font-display)', fontSize: 7,
              color: 'var(--cth-mint)', textTransform: 'uppercase'
            }}>
              current
            </span>
          </span>
          <span style={{ fontSize: 11.5, lineHeight: '16px', color: 'var(--cth-ink-500)' }}>
            Custom Sekhon visual layer with teal technology accents, branded entrance and room highlights.
          </span>
        </span>
      </div>

      <div style={{
        marginTop: 8, fontSize: 11.5, lineHeight: '16px',
        color: 'var(--cth-ink-500)'
      }}>
        More original Sekhon office styles can be added later without removing agents or changing their work.
      </div>
    </div>
  );
}
