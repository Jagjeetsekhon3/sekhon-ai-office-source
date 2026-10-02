import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { PixelPanel } from './PixelPanel';
import { PixelButton } from './PixelButton';

type Status = 'new' | 'reviewing' | 'proposal' | 'applied' | 'won' | 'lost';
type Lead = {
  id: number;
  title: string;
  client: string | null;
  source: string | null;
  sourceUrl: string | null;
  budget: string | null;
  deadline: string | null;
  fit: string | null;
  notes: string | null;
  status: Status;
  createdAt: number;
  updatedAt: number;
};

const COLS: Array<{ key: Status; label: string }> = [
  { key: 'new', label: 'NEW' },
  { key: 'reviewing', label: 'REVIEWING' },
  { key: 'proposal', label: 'PROPOSAL READY' },
  { key: 'applied', label: 'APPLIED' },
  { key: 'won', label: 'WON' },
  { key: 'lost', label: 'LOST' }
];

const inputStyle: CSSProperties = {
  width: '100%', minWidth: 0, border: 'none', outline: 'none',
  padding: '7px 8px', background: 'var(--cth-paper-100)',
  color: 'var(--cth-ink-900)', boxShadow: 'inset 0 0 0 1px var(--cth-ink-300)',
  fontFamily: 'var(--cth-font-ui)', fontSize: 12
};

export function LeadsBoardModal({ onClose }: { onClose: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({
    title: '', client: '', source: '', sourceUrl: '', budget: '', deadline: '', fit: '', notes: ''
  });

  const refresh = useCallback(async () => {
    try { setLeads(await window.cth.leadsList()); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const grouped = useMemo(() => Object.fromEntries(
    COLS.map((c) => [c.key, leads.filter((l) => l.status === c.key)])
  ) as Record<Status, Lead[]>, [leads]);

  const addLead = async () => {
    if (!draft.title.trim()) { setError('Project title is required.'); return; }
    const r = await window.cth.leadsAdd(draft);
    if (!r.ok) { setError(r.error ?? 'Could not save lead.'); return; }
    setDraft({ title: '', client: '', source: '', sourceUrl: '', budget: '', deadline: '', fit: '', notes: '' });
    setAdding(false);
    await refresh();
  };

  const move = async (lead: Lead, status: Status) => {
    setLeads((all) => all.map((x) => x.id === lead.id ? { ...x, status } : x));
    const r = await window.cth.leadsUpdate(lead.id, { status });
    if (!r.ok) { setError(r.error ?? 'Could not update lead.'); await refresh(); }
  };

  const remove = async (id: number) => {
    setLeads((all) => all.filter((x) => x.id !== id));
    const r = await window.cth.leadsDelete(id);
    if (!r.ok) { setError(r.error ?? 'Could not delete lead.'); await refresh(); }
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 310, padding: 18,
      background: 'rgba(16, 20, 24, .72)', display: 'flex'
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex' }}>
        <PixelPanel variant="dialog" title="AGENCY · BUSINESS LEADS" noPadding style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: 9, display: 'flex', alignItems: 'center', gap: 8,
            borderBottom: '1px solid var(--cth-ink-300)'
          }}>
            <div style={{ flex: 1, fontSize: 12, color: 'var(--cth-ink-500)' }}>
              Find work → evaluate → prepare pitch → apply with your approval → win → produce.
            </div>
            <PixelButton variant="secondary" size="sm" onClick={() => setAdding((v) => !v)}>
              {adding ? 'Cancel' : '+ Add lead'}
            </PixelButton>
            <PixelButton variant="secondary" size="sm" onClick={onClose}>Close</PixelButton>
          </div>

          {adding && (
            <div style={{
              padding: 10, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 7,
              background: 'var(--cth-cream-200)', borderBottom: '1px solid var(--cth-ink-300)'
            }}>
              <input style={inputStyle} placeholder="Project title *" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
              <input style={inputStyle} placeholder="Client" value={draft.client} onChange={(e) => setDraft({ ...draft, client: e.target.value })} />
              <input style={inputStyle} placeholder="Source" value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} />
              <input style={inputStyle} placeholder="Budget" value={draft.budget} onChange={(e) => setDraft({ ...draft, budget: e.target.value })} />
              <input style={inputStyle} placeholder="Source URL" value={draft.sourceUrl} onChange={(e) => setDraft({ ...draft, sourceUrl: e.target.value })} />
              <input style={inputStyle} placeholder="Deadline" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
              <input style={inputStyle} placeholder="Why it fits" value={draft.fit} onChange={(e) => setDraft({ ...draft, fit: e.target.value })} />
              <input style={inputStyle} placeholder="Notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                <PixelButton variant="primary" size="sm" onClick={() => void addLead()}>Save lead</PixelButton>
              </div>
            </div>
          )}

          {error && <div style={{ padding: '6px 10px', fontSize: 11, color: 'var(--cth-coral)' }}>{error}</div>}

          <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', display: 'flex', gap: 7, padding: 9 }}>
            {COLS.map((col) => (
              <div key={col.key} style={{
                flex: '1 0 185px', minWidth: 185, maxWidth: 260, minHeight: 0,
                display: 'flex', flexDirection: 'column',
                background: 'var(--cth-cream-100)', boxShadow: 'inset 0 0 0 1px var(--cth-ink-300)'
              }}>
                <div style={{
                  padding: '6px 7px 5px', fontFamily: 'var(--cth-font-display)', fontSize: 8,
                  borderBottom: '1px solid var(--cth-ink-300)', display: 'flex'
                }}>
                  {col.label}<span style={{ marginLeft: 'auto' }}>{grouped[col.key].length}</span>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {grouped[col.key].map((lead) => (
                    <div key={lead.id} style={{
                      padding: 7, background: 'var(--cth-paper-100)',
                      boxShadow: 'inset 0 0 0 1px var(--cth-ink-100)',
                      display: 'flex', flexDirection: 'column', gap: 5
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cth-ink-900)', lineHeight: '16px' }}>{lead.title}</div>
                      {lead.client && <div style={{ fontSize: 11, color: 'var(--cth-ink-700)' }}>{lead.client}</div>}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', fontSize: 10, color: 'var(--cth-ink-500)' }}>
                        {lead.source && <span>{lead.source}</span>}
                        {lead.budget && <span>· {lead.budget}</span>}
                        {lead.deadline && <span>· {lead.deadline}</span>}
                      </div>
                      {lead.fit && <div style={{ fontSize: 10, lineHeight: '14px', color: 'var(--cth-ink-500)' }}>{lead.fit}</div>}
                      <select
                        value={lead.status}
                        onChange={(e) => void move(lead, e.target.value as Status)}
                        style={{ ...inputStyle, padding: '4px 5px', fontSize: 10 }}
                      >
                        {COLS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                      </select>
                      <button onClick={() => void remove(lead.id)} style={{
                        alignSelf: 'flex-end', border: 'none', background: 'transparent', cursor: 'pointer',
                        color: 'var(--cth-ink-500)', fontSize: 10
                      }}>remove</button>
                    </div>
                  ))}
                  {grouped[col.key].length === 0 && <div style={{ padding: 8, textAlign: 'center', color: 'var(--cth-ink-300)' }}>—</div>}
                </div>
              </div>
            ))}
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
