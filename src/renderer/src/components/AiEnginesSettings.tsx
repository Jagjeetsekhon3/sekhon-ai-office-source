import { useState, useEffect, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import type { HarnessConfig, AgentProvider } from '@/store/config';
import { PixelButton } from './PixelButton';
import { ProviderLogo } from './ProviderLogo';
import { localSlugFor } from '@shared/ossModels';
import { useStore } from '@/store/store';

/**
 * AiEnginesSettings — the v0.3.1 per-provider config surface for the BYOK CLI
 * engines (OpenCode · Crush · pi.dev · Qwen). Two stores by what the datum is:
 *  - API keys → WRITE-ONLY in the secret broker (`providerKey:*` IPC). Keyed by the
 *    BACKEND model-provider (anthropic/openai/…). The field shows only set/not-set;
 *    the plaintext is never read back to the renderer (materialized MAIN-only at spawn).
 *  - Local base-URL + default model → HarnessConfig (`providerBaseUrls` /
 *    `providerDefaultModels`), keyed by CLI provider. Non-secret; normal config save.
 * See hive/shared/cli-agents/settings-ui-schema.md.
 */

/** Backend model-providers whose keys the CLIs read from standard env vars. Must
 *  match BACKEND_KEY_ENV in src/main/index.ts. */
const BACKENDS: Array<{ id: string; label: string; envVar: string }> = [
  { id: 'anthropic', label: 'Anthropic', envVar: 'ANTHROPIC_API_KEY' },
  { id: 'openai', label: 'OpenAI', envVar: 'OPENAI_API_KEY' },
  { id: 'google', label: 'Google · Gemini', envVar: 'GEMINI_API_KEY' },
  { id: 'openrouter', label: 'OpenRouter', envVar: 'OPENROUTER_API_KEY' },
  { id: 'groq', label: 'Groq', envVar: 'GROQ_API_KEY' }
];

/** CLI engines that take a per-provider local base-URL + default model. `hint`
 *  values are technical endpoint descriptions — kept English (technical data). */
const CLIS: Array<{ id: AgentProvider; label: string; hint: string }> = [
  { id: 'sekhon-local', label: 'Sekhon Local', hint: 'Built-in direct local agent · Ollama / LM Studio / vLLM' },
  { id: 'opencode', label: 'OpenCode', hint: 'http://localhost:11434/v1 (Ollama) — injected as a local provider' },
  { id: 'crush', label: 'Crush', hint: 'OpenAI-compatible endpoint — used as the proxy upstream' },
  { id: 'pi', label: 'Pi', hint: 'local models are file-based (models.json); base-URL reserved' },
  { id: 'qwen', label: 'Qwen', hint: 'OpenAI-compatible endpoint — used as the proxy upstream' }
];

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '6px 8px 4px',
  background: 'var(--cth-paper-100)',
  border: 'none',
  boxShadow: 'inset 0 0 0 1px var(--cth-ink-100)',
  fontFamily: 'var(--cth-font-ui)',
  fontSize: 13,
  color: 'var(--cth-ink-900)',
  outline: 'none'
};
const labelStyle: CSSProperties = {
  fontFamily: 'var(--cth-font-display)',
  fontSize: 8,
  lineHeight: '12px',
  color: 'var(--cth-ink-700)',
  textTransform: 'uppercase'
};
const headStyle: CSSProperties = {
  fontFamily: 'var(--cth-font-display)', fontSize: 8, lineHeight: '12px',
  color: 'var(--cth-ink-500)', textTransform: 'uppercase', marginBottom: 2
};

export function AiEnginesSettings({ config }: { config: HarnessConfig }) {
  const { t } = useTranslation();
  // Keep the global "OpenAI key present" signal (boolean only) live so the Talk
  // button's missing-key warning clears the instant the user saves their OpenAI key
  // here — without it the gate only refreshes on next app start. apikey:openai is
  // the same key the Realtime mint reads; saving/clearing it flips the gate.
  const setHasOpenAiKey = useStore((s) => s.setHasOpenAiKey);
  // Which backends already have a key stored (boolean only — never the value).
  const [hasKey, setHasKey] = useState<Record<string, boolean>>({});
  const [draftKey, setDraftKey] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  // Base-URL + default-model drafts, seeded from config.
  const [baseUrls, setBaseUrls] = useState<Partial<Record<AgentProvider, string>>>(
    config.providerBaseUrls ?? {}
  );
  const [models, setModels] = useState<Partial<Record<AgentProvider, string>>>(
    config.providerDefaultModels ?? {}
  );

  // First-class Ollama manager. Model operations stay in main and are restricted
  // to loopback; the renderer receives names/metadata only.
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModels, setOllamaModels] = useState<Array<{ name: string; size?: number; modifiedAt?: string }>>([]);
  const [ollamaModel, setOllamaModel] = useState('');
  const [ollamaNote, setOllamaNote] = useState('');
  const [ollamaBusy, setOllamaBusy] = useState(false);
  const [localEngine, setLocalEngine] = useState<AgentProvider>('opencode');

  // LM Studio / vLLM / llama.cpp / LocalAI: OpenAI-compatible local servers.
  const [compatUrl, setCompatUrl] = useState('http://localhost:1234/v1');
  const [compatModels, setCompatModels] = useState<Array<{ id: string; ownedBy?: string }>>([]);
  const [compatNote, setCompatNote] = useState('');
  const [compatBusy, setCompatBusy] = useState(false);

  // Reseed set/not-set flags on mount (write-only — only the boolean is fetched).
  useEffect(() => {
    let alive = true;
    (async () => {
      const out: Record<string, boolean> = {};
      for (const b of BACKENDS) {
        try { out[b.id] = await window.cth.providerKeyHas(b.id); } catch { out[b.id] = false; }
      }
      if (alive) setHasKey(out);
    })();
    return () => { alive = false; };
  }, []);

  const saveKey = async (backend: string) => {
    const key = (draftKey[backend] ?? '').trim();
    if (!key) return;
    try {
      const r = await window.cth.providerKeySet({ backend, key });
      if (r.ok) {
        setHasKey((s) => ({ ...s, [backend]: true }));
        setDraftKey((s) => ({ ...s, [backend]: '' }));
        setNote((s) => ({ ...s, [backend]: t('aiEngines.saved') }));
        // OpenAI key gates Talk — mirror presence to the store so the warning clears now.
        if (backend === 'openai') setHasOpenAiKey(true);
      } else setNote((s) => ({ ...s, [backend]: r.error ?? t('aiEngines.failed') }));
    } catch (e) { setNote((s) => ({ ...s, [backend]: e instanceof Error ? e.message : String(e) })); }
  };
  const clearKey = async (backend: string) => {
    try {
      await window.cth.providerKeyClear(backend);
      setHasKey((s) => ({ ...s, [backend]: false }));
      setNote((s) => ({ ...s, [backend]: t('aiEngines.cleared') }));
      // OpenAI key gates Talk — clearing it disables Talk; reflect that immediately.
      if (backend === 'openai') setHasOpenAiKey(false);
    } catch { /* noop */ }
  };

  const saveBaseUrl = async (id: AgentProvider, value: string) => {
    const next = { ...baseUrls, [id]: value.trim() || undefined };
    setBaseUrls(next);
    try { await window.cth.updateConfig({ providerBaseUrls: next }); } catch { /* noop */ }
  };
  const saveModel = async (id: AgentProvider, value: string) => {
    const next = { ...models, [id]: value.trim() || undefined };
    setModels(next);
    try { await window.cth.updateConfig({ providerDefaultModels: next }); } catch { /* noop */ }
  };

  const refreshOllama = async () => {
    setOllamaBusy(true);
    setOllamaNote('Checking Ollama…');
    try {
      const r = await window.cth.localOllamaList(ollamaUrl);
      if (r.ok) {
        setOllamaModels(r.models ?? []);
        setOllamaNote(`Connected · ${r.models?.length ?? 0} model${(r.models?.length ?? 0) === 1 ? '' : 's'} installed`);
      } else {
        setOllamaModels([]);
        setOllamaNote(r.error ?? 'Could not connect to Ollama');
      }
    } catch (e) {
      setOllamaModels([]);
      setOllamaNote(e instanceof Error ? e.message : String(e));
    } finally {
      setOllamaBusy(false);
    }
  };

  const pullOllama = async () => {
    const model = ollamaModel.trim();
    if (!model) { setOllamaNote('Enter an Ollama model name first.'); return; }
    setOllamaBusy(true);
    setOllamaNote(`Downloading ${model}… this can take a while.`);
    try {
      const r = await window.cth.localOllamaPull({ baseUrl: ollamaUrl, model });
      if (!r.ok) { setOllamaNote(r.error ?? 'Download failed'); return; }
      setOllamaModel('');
      setOllamaNote(`${model} installed.`);
      const listed = await window.cth.localOllamaList(ollamaUrl);
      if (listed.ok) setOllamaModels(listed.models ?? []);
    } catch (e) {
      setOllamaNote(e instanceof Error ? e.message : String(e));
    } finally {
      setOllamaBusy(false);
    }
  };

  const localModelSlug = (engine: AgentProvider, model: string) => {
    if (engine === 'sekhon-local') return model;
    if (engine === 'opencode') return `local/${model}`;
    if (engine === 'crush') return `openai/${model}`;
    return localSlugFor(engine, model);
  };

  const useLocalModel = async (model: string, baseUrl: string, source: string) => {
    if (!['sekhon-local', 'opencode', 'crush'].includes(localEngine)) return;
    const normalized = baseUrl.trim().replace(/\/$/, '');
    const slug = localModelSlug(localEngine, model);
    const nextUrls = { ...baseUrls, [localEngine]: normalized };
    const nextModels = { ...models, [localEngine]: slug };
    setBaseUrls(nextUrls);
    setModels(nextModels);
    await window.cth.updateConfig({ providerBaseUrls: nextUrls, providerDefaultModels: nextModels });
    const msg = `${model} from ${source} is now the default for ${localEngine}.`;
    if (source === 'Ollama') setOllamaNote(msg); else setCompatNote(msg);
  };

  const useOllamaModel = async (model: string) => {
    const base = ollamaUrl.trim().replace(/\/$/, '').replace(/\/v1$/, '') + '/v1';
    await useLocalModel(model, base, 'Ollama');
  };

  const deleteOllamaModel = async (model: string) => {
    setOllamaBusy(true);
    setOllamaNote(`Deleting ${model}…`);
    try {
      const r = await window.cth.localOllamaDelete({ baseUrl: ollamaUrl, model });
      if (!r.ok) { setOllamaNote(r.error ?? 'Delete failed'); return; }
      setOllamaNote(`${model} deleted.`);
      const listed = await window.cth.localOllamaList(ollamaUrl);
      if (listed.ok) setOllamaModels(listed.models ?? []);
    } catch (e) {
      setOllamaNote(e instanceof Error ? e.message : String(e));
    } finally {
      setOllamaBusy(false);
    }
  };

  const refreshCompat = async (url = compatUrl) => {
    setCompatBusy(true);
    setCompatNote('Checking local OpenAI-compatible server…');
    try {
      const r = await window.cth.localOpenAiList(url);
      if (r.ok) {
        if (r.baseUrl) setCompatUrl(r.baseUrl);
        setCompatModels(r.models ?? []);
        setCompatNote(`Connected · ${r.models?.length ?? 0} model${(r.models?.length ?? 0) === 1 ? '' : 's'} available`);
      } else {
        setCompatModels([]);
        setCompatNote(r.error ?? 'Could not connect');
      }
    } catch (e) {
      setCompatModels([]);
      setCompatNote(e instanceof Error ? e.message : String(e));
    } finally {
      setCompatBusy(false);
    }
  };


  const formatBytes = (n?: number) => {
    if (!n || n < 1) return '';
    const gb = n / (1024 ** 3);
    return gb >= 1 ? `${gb.toFixed(gb >= 10 ? 0 : 1)} GB` : `${Math.round(n / (1024 ** 2))} MB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={headStyle}>{t('aiEngines.providers')}</div>
        <div style={{ fontSize: 12, color: 'var(--cth-ink-700)', lineHeight: '18px' }}>
          {t('aiEngines.providersDesc')}
        </div>
      </div>

      {/* Backend API keys (write-only) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={headStyle}>{t('aiEngines.apiKeys')}</div>
        {BACKENDS.map((b) => (
          <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={labelStyle}>
              {b.label} {hasKey[b.id] ? `· ${t('aiEngines.setCheck')}` : ''} <span style={{ opacity: 0.6 }}>({b.envVar})</span>
            </label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="password"
                autoComplete="off"
                placeholder={hasKey[b.id] ? t('aiEngines.keyStoredPlaceholder') : t('aiEngines.keyPlaceholder', { label: b.label })}
                value={draftKey[b.id] ?? ''}
                onChange={(e) => setDraftKey((s) => ({ ...s, [b.id]: e.target.value }))}
                style={inputStyle}
              />
              <PixelButton variant="secondary" size="sm" onClick={() => saveKey(b.id)}>{t('common.save')}</PixelButton>
              {hasKey[b.id] && (
                <PixelButton variant="secondary" size="sm" onClick={() => clearKey(b.id)}>{t('common.delete')}</PixelButton>
              )}
            </div>
            {note[b.id] && <div style={{ fontSize: 11, color: 'var(--cth-ink-500)' }}>{note[b.id]}</div>}
          </div>
        ))}
      </div>

      {/* Per-CLI local endpoint + default model */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={headStyle}>{t('aiEngines.localEndpoint')}</div>
        {CLIS.map((c) => (
          <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ProviderLogo provider={c.id} size={12} /> {c.label}
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                placeholder={`base-URL — ${c.hint}`}
                value={baseUrls[c.id] ?? ''}
                onChange={(e) => setBaseUrls((s) => ({ ...s, [c.id]: e.target.value }))}
                onBlur={(e) => saveBaseUrl(c.id, e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder={t('aiEngines.defaultModelPlaceholder')}
                value={models[c.id] ?? ''}
                onChange={(e) => setModels((s) => ({ ...s, [c.id]: e.target.value }))}
                onBlur={(e) => saveModel(c.id, e.target.value)}
                style={{ ...inputStyle, maxWidth: 220 }}
              />
            </div>
          </div>
        ))}
        <div style={{
          marginTop: 4, padding: 10, display: 'flex', flexDirection: 'column', gap: 9,
          background: 'var(--cth-paper-100)', boxShadow: 'inset 0 0 0 1px var(--cth-ink-300)'
        }}>
          <div>
            <div style={headStyle}>Local AI · Ollama</div>
            <div style={{ fontSize: 12, color: 'var(--cth-ink-700)', lineHeight: '17px' }}>
              Connect to Ollama running on this computer, see installed models, download another model, and assign it as an agent-engine default.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://localhost:11434"
              style={inputStyle}
            />
            <PixelButton variant="secondary" size="sm" onClick={refreshOllama} disabled={ollamaBusy}>
              {ollamaBusy ? 'Working…' : 'Connect / Refresh'}
            </PixelButton>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={labelStyle}>Use local models with</span>
            {(['sekhon-local', 'opencode', 'crush'] as AgentProvider[]).map((id) => (
              <button
                key={id}
                onClick={() => setLocalEngine(id)}
                style={{
                  padding: '3px 8px 1px', border: 'none', cursor: 'pointer',
                  background: localEngine === id ? 'var(--cth-mint-light)' : 'var(--cth-cream-100)',
                  boxShadow: localEngine === id
                    ? 'inset 0 0 0 1.5px var(--cth-ink-500)'
                    : 'inset 0 0 0 1px var(--cth-ink-100)',
                  fontFamily: 'var(--cth-font-ui)', fontSize: 12, color: 'var(--cth-ink-900)'
                }}
              >
                {CLIS.find((x) => x.id === id)?.label ?? id}
              </button>
            ))}
          </div>

          {ollamaModels.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {ollamaModels.map((m) => (
                <div key={m.name} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '5px 7px',
                  background: 'var(--cth-cream-100)', boxShadow: 'inset 0 0 0 1px var(--cth-ink-100)'
                }}>
                  <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--cth-font-mono)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.name}
                  </span>
                  {m.size ? <span style={{ fontSize: 11, color: 'var(--cth-ink-500)' }}>{formatBytes(m.size)}</span> : null}
                  <PixelButton variant="secondary" size="sm" onClick={() => void useOllamaModel(m.name)}>
                    Use
                  </PixelButton>
                  <PixelButton variant="secondary" size="sm" onClick={() => void deleteOllamaModel(m.name)} disabled={ollamaBusy}>
                    Delete
                  </PixelButton>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder="Add model, e.g. qwen3:8b"
              style={inputStyle}
            />
            <PixelButton variant="secondary" size="sm" onClick={pullOllama} disabled={ollamaBusy || !ollamaModel.trim()}>
              Download
            </PixelButton>
          </div>
          {ollamaNote && <div style={{ fontSize: 11, color: 'var(--cth-ink-500)' }}>{ollamaNote}</div>}
        </div>

        <div style={{
          padding: 10, display: 'flex', flexDirection: 'column', gap: 9,
          background: 'var(--cth-paper-100)', boxShadow: 'inset 0 0 0 1px var(--cth-ink-300)'
        }}>
          <div>
            <div style={headStyle}>Local AI · LM Studio / vLLM / OpenAI-compatible</div>
            <div style={{ fontSize: 12, color: 'var(--cth-ink-700)', lineHeight: '17px' }}>
              Connect to a local server that exposes the OpenAI-compatible /v1/models API. Common defaults: LM Studio on port 1234 and vLLM on port 8000.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <PixelButton variant="secondary" size="sm" onClick={() => { setCompatUrl('http://localhost:1234/v1'); void refreshCompat('http://localhost:1234/v1'); }} disabled={compatBusy}>
              Detect LM Studio
            </PixelButton>
            <PixelButton variant="secondary" size="sm" onClick={() => { setCompatUrl('http://localhost:8000/v1'); void refreshCompat('http://localhost:8000/v1'); }} disabled={compatBusy}>
              Detect vLLM
            </PixelButton>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={compatUrl}
              onChange={(e) => setCompatUrl(e.target.value)}
              placeholder="http://localhost:1234/v1"
              style={inputStyle}
            />
            <PixelButton variant="secondary" size="sm" onClick={() => void refreshCompat()} disabled={compatBusy}>
              {compatBusy ? 'Checking…' : 'Connect / Refresh'}
            </PixelButton>
          </div>

          {compatModels.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {compatModels.map((m) => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '5px 7px',
                  background: 'var(--cth-cream-100)', boxShadow: 'inset 0 0 0 1px var(--cth-ink-100)'
                }}>
                  <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--cth-font-mono)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.id}
                  </span>
                  {m.ownedBy && <span style={{ fontSize: 10, color: 'var(--cth-ink-500)' }}>{m.ownedBy}</span>}
                  <PixelButton variant="secondary" size="sm" onClick={() => void useLocalModel(m.id, compatUrl, 'local server')}>
                    Use
                  </PixelButton>
                </div>
              ))}
            </div>
          )}
          {compatNote && <div style={{ fontSize: 11, color: 'var(--cth-ink-500)' }}>{compatNote}</div>}
        </div>
      </div>

      {/* Unsandboxed-in-auto caveat (Pam guardrail #6) */}
      <div style={{
        fontSize: 12, color: 'var(--cth-ink-700)', lineHeight: '17px',
        padding: 8, boxShadow: 'inset 0 0 0 1px var(--cth-ink-300)', background: 'var(--cth-paper-100)'
      }}>
        {t('aiEngines.autoModeCaveat')}
      </div>
    </div>
  );
}
