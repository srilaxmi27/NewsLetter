import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, Send, Download, Eye, CheckCircle, Loader, ExternalLink } from 'lucide-react';
import { toast } from '../../components/Toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// PDF viewer — uses <object> which works better than <iframe> for local files.
// Falls back to an open-in-new-tab link if the browser can't embed it.
const PdfViewer = ({ url }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-ink-50">
        <FileText size={36} className="text-ink-300" />
        <p className="text-sm text-ink-500">Browser cannot display the PDF inline.</p>
        <a href={url} target="_blank" rel="noreferrer" className="btn-primary">
          <ExternalLink size={14} /> Open PDF in new tab
        </a>
      </div>
    );
  }

  return (
    <object
      data={url}
      type="application/pdf"
      className="w-full"
      style={{ height: '560px' }}
      onError={() => setFailed(true)}
    >
      {/* Fallback for browsers that don't support <object> with PDF */}
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-ink-50">
        <FileText size={36} className="text-ink-300" />
        <p className="text-sm text-ink-500">Your browser doesn&apos;t support inline PDF preview.</p>
        <a href={url} target="_blank" rel="noreferrer" className="btn-primary">
          <ExternalLink size={14} /> Open PDF in new tab
        </a>
      </div>
    </object>
  );
};

const PublicationPage = () => {
  const [newsletters, setNewsletters] = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [pdfUrl,      setPdfUrl]      = useState(null);
  const [generating,  setGenerating]  = useState(false);
  const [publishing,  setPublishing]  = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [published,   setPublished]   = useState(null);

  useEffect(() => {
    api.get('/newsletters')
      .then(r => {
        setNewsletters((r.data.data || []).filter(n => n.status === 'Draft' && parseInt(n.item_count) > 0));
      })
      .catch(() => toast.error('Failed to load newsletters.'))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selected) return;
    setGenerating(true); setPdfUrl(null);
    try {
      const r = await api.post(`/newsletters/${selected.id}/generate-pdf`);
      setPdfUrl(`${API_BASE}${r.data.data.fileUrl}`);
      toast.success('PDF generated — preview it below before publishing.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'PDF generation failed.');
    } finally { setGenerating(false); }
  };

  const handlePublish = async () => {
    if (!selected || !pdfUrl) return;
    setPublishing(true);
    try {
      await api.patch(`/newsletters/${selected.id}/publish`);
      const name = `${selected.month} ${selected.year}`;
      setNewsletters(p => p.filter(n => n.id !== selected.id));
      setSelected(null); setPdfUrl(null);
      setPublished(name);
      toast.success(`"${name}" published! Emails sent to all members.`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Publish failed.');
    } finally { setPublishing(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Publication</h1>
        <p className="page-subtitle">Generate a PDF preview, then publish to your department</p>
      </div>

      {published && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">
            <strong>"{published}"</strong> published — all department members notified by email.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Selector */}
        <div>
          <p className="text-2xs font-semibold text-ink-400 uppercase tracking-widest mb-3">Ready to publish</p>
          {loading ? (
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="h-14 bg-ink-100 rounded-xl animate-pulse" />)}
            </div>
          ) : newsletters.length === 0 ? (
            <div className="card text-center py-8">
              <FileText size={28} className="text-ink-200 mx-auto mb-2" />
              <p className="text-sm text-ink-400">No newsletters ready.</p>
              <p className="text-xs text-ink-300 mt-1">Assemble one in Generation first.</p>
            </div>
          ) : newsletters.map(n => (
            <button key={n.id}
              onClick={() => { setSelected(n); setPdfUrl(null); }}
              className={`w-full text-left card-sm mb-2 transition-all hover:shadow-sm
                ${selected?.id === n.id ? 'border-primary-300 bg-primary-50' : ''}`}>
              <p className="font-medium text-ink-800 text-sm">{n.month} {n.year}</p>
              <p className="text-2xs text-ink-400 mt-0.5">{n.item_count} items · {n.department_name}</p>
            </button>
          ))}
        </div>

        {/* Preview & publish */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="card h-52 flex items-center justify-center border-dashed">
              <div className="text-center">
                <FileText size={36} className="text-ink-200 mx-auto mb-2" />
                <p className="text-sm text-ink-400">Select a newsletter to preview and publish</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Controls */}
              <div className="card p-5">
                <h2 className="font-medium text-ink-900 mb-0.5">{selected.month} {selected.year}</h2>
                <p className="text-sm text-ink-400 mb-4">{selected.department_name} · {selected.item_count} items</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleGenerate} disabled={generating} className="btn-primary">
                    {generating
                      ? <><Loader size={14} className="animate-spin" /> Generating…</>
                      : <><Eye size={14} /> Generate PDF preview</>}
                  </button>
                  {pdfUrl && (
                    <>
                      <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                        <ExternalLink size={14} /> Open in new tab
                      </a>
                      <a href={pdfUrl} download className="btn-secondary">
                        <Download size={14} /> Download
                      </a>
                      <button onClick={handlePublish} disabled={publishing} className="btn-success ml-auto">
                        {publishing
                          ? <><Loader size={14} className="animate-spin" /> Publishing…</>
                          : <><Send size={14} /> Publish &amp; send emails</>}
                      </button>
                    </>
                  )}
                </div>
                {!pdfUrl && !generating && (
                  <p className="mt-3 text-xs text-ink-400">Generate the PDF first to preview it before publishing.</p>
                )}
              </div>

              {/* PDF preview */}
              {pdfUrl && (
                <div className="card p-0 overflow-hidden">
                  <div className="px-4 py-3 border-b border-ink-100 flex items-center gap-2 bg-ink-50">
                    <FileText size={13} className="text-ink-400" />
                    <span className="text-xs text-ink-500 font-medium">PDF preview</span>
                    <span className="text-2xs text-ink-300 ml-auto">Review before publishing</span>
                  </div>
                  <PdfViewer url={pdfUrl} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicationPage;
