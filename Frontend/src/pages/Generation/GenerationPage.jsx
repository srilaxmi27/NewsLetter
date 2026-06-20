import { useState, useEffect } from 'react';
import api from '../../services/api';
import { MONTHS, SUBMISSION_TYPES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import { Plus, Eye, Check, X as XIcon, FileText, ChevronDown } from 'lucide-react';

const ReviewPreviewModal = ({ submission, onClose, onSelect, onReject, isSelected }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Newsletter Preview</h2>
        <button onClick={onClose} className="text-white/30 hover:text-white"><XIcon size={20} /></button>
      </div>

      {/* Structured preview — exactly as it will appear in the PDF */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">
            {SUBMISSION_TYPES[submission.type]?.section || 'General'}
          </p>
          <h3 className="text-lg font-bold text-white">{submission.title}</h3>
        </div>

        {submission.description && (
          <p className="text-sm text-white/70">{submission.description}</p>
        )}

        {submission.metadata && Object.keys(submission.metadata).length > 0 && (
          <div className="space-y-1 pt-2 border-t border-white/10">
            {Object.entries(submission.metadata).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-sm">
                <span className="text-white/40 capitalize">{k.replace(/_/g, ' ')}:</span>
                <span className="text-white/80 font-medium">{v}</span>
              </div>
            ))}
          </div>
        )}

        {submission.files?.length > 0 && (
          <div className="flex gap-2 pt-2 border-t border-white/10">
            {submission.files.map((f) => (
              <a key={f.id} href={`http://localhost:5000${f.file_url}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 bg-primary-500/10 px-3 py-1.5 rounded-lg">
                <FileText size={12} /> View File
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <p className="text-xs text-white/30">Submitted by <span className="text-white/50">{submission.submitted_by}</span></p>
          <p className="text-xs text-white/30">{formatDate(submission.created_at)}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={() => { onReject(); onClose(); }}
          className="btn-danger flex items-center gap-2 flex-1 justify-center">
          <XIcon size={18} /> Exclude
        </button>
        <button onClick={() => { onSelect(); onClose(); }}
          className="btn-success flex items-center gap-2 flex-1 justify-center" disabled={isSelected}>
          <Check size={18} /> {isSelected ? 'Already Selected' : 'Select'}
        </button>
      </div>
    </div>
  </div>
);

const GenerationPage = () => {
  const [newsletters, setNewsletters] = useState([]);
  const [approved, setApproved] = useState([]);
  const [selectedNewsletter, setSelectedNewsletter] = useState(null);
  const [newsletterItems, setNewsletterItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [previewSub, setPreviewSub] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [nlRes, apRes] = await Promise.all([
      api.get('/newsletters'),
      api.get('/submissions/admin/approved'),
    ]);
    setNewsletters(nlRes.data.data);
    setApproved(apRes.data.data);
    setLoading(false);
  };

  const fetchItems = async (newsletterId) => {
    const res = await api.get(`/newsletters/${newsletterId}/items`);
    setNewsletterItems(res.data.data);
  };

  const handleCreate = async () => {
    if (!month || !year) return;
    setError('');
    try {
      const res = await api.post('/newsletters', { month, year });
      const nl = res.data.data;
      setNewsletters(prev => [nl, ...prev]);
      setSelectedNewsletter(nl);
      fetchItems(nl.id);
      setCreating(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create newsletter');
    }
  };

  const handleSelect = async (submission) => {
    const section = SUBMISSION_TYPES[submission.type]?.section || 'General';
    const position = newsletterItems.length + 1;
    await api.post(`/newsletters/${selectedNewsletter.id}/items`, {
      submissionId: submission.id, section, position,
    });
    fetchItems(selectedNewsletter.id);
    fetchAll();
  };

  const handleDeselect = async (submission) => {
    await api.delete(`/newsletters/${selectedNewsletter.id}/items`, {
      data: { submissionId: submission.id },
    });
    fetchItems(selectedNewsletter.id);
    fetchAll();
  };

  const selectedIds = new Set(newsletterItems.map(i => i.submission_id));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Newsletter Generation</h1>
          <p className="text-white/40">Curate approved submissions into a newsletter</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Create Newsletter
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="card mb-6">
          <h2 className="font-semibold text-white mb-4">New Newsletter</h2>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <div className="flex gap-3">
            <select className="select flex-1" value={month} onChange={e => setMonth(e.target.value)}>
              <option value="">Select Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="number" className="input w-32" placeholder="Year" value={year}
              onChange={e => setYear(e.target.value)} />
            <button onClick={handleCreate} className="btn-primary">Create</button>
            <button onClick={() => setCreating(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Newsletters list */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-white/50 mb-3">Your Newsletters</h2>
          {newsletters.filter(n => n.status === 'Draft').map(n => (
            <button key={n.id}
              onClick={() => { setSelectedNewsletter(n); fetchItems(n.id); }}
              className={`w-full text-left card-sm hover:border-white/20 transition-all ${selectedNewsletter?.id === n.id ? 'border-primary-500/50 bg-primary-500/10' : ''}`}>
              <p className="font-medium text-white text-sm">{n.month} {n.year}</p>
              <p className="text-xs text-white/40 mt-0.5">{n.item_count || 0} items · Draft</p>
            </button>
          ))}
        </div>

        {/* Approved submissions pool */}
        <div>
          <h2 className="text-sm font-medium text-white/50 mb-3">Approved Submissions</h2>
          {loading ? <div className="text-white/30 animate-pulse text-sm">Loading...</div> :
            approved.length === 0 ? <p className="text-white/30 text-sm">No approved submissions</p> :
            <div className="space-y-2">
              {approved.map(s => (
                <div key={s.id}
                  className={`card-sm flex items-center justify-between gap-3 ${selectedIds.has(s.id) ? 'opacity-40' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{s.title}</p>
                    <p className="text-xs text-white/40">{s.type}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setPreviewSub(s)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
                      <Eye size={14} />
                    </button>
                    {selectedIds.has(s.id) ? (
                      <button onClick={() => handleDeselect(s)} disabled={!selectedNewsletter}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                        <XIcon size={14} />
                      </button>
                    ) : (
                      <button onClick={() => selectedNewsletter && handleSelect(s)} disabled={!selectedNewsletter}
                        className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all disabled:opacity-30">
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        {/* Selected items */}
        <div>
          <h2 className="text-sm font-medium text-white/50 mb-3">
            Newsletter Contents {selectedNewsletter ? `(${newsletterItems.length} items)` : ''}
          </h2>
          {!selectedNewsletter ? (
            <p className="text-white/30 text-sm">Select a newsletter to see its contents</p>
          ) : newsletterItems.length === 0 ? (
            <p className="text-white/30 text-sm">No items selected yet. Pick from approved submissions.</p>
          ) : (
            <div className="space-y-2">
              {newsletterItems.map((item, idx) => (
                <div key={item.id} className="card-sm flex items-center gap-3">
                  <span className="text-white/30 text-xs w-5 text-right">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                    <p className="text-xs text-white/40">{item.section}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {previewSub && (
        <ReviewPreviewModal
          submission={previewSub}
          onClose={() => setPreviewSub(null)}
          onSelect={() => selectedNewsletter && handleSelect(previewSub)}
          onReject={() => setPreviewSub(null)}
          isSelected={selectedIds.has(previewSub.id)}
        />
      )}
    </div>
  );
};

export default GenerationPage;
