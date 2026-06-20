import { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatters';
import { CheckCircle, XCircle, Eye, FileText, X } from 'lucide-react';

const ReviewModal = ({ submission, onClose, onAction }) => {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(null);

  const handleAction = async (action) => {
    setLoading(action);
    await onAction(submission.id, action, remarks);
    setLoading(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{submission.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-white/40 px-2 py-0.5 rounded-full bg-white/5">{submission.type}</span>
              <StatusBadge status={submission.status} />
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white"><X size={20} /></button>
        </div>

        {/* Submission Preview */}
        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-xl bg-white/5">
            <p className="text-sm font-medium text-white/50 mb-1">Submitted By</p>
            <p className="text-white">{submission.submitted_by} <span className="text-white/40">({submission.submitter_role})</span></p>
            <p className="text-xs text-white/30 mt-1">{formatDate(submission.created_at)}</p>
          </div>

          {submission.description && (
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-sm font-medium text-white/50 mb-1">Description</p>
              <p className="text-sm text-white/80">{submission.description}</p>
            </div>
          )}

          {submission.metadata && Object.keys(submission.metadata).length > 0 && (
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-sm font-medium text-white/50 mb-2">Details</p>
              <div className="space-y-1">
                {Object.entries(submission.metadata).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-sm">
                    <span className="text-white/40 capitalize">{k.replace(/_/g, ' ')}:</span>
                    <span className="text-white/80">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submission.files?.length > 0 && (
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-sm font-medium text-white/50 mb-2">Attached Files</p>
              <div className="space-y-2">
                {submission.files.map((f) => (
                  <a
                    key={f.id}
                    href={`http://localhost:5000${f.file_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm"
                  >
                    <FileText size={14} /> View File
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Remarks */}
        <div className="mb-4">
          <label className="label">Remarks (optional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Add a note for the submitter..."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => handleAction('reject')} disabled={!!loading}
            className="btn-danger flex items-center gap-2 flex-1 justify-center">
            <XCircle size={18} />
            {loading === 'reject' ? 'Rejecting...' : 'Reject'}
          </button>
          <button onClick={() => handleAction('approve')} disabled={!!loading}
            className="btn-success flex items-center gap-2 flex-1 justify-center">
            <CheckCircle size={18} />
            {loading === 'approve' ? 'Approving...' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ApprovalsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const fetchPending = async () => {
    const res = await api.get('/submissions/admin/pending');
    setSubmissions(res.data.data);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id, action, remarks) => {
    await api.patch(`/approvals/${id}/${action}`, { remarks });
    fetchPending();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Approvals</h1>
        <p className="text-white/40">{submissions.length} submissions pending review</p>
      </div>

      {loading ? (
        <div className="text-white/30 animate-pulse">Loading...</div>
      ) : submissions.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <p className="text-white/50">All caught up! No pending submissions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div key={s.id} className="card flex items-center justify-between hover:border-white/20 transition-all">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{s.title}</h3>
                <div className="flex items-center gap-4 text-sm text-white/40 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs">{s.type}</span>
                  <span>{s.submitted_by}</span>
                  <span>{formatDate(s.created_at)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelected(s)}
                className="ml-4 btn-secondary flex items-center gap-2 text-sm"
              >
                <Eye size={16} /> Review
              </button>
            </div>
          ))}
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
