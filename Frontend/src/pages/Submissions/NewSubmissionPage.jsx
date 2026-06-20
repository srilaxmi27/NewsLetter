import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { SUBMISSION_TYPES } from '../../utils/constants';
import { Upload, X, Send, Save } from 'lucide-react';

const NewSubmissionPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: '',
    title: '',
    description: '',
    metadata: {},
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(null); // 'draft' | 'submit'
  const [error, setError] = useState('');

  const selectedType = SUBMISSION_TYPES[form.type];

  const handleMetaChange = (key, value) => {
    setForm(prev => ({ ...prev, metadata: { ...prev.metadata, [key]: value } }));
  };

  const handleFileAdd = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles].slice(0, 5));
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (action) => {
    if (!form.type || !form.title.trim()) {
      setError('Type and Title are required.');
      return;
    }
    setError('');
    setLoading(action);

    try {
      const formData = new FormData();
      formData.append('type', form.type);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('metadata', JSON.stringify(form.metadata));
      files.forEach(f => formData.append('files', f));

      const res = await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const submissionId = res.data.data.id;

      if (action === 'submit') {
        await api.patch(`/submissions/${submissionId}/submit`);
      }

      navigate('/submissions');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">New Submission</h1>
        <p className="text-white/40">Share your achievement with the department</p>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="card space-y-6">
        {/* Type */}
        <div>
          <label className="label">Submission Type *</label>
          <select
            className="select"
            value={form.type}
            onChange={e => setForm(prev => ({ ...prev, type: e.target.value, metadata: {} }))}
          >
            <option value="">Select a type...</option>
            {Object.entries(SUBMISSION_TYPES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="label">Title *</label>
          <input
            className="input"
            placeholder="Give your achievement a clear title"
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea
            className="input resize-none"
            rows={4}
            placeholder="Describe your achievement in detail..."
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        {/* Dynamic Metadata Fields */}
        {selectedType && selectedType.fields.length > 0 && (
          <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm font-medium text-white/60">{selectedType.label} Details</p>
            {selectedType.fields.map(({ key, label, required }) => (
              <div key={key}>
                <label className="label">{label}{required && ' *'}</label>
                <input
                  className="input"
                  placeholder={label}
                  value={form.metadata[key] || ''}
                  onChange={e => handleMetaChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {/* File Upload */}
        <div>
          <label className="label">Supporting Documents / Images (max 5)</label>
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-primary-500/50 hover:bg-white/5 transition-all">
            <Upload size={24} className="text-white/30 mb-2" />
            <span className="text-sm text-white/30">Click to upload files</span>
            <input type="file" className="hidden" multiple accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={handleFileAdd} />
          </label>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm">
                  <span className="text-white/70 truncate">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="text-white/30 hover:text-red-400 ml-2">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={!!loading}
            className="btn-secondary flex items-center gap-2 flex-1 justify-center"
          >
            <Save size={18} />
            {loading === 'draft' ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSubmit('submit')}
            disabled={!!loading}
            className="btn-primary flex items-center gap-2 flex-1 justify-center"
          >
            <Send size={18} />
            {loading === 'submit' ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSubmissionPage;
