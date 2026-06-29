import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { SUBMISSION_TYPES } from '../../utils/constants';
import { Upload, X, Send, Save, ArrowLeft, FileText, Image } from 'lucide-react';
import { toast } from '../../components/Toast';

const MAX_FILES = 5;
const MAX_MB    = 10;

const FilePreview = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  const url     = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="relative group">
      {isImage ? (
        <div className="w-24 h-20 rounded-lg overflow-hidden border border-ink-200">
          <img src={url} alt={file.name}
            className="w-full h-full object-cover"
            onLoad={() => URL.revokeObjectURL(url)} />
          <button onClick={onRemove}
            className="absolute top-1 right-1 w-5 h-5 bg-ink-900/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={10} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-ink-900/40 px-1 py-0.5">
            <p className="text-[9px] text-white truncate">{file.name}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-ink-50 border border-ink-200">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={14} className="text-ink-400 flex-shrink-0" />
            <span className="text-xs text-ink-600 truncate">{file.name}</span>
            <span className="text-2xs text-ink-400 flex-shrink-0">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
          <button onClick={onRemove} className="text-ink-400 hover:text-red-500 ml-2 flex-shrink-0">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

const DropZone = ({ files, onAdd, onRemove }) => {
  const inputRef  = useRef();
  const [drag, setDrag] = useState(false);

  const addFiles = useCallback((raw) => {
    const valid = Array.from(raw).filter(f => {
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.warning(`"${f.name}" exceeds ${MAX_MB} MB — skipped.`);
        return false;
      }
      return true;
    });
    onAdd(valid);
  }, [onAdd]);

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    addFiles(e.dataTransfer.files);
  };

  const images = files.filter(f => f.type.startsWith('image/'));
  const docs   = files.filter(f => !f.type.startsWith('image/'));

  return (
    <div>
      <label className="label">
        Supporting documents
        <span className="text-ink-400 font-normal ml-1">(max {MAX_FILES} files · {MAX_MB} MB each)</span>
      </label>

      {files.length < MAX_FILES && (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all
            ${drag
              ? 'border-primary-400 bg-primary-50/60'
              : 'border-ink-200 hover:border-primary-300 hover:bg-primary-50/40'}`}
        >
          <Upload size={18} className="text-ink-300 mb-1.5" />
          <span className="text-xs text-ink-400">
            {drag ? 'Drop to upload' : 'Drag & drop or click to upload'}
          </span>
          <span className="text-2xs text-ink-300 mt-0.5">JPG, PNG, PDF, DOC</span>
          <input ref={inputRef} type="file" className="hidden" multiple
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
        </div>
      )}

      {(images.length > 0 || docs.length > 0) && (
        <div className="mt-3 space-y-2">
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((f, i) => (
                <FilePreview key={i} file={f}
                  onRemove={() => onRemove(files.indexOf(f))} />
              ))}
            </div>
          )}
          {docs.map((f, i) => (
            <FilePreview key={i} file={f}
              onRemove={() => onRemove(files.indexOf(f))} />
          ))}
        </div>
      )}
    </div>
  );
};

const NewSubmissionPage = () => {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ type: '', title: '', description: '', metadata: {} });
  const [files,   setFiles]   = useState([]);
  const [loading, setLoading] = useState(null);
  const [error,   setError]   = useState('');

  const selectedType = SUBMISSION_TYPES[form.type];

  const handleMeta = (key, value) =>
    setForm(p => ({ ...p, metadata: { ...p.metadata, [key]: value } }));

  const addFiles  = (newFiles) => setFiles(p => [...p, ...newFiles].slice(0, MAX_FILES));
  const removeFile = (idx) => setFiles(p => p.filter((_, i) => i !== idx));

  const handleSubmit = async (action) => {
    if (!form.type || !form.title.trim()) { setError('Type and title are required.'); return; }
    setError(''); setLoading(action);
    try {
      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('title', form.title.trim());
      fd.append('description', form.description);
      fd.append('metadata', JSON.stringify(form.metadata));
      files.forEach(f => fd.append('files', f));
      const res = await api.post('/submissions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (action === 'submit') await api.patch(`/submissions/${res.data.data.id}/submit`);
      toast.success(action === 'submit' ? 'Submitted for approval!' : 'Draft saved.');
      navigate('/submissions');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(null); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="page-header">
        <button onClick={() => navigate('/submissions')} className="btn-ghost mb-3 -ml-2 text-ink-400">
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="page-title">New submission</h1>
        <p className="page-subtitle">Share your achievement with the department</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      <div className="card space-y-5">
        {/* Type */}
        <div>
          <label className="label">Submission type <span className="text-red-400">*</span></label>
          <select className="select" value={form.type}
            onChange={e => setForm(p => ({ ...p, type: e.target.value, metadata: {} }))}>
            <option value="">Select a type…</option>
            {Object.entries(SUBMISSION_TYPES).map(([k, { label }]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="label">Title <span className="text-red-400">*</span></label>
          <input className="input" placeholder="Give your achievement a clear title"
            value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={4}
            placeholder="Describe your achievement in detail…"
            value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>

        {/* Dynamic metadata fields */}
        {selectedType?.fields?.length > 0 && (
          <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 space-y-4">
            <p className="text-xs font-semibold text-primary-600">{selectedType.label} details</p>
            {selectedType.fields.map(({ key, label, required }) => (
              <div key={key}>
                <label className="label">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
                <input className="input" placeholder={label}
                  value={form.metadata[key] || ''}
                  onChange={e => handleMeta(key, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {/* File upload with drag-drop + preview */}
        <DropZone files={files} onAdd={addFiles} onRemove={removeFile} />

        {/* Actions */}
        <div className="flex gap-2.5 pt-2 border-t border-ink-100">
          <button onClick={() => handleSubmit('draft')} disabled={!!loading} className="btn-secondary flex-1">
            <Save size={14} /> {loading === 'draft' ? 'Saving…' : 'Save draft'}
          </button>
          <button onClick={() => handleSubmit('submit')} disabled={!!loading} className="btn-primary flex-1">
            <Send size={14} /> {loading === 'submit' ? 'Submitting…' : 'Submit for approval'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSubmissionPage;
