import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { SUBMISSION_TYPES } from '../../utils/constants';
import { Upload, X, Send, Save, MessageSquare, ArrowLeft, FileText } from 'lucide-react';
import { toast } from '../../components/Toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const MAX_FILES = 5;
const MAX_MB    = 10;

const FilePreview = ({ file, onRemove }) => {
  const isImage = file.type?.startsWith('image/');
  const url     = isImage ? URL.createObjectURL(file) : null;
  return isImage ? (
    <div className="relative group w-24 h-20 rounded-lg overflow-hidden border border-ink-200">
      <img src={url} alt={file.name} className="w-full h-full object-cover"
        onLoad={() => URL.revokeObjectURL(url)} />
      <button onClick={onRemove}
        className="absolute top-1 right-1 w-5 h-5 bg-ink-900/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <X size={10} />
      </button>
    </div>
  ) : (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-ink-50 border border-ink-200 text-xs">
      <span className="text-ink-600 truncate flex-1 mr-2">{file.name}</span>
      <button onClick={onRemove} className="text-ink-400 hover:text-red-500 flex-shrink-0"><X size={13} /></button>
    </div>
  );
};

const EditSubmissionPage = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const inputRef  = useRef();
  const [submission, setSubmission] = useState(null);
  const [form, setForm]   = useState(null);
  const [files, setFiles] = useState([]);
  const [drag,  setDrag]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(null);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get(`/submissions/${id}`)
      .then(r => {
        const s = r.data.data;
        if (!['Draft', 'Rejected'].includes(s.status)) { navigate('/submissions'); return; }
        setSubmission(s);
        setForm({ type: s.type, title: s.title, description: s.description || '', metadata: s.metadata || {} });
      })
      .catch(() => navigate('/submissions'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const addFiles = useCallback((raw) => {
    const valid = Array.from(raw).filter(f => {
      if (f.size > MAX_MB * 1024 * 1024) { toast.warning(`"${f.name}" is too large — skipped.`); return false; }
      return true;
    });
    setFiles(p => [...p, ...valid].slice(0, MAX_FILES));
  }, []);

  if (loading || !form) return (
    <div className="max-w-xl mx-auto">
      <div className="h-6 bg-ink-100 rounded-lg animate-pulse w-40 mb-4" />
      <div className="card h-80 animate-pulse bg-ink-50" />
    </div>
  );

  const isRejected  = submission.status === 'Rejected';
  const selectedType = SUBMISSION_TYPES[form.type];

  const handleSave = async (action) => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setError(''); setSaving(action);
    try {
      if (isRejected) await api.patch(`/submissions/${id}/reopen`);
      await api.put(`/submissions/${id}`, { title: form.title, description: form.description, metadata: form.metadata });
      if (action === 'submit') await api.patch(`/submissions/${id}/submit`);
      toast.success(action === 'submit' ? 'Submitted for approval!' : 'Draft saved.');
      navigate('/submissions');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally { setSaving(null); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="page-header">
        <button onClick={() => navigate('/submissions')} className="btn-ghost mb-3 -ml-2 text-ink-400">
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="page-title">{isRejected ? 'Edit & resubmit' : 'Edit submission'}</h1>
        <p className="page-subtitle">
          {isRejected ? 'Address the remarks below, then resubmit.' : 'Update your draft before submitting.'}
        </p>
      </div>

      {submission.admin_remarks && (
        <div className="remarks-banner mb-5">
          <MessageSquare size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-2xs font-bold text-amber-700 mb-1 uppercase tracking-widest">Admin remarks</p>
            <p className="text-sm text-amber-800 leading-relaxed">{submission.admin_remarks}</p>
          </div>
        </div>
      )}

      {error && <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

      <div className="card space-y-5">
        <div>
          <label className="label">Submission type</label>
          <div className="input bg-ink-50 text-ink-400 cursor-not-allowed">
            {SUBMISSION_TYPES[form.type]?.label || form.type}
          </div>
        </div>

        <div>
          <label className="label">Title <span className="text-red-400">*</span></label>
          <input className="input" value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={4} value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>

        {selectedType?.fields?.length > 0 && (
          <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 space-y-4">
            <p className="text-xs font-semibold text-primary-600">{selectedType.label} details</p>
            {selectedType.fields.map(({ key, label, required }) => (
              <div key={key}>
                <label className="label">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
                <input className="input" placeholder={label} value={form.metadata[key] || ''}
                  onChange={e => setForm(p => ({ ...p, metadata: { ...p.metadata, [key]: e.target.value } }))} />
              </div>
            ))}
          </div>
        )}

        {/* Existing files */}
        {submission.files?.length > 0 && (
          <div>
            <label className="label">Existing attachments</label>
            <div className="flex flex-wrap gap-2">
              {submission.files.map(f => {
                const isImg = ['jpg','jpeg','png'].includes(f.file_url?.split('.').pop()?.toLowerCase());
                return isImg ? (
                  <a key={f.id} href={`${API_BASE}${f.file_url}`} target="_blank" rel="noreferrer"
                    className="block w-24 h-20 rounded-lg overflow-hidden border border-ink-200 hover:border-primary-300 transition-colors">
                    <img src={`${API_BASE}${f.file_url}`} alt="attachment" className="w-full h-full object-cover" />
                  </a>
                ) : (
                  <a key={f.id} href={`${API_BASE}${f.file_url}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary-600 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors">
                    <FileText size={11} /> View file
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* New file upload */}
        <div>
          <label className="label">Add more files <span className="text-ink-400 font-normal">(max {MAX_FILES} total)</span></label>
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer transition-all
              ${drag ? 'border-primary-400 bg-primary-50/60' : 'border-ink-200 hover:border-primary-300 hover:bg-primary-50/40'}`}
          >
            <Upload size={16} className="text-ink-300 mb-1" />
            <span className="text-xs text-ink-400">Drag & drop or click to upload</span>
            <input ref={inputRef} type="file" className="hidden" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
              onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>
          {files.length > 0 && (
            <div className="mt-2.5 space-y-1.5">
              {files.map((f, i) => (
                <FilePreview key={i} file={f} onRemove={() => setFiles(p => p.filter((_,j) => j !== i))} />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2.5 pt-2 border-t border-ink-100">
          <button onClick={() => handleSave('draft')} disabled={!!saving} className="btn-secondary flex-1">
            <Save size={14} /> {saving === 'draft' ? 'Saving…' : 'Save draft'}
          </button>
          <button onClick={() => handleSave('submit')} disabled={!!saving} className="btn-primary flex-1">
            <Send size={14} /> {saving === 'submit' ? 'Submitting…' : 'Submit for approval'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSubmissionPage;
