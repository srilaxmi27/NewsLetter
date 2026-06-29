import { useState, useEffect } from 'react';
import api from '../../services/api';
import { MONTHS, SUBMISSION_TYPES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import { Plus, Eye, Check, X as XIcon, FileText } from 'lucide-react';

const PreviewModal = ({ submission, onClose, onSelect, isSelected }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-md max-h-[85vh] overflow-y-auto">
      <div className="flex items-start justify-between p-5 border-b border-ink-100">
        <div>
          <p className="text-2xs font-semibold text-primary-600 uppercase tracking-widest mb-1">
            {SUBMISSION_TYPES[submission.type]?.section || 'General'}
          </p>
          <h2 className="font-semibold text-ink-900">{submission.title}</h2>
        </div>
        <button onClick={onClose} className="text-ink-400 hover:text-ink-600 p-1"><XIcon size={18} /></button>
      </div>
      <div className="p-5 space-y-3">
        {submission.description && <p className="text-sm text-ink-700 leading-relaxed">{submission.description}</p>}
        {submission.metadata && Object.keys(submission.metadata).length > 0 && (
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-ink-50 border border-ink-100">
            {Object.entries(submission.metadata).map(([k, v]) => (
              <div key={k} className="text-sm">
                <span className="text-ink-400 capitalize">{k.replace(/_/g,' ')}: </span>
                <span className="text-ink-700 font-medium">{v}</span>
              </div>
            ))}
          </div>
        )}
        {submission.files?.length > 0 && (
          <div className="flex gap-2">
            {submission.files.map(f => (
              <a key={f.id} href={`http://localhost:5000${f.file_url}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary-600 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-lg hover:bg-primary-100">
                <FileText size={11} /> View file
              </a>
            ))}
          </div>
        )}
        <p className="text-2xs text-ink-400">By {submission.submitted_by} · {formatDate(submission.created_at)}</p>
      </div>
      <div className="p-5 pt-0">
        <button onClick={() => { onSelect(); onClose(); }} disabled={isSelected} className="btn-primary w-full">
          <Check size={14} /> {isSelected ? 'Already added' : 'Add to newsletter'}
        </button>
      </div>
    </div>
  </div>
);

const GenerationPage = () => {
  const [newsletters, setNewsletters] = useState([]);
  const [approved, setApproved]       = useState([]);
  const [selected, setSelected]       = useState(null);
  const [items, setItems]             = useState([]);
  const [creating, setCreating]       = useState(false);
  const [month, setMonth]             = useState('');
  const [year, setYear]               = useState(new Date().getFullYear());
  const [loading, setLoading]         = useState(true);
  const [preview, setPreview]         = useState(null);
  const [error, setError]             = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [nlRes, apRes] = await Promise.all([
      api.get('/newsletters'),
      api.get('/submissions/admin/approved'),
    ]);
    setNewsletters(nlRes.data.data || []);
    setApproved(apRes.data.data || []);
    setLoading(false);
  };

  const fetchItems = async (id) => {
    const r = await api.get(`/newsletters/${id}/items`);
    setItems(r.data.data || []);
  };

  const handleCreate = async () => {
    if (!month || !year) return;
    setError('');
    try {
      const r = await api.post('/newsletters', { month, year });
      const nl = r.data.data;
      setNewsletters(p => [nl, ...p]);
      setSelected(nl); fetchItems(nl.id); setCreating(false);
    } catch (err) { setError(err.response?.data?.error || 'Failed to create'); }
  };

  const handleSelect = async (sub) => {
    const section = SUBMISSION_TYPES[sub.type]?.section || 'General';
    await api.post(`/newsletters/${selected.id}/items`, { submissionId: sub.id, section, position: items.length + 1 });
    fetchItems(selected.id); fetchAll();
  };

  const handleDeselect = async (sub) => {
    await api.delete(`/newsletters/${selected.id}/items`, { data: { submissionId: sub.id } });
    fetchItems(selected.id); fetchAll();
  };

  const selectedIds = new Set(items.map(i => i.submission_id));

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Newsletter generation</h1>
          <p className="page-subtitle">Curate approved submissions into a newsletter</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus size={15} /> New newsletter
        </button>
      </div>

      {creating && (
        <div className="card mb-6 p-5">
          <h2 className="font-medium text-ink-800 text-sm mb-4">Create newsletter</h2>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <div className="flex gap-2.5 flex-wrap">
            <select className="select flex-1 min-w-36" value={month} onChange={e => setMonth(e.target.value)}>
              <option value="">Select month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="number" className="input w-24" placeholder="Year" value={year}
              onChange={e => setYear(e.target.value)} />
            <button onClick={handleCreate} className="btn-primary">Create</button>
            <button onClick={() => setCreating(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Newsletters list */}
        <div>
          <p className="text-2xs font-semibold text-ink-400 uppercase tracking-widest mb-3">Draft newsletters</p>
          {newsletters.filter(n => n.status === 'Draft').length === 0
            ? <p className="text-sm text-ink-400">No drafts. Create one above.</p>
            : newsletters.filter(n => n.status === 'Draft').map(n => (
              <button key={n.id}
                onClick={() => { setSelected(n); fetchItems(n.id); }}
                className={`w-full text-left card-sm mb-2 transition-all hover:shadow-sm
                  ${selected?.id === n.id ? 'border-primary-300 bg-primary-50' : ''}`}>
                <p className="font-medium text-ink-800 text-sm">{n.month} {n.year}</p>
                <p className="text-2xs text-ink-400 mt-0.5">{n.item_count || 0} items · Draft</p>
              </button>
            ))
          }
        </div>

        {/* Approved submissions */}
        <div>
          <p className="text-2xs font-semibold text-ink-400 uppercase tracking-widest mb-3">Approved submissions</p>
          {loading
            ? <div className="text-ink-400 text-sm animate-pulse">Loading…</div>
            : approved.length === 0
              ? <p className="text-sm text-ink-400">No approved submissions yet.</p>
              : <div className="space-y-1.5">
                {approved.map(s => (
                  <div key={s.id} className={`card-sm flex items-center gap-3 ${selectedIds.has(s.id) ? 'opacity-40' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate">{s.title}</p>
                      <p className="text-2xs text-ink-400">{s.type}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setPreview(s)}
                        className="p-1.5 rounded-lg border border-ink-200 hover:border-primary-300 text-ink-400 hover:text-primary-600 transition-all">
                        <Eye size={13} />
                      </button>
                      {selectedIds.has(s.id)
                        ? <button onClick={() => handleDeselect(s)} disabled={!selected}
                            className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-400 hover:bg-red-100">
                            <XIcon size={13} />
                          </button>
                        : <button onClick={() => selected && handleSelect(s)} disabled={!selected}
                            className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 disabled:opacity-30">
                            <Check size={13} />
                          </button>
                      }
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Newsletter contents */}
        <div>
          <p className="text-2xs font-semibold text-ink-400 uppercase tracking-widest mb-3">
            Contents {selected ? `(${items.length})` : ''}
          </p>
          {!selected
            ? <p className="text-sm text-ink-400">Select a newsletter first</p>
            : items.length === 0
              ? <p className="text-sm text-ink-400">No items yet. Add from the approved list.</p>
              : <div className="space-y-1.5">
                {items.map((item, idx) => (
                  <div key={item.id} className="card-sm flex items-center gap-3">
                    <span className="text-ink-300 text-xs font-mono w-5 flex-shrink-0">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate">{item.title}</p>
                      <p className="text-2xs text-ink-400">{item.section}</p>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {preview && (
        <PreviewModal submission={preview} onClose={() => setPreview(null)}
          onSelect={() => selected && handleSelect(preview)}
          isSelected={selectedIds.has(preview.id)} />
      )}
    </div>
  );
};

export default GenerationPage;
