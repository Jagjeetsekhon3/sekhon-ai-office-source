/**
 * Settings → General identity card for Sekhon AI Office.
 *
 * Sekhon AI Office is intentionally free/local-first during development.
 * This surface contains no paid plan, upgrade, sponsor, or external purchase CTA.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelButton } from './PixelButton';
import { Icon } from './Icon';
import { manualDownloadUrl, pendingVersion, reduceStatus, type UpdateStatus } from '@shared/updateState';

const GITHUB_REPO_URL = 'https://github.com/Jagjeetsekhon3/sekhon-ai-office-source';

export function SettingsHeroCard() {
  const { t } = useTranslation();
  const [version, setVersion] = useState<string | null>(null);
  const [status, setStatus] = useState<UpdateStatus | null>(null);

  useEffect(() => {
    const off = window.cth.onUpdateStatus?.((next) => setStatus((prev) => reduceStatus(prev, next)));
    void window.cth.updateCurrent?.().then((cur) => {
      if (cur) setStatus((prev) => reduceStatus(prev, cur));
    }).catch(() => { /* push channel still works */ });
    return off;
  }, []);

  const pending = version ? pendingVersion(status, version) : null;
  const downloadManually = () => {
    if (!status) return;
    const url = manualDownloadUrl(status, window.cth.platform, window.cth.arch);
    if (url) void window.cth.updateOpenRelease(url);
  };

  useEffect(() => {
    let alive = true;
    window.cth.appInfo()
      .then((i) => { if (alive) setVersion(i.version); })
      .catch(() => { /* version is optional */ });
    return () => { alive = false; };
  }, []);

  const showReleaseNotes = () => {
    window.dispatchEvent(new CustomEvent('cth:show-release-notes'));
  };

  const INK = 'var(--cth-ink-900)';
  const MONO = 'var(--cth-font-mono, monospace)';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--cth-paper-100)',
      border: `2px solid ${INK}`
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--cth-font-display)', fontSize: 13, lineHeight: '20px', color: INK
            }}>SEKHON AI OFFICE</span>
            {version && (
              <span style={{
                fontFamily: MONO, fontSize: 15, fontWeight: 700, color: INK
              }}>v{version}</span>
            )}
            <span style={{
              fontFamily: MONO, fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase',
              padding: '2px 7px', background: 'var(--cth-mint-light)',
              boxShadow: 'inset 0 0 0 1px var(--cth-mint)', color: INK
            }}>FREE · LOCAL</span>
            {pending && (
              <>
                <span style={{ flex: 1 }} />
                <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--cth-ink-700)' }}>
                  v{pending} is out
                </span>
                <PixelButton
                  variant="primary"
                  size="sm"
                  onClick={downloadManually}
                  title="Download the latest Sekhon AI Office build."
                >
                  download v{pending}
                </PixelButton>
              </>
            )}
          </div>

          <div style={{
            marginTop: 6, fontSize: 12.5, lineHeight: 1.5,
            color: 'var(--cth-ink-700)', maxWidth: '68ch'
          }}>
            Run agents on your own machine using your own API keys,
            and local models. Sekhon AI Office has no paid app plan, seat fee, or
            feature paywall.
          </div>
        </div>

        <div style={{
          padding: '10px 12px',
          background: 'var(--cth-mint-light)',
          border: `2px solid ${INK}`,
          fontSize: 12.5,
          lineHeight: 1.5,
          color: INK
        }}>
          <b>Your AI usage is separate.</b>{' '}
          Providers such as OpenAI, Anthropic, Gemini, OpenRouter and Groq may charge
          for their own API usage. Local models such as Ollama can
          run without a cloud API bill.
        </div>

        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
          paddingTop: 12, borderTop: `2px solid ${INK}`
        }}>
          <PixelButton variant="secondary" size="sm" onClick={showReleaseNotes}>
            <span
              title={t('settingsHero.whatsNewTitle')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <Icon name="sparkle" /> {t('settingsHero.whatsNew')}
            </span>
          </PixelButton>

          <PixelButton
            variant="secondary"
            size="sm"
            onClick={() => void window.cth.openExternal(GITHUB_REPO_URL)}
          >
            GitHub
          </PixelButton>

          <PixelButton
            variant="ghost"
            size="sm"
            onClick={() => void window.cth.openExternal(`${GITHUB_REPO_URL}/issues/new`)}
          >
            {t('settingsHero.reportProblem')}
          </PixelButton>

          <span style={{ flex: 1 }} />

          <a
            href={`${GITHUB_REPO_URL}/blob/main/CHANGELOG.md`}
            onClick={(e) => {
              e.preventDefault();
              void window.cth.openExternal(`${GITHUB_REPO_URL}/blob/main/CHANGELOG.md`);
            }}
            style={{ fontSize: 12, color: 'var(--cth-ink-500)' }}
          >
            {t('settingsHero.fullChangelog')}
          </a>
        </div>
      </div>
    </div>
  );
}
