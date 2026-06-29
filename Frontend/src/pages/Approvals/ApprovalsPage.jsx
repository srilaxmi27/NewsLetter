import { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatters';
import { CheckCircle, XCircle, Eye, FileText, X, MessageSquare, Image } from 'lucide-react';
import { toast } from '../../components/Toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Inline image preview inside the modal
const ProofImages = ({ files }) => {
  const imgs = (files || []).filter(f => {
    const ext = f.file_url?.split('.').pop()?.toLowerCase();
    return ['jpg','jpeg','png'].includes(ext);
  });
  const docs = (files || []).filter(f => {
    const ext = f.file_url?.split('.').pop()?.toLowerCase();
    return !['jpg','jpeg','png'].includes(ext);
  });

  return (
    <>
      {imgs.length > 0 && (
        <div>
          <p className="text-2xs font-semibold text-ink-400 uppercase tracking-widest mb-2">Proof</p>
          <div className="flex flex-wrap gap-2">
            {imgs.map(f => (
              <a key={f.id} href={`${API_BASE}${f.file_url}`} target="_blank" rel="noreferrer"
                className="block rounded-lg overflow-hidden border border-ink-200 hover:border-primary-300 transition-colors">
                <img
                  src={`${API_BASE}${f.file_url}`}
                  alt="proof"
                  className="w-36 h-28 object-cover"
                  onError={e => { e.target.style.display='none'; }}
                />
              </a>
            ))}
          </div>
        </div>
      )}
      {docs.length > 0 && (
        <div>
          <p className="text-2xs font-semibold text-ink-400 uppercase tracking-widest mb-2">Attachments</p>
          <div className="flex flex-wrap gap-2">
            {docs.map(f => (
              <a key={f.id} href={`${API_BASE}${f.file_url}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary-600 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-lg hover:bg-primary-100">
                <FileText size={11} /> View file
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const ReviewModal = ({ submission, onClose, onAction }) => {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(null);
  const [rejectError, setRejectError] = useState('');

  const handle = async (action) => {
    if (action === 'reject' && !remarks.trim()) {
      setRejectError('Remarks are required when rejecting.');
      return;
    }
    setRejectError('');
    setLoading(action);
    try {
      await onAction(submission.id, action, remarks);
      onClose();
      toast.success(action === 'approve' ? 'Submission approved.' : 'Submission rejected.');
    } catch {
      toast.error('Action failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-ink-100">
          <div>
            <h2 className="font-semibold text-ink-900 pr-4">{submission.title}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-2xs bg-ink-100 text-ink-500 px-2 py-0.5 rounded font-medium">{submission.type}</span>
              <StatusBadge status={submission.status} />
            </div>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600 p-1 -mt-0.5 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Submitter */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-ink-50 border border-ink-100">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs flex-shrink-0">
              {submission.submitted_by?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-ink-800">
                {submission.submitted_by}
                <span className="ml-1.5 text-xs font-normal text-ink-400">· {submission.submitter_role}</span>
              </p>
              <p className="text-2xs text-ink-400">{formatDate(submission.created_at)}</p>
            </div>
          </div>

          {submission.description && (
            <div>
              <p className="text-2xs font-semibold text-ink-400 uppercase tracking-widest mb-1.5">Description</p>
              <p className="text-sm text-ink-700 leading-relaxed">{submission.description}</p>
            </div>
          )}

          {submission.metadata && Object.keys(submission.metadata).length > 0 && (
            <div>
              <p className="text-2xs font-semibold text-ink-400 uppercase tracking-widest mb-2">Details</p>
              <div className="p-3 rounded-xl bg-ink-50 border border-ink-100 grid grid-cols-2 gap-2">
                {Object.entries(submission.metadata).filter(([,v]) => v).map(([k, v]) => (
                  <div key={k} className="text-sm">
                    <span className="text-ink-400 capitalize">{k.replace(/_/g,' ')}: </span>
                    <span className="text-ink-700 font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proof images + doc attachments */}
          <ProofImages files={submission.files} />

          {/* Remarks */}
          <div>
            <label className="label flex items-center gap-1.5">
              <MessageSquare size={13} className="text-ink-400" />
              Remarks
              <span className="text-ink-400 font-normal text-xs">(required for rejection)</span>
            </label>
            <textarea
              className={`input resize-none ${rejectError ? 'border-red-300 focus:ring-red-300/30' : ''}`}
              rows={3}
              placeholder="Add feedback for the submitter…"
              value={remarks}
              onChange={e => { setRemarks(e.target.value); setRejectError(''); }}
            />
            {rejectError && <p className="text-xs text-red-500 mt-1">{rejectError}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 p-5 pt-0">
          <button onClick={() => handle('reject')} disabled={!!loading} className="btn-danger flex-1">
            <XCircle size={15} /> {loading === 'reject' ? 'Rejecting…' : 'Reject'}
          </button>
          <button onClick={() => handle('approve')} disabled={!!loading} className="btn-success flex-1">
            <CheckCircle size={15} /> {loading === 'approve' ? 'Approving…' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ApprovalsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);

  const fetchPending = async () => {
    try {
      const r = await api.get('/submissions/admin/pending');
      setSubmissions(r.data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id, action, remarks) => {
    await api.patch(`/approvals/${id}/${action}`, { remarks });
    await fetchPending();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pending approvals</h1>
        <p className="page-subtitle">{submissions.length} submission{submissions.length !== 1 ? 's' : ''} awaiting review</p>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1,2,3].map(i => (
            <div key={i} className="card p-4 flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-ink-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-ink-100 rounded-lg animate-pulse w-2/3" />
                <div className="h-3 bg-ink-100 rounded-lg animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="card text-center py-14">
          <CheckCircle size={36} className="text-emerald-300 mx-auto mb-3" />
          <p className="text-ink-700 font-medium text-sm">All caught up</p>
          <p className="text-ink-400 text-sm mt-1">No pending submissions to review.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {submissions.map(s => {
            const hasImage = (s.files || []).some(f => ['jpg','jpeg','png'].includes(f.file_url?.split('.').pop()?.toLowerCase()));
            return (
              <div key={s.id} className="bg-white border border-ink-200 rounded-xl shadow-xs hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4 px-4 py-3.5">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                    {s.submitted_by?.[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-ink-800 text-sm truncate">{s.title}</h3>
                      {hasImage && (
                        <span title="Has proof image">
                          <Image size={12} className="text-primary-400 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 text-2xs text-ink-400">
                      <span>{s.submitted_by} · {s.submitter_role}</span>
                      <span className="px-1.5 py-0.5 bg-ink-100 rounded font-medium">{s.type}</span>
                      <span>{formatDate(s.created_at)}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <button onClick={() => setSelected(s)} className="btn-secondary py-1.5 text-xs flex-shrink-0">
                    <Eye size={13} /> Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <ReviewModal
          submission={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
};

export default ApprovalsPage;
