import { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileText, Send, Download, Eye } from 'lucide-react';

const PublicationPage = () => {
  const [newsletters, setNewsletters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/newsletters').then(res => {
      const drafts = res.data.data.filter(n => n.status === 'Draft' && parseInt(n.item_count) > 0);
      setNewsletters(drafts);
      setLoading(false);
    });
  }, []);

  const handleGenerate = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      const res = await api.post(`/newsletters/${selected.id}/generate-pdf`);
      setPdfUrl(`http://localhost:5000${res.data.data.fileUrl}`);
    } catch (err) {
      alert(err.response?.data?.error || 'PDF generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!selected || !pdfUrl) return;
    setPublishing(true);
    try {
      await api.patch(`/newsletters/${selected.id}/publish`);
      setNewsletters(prev => prev.filter(n => n.id !== selected.id));
      setSelected(null);
      setPdfUrl(null);
      alert('Newsletter published successfully! All department users have been notified.');
    } catch (err) {
      alert(err.response?.data?.error || 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Publication</h1>
        <p className="text-white/40">Preview and publish newsletters to your department</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Newsletter Selector */}
        <div>
          <h2 className="text-sm font-medium text-white/50 mb-3">Ready to Publish</h2>
          {loading ? (
            <div className="text-white/30 text-sm animate-pulse">Loading...</div>
          ) : newsletters.length === 0 ? (
            <p className="text-white/30 text-sm">No newsletters ready for publication. Assemble one in the Generation page first.</p>
          ) : (
            <div className="space-y-2">
              {newsletters.map(n => (
                <button key={n.id}
                  onClick={() => { setSelected(n); setPdfUrl(null); }}
                  className={`w-full text-left card-sm hover:border-white/20 transition-all ${selected?.id === n.id ? 'border-primary-500/50 bg-primary-500/10' : ''}`}>
                  <p className="font-semibold text-white">{n.month} {n.year}</p>
                  <p className="text-xs text-white/40 mt-0.5">{n.item_count} items · {n.department_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Actions + Preview */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="card h-full flex items-center justify-center">
              <div className="text-center">
                <FileText size={48} className="text-white/10 mx-auto mb-4" />
                <p className="text-white/30">Select a newsletter to preview and publish</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Newsletter info */}
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-1">{selected.month} {selected.year} Newsletter</h2>
                <p className="text-white/40 text-sm">{selected.department_name} · {selected.item_count} items selected</p>

                <div className="flex gap-3 mt-4">
                  <button onClick={handleGenerate} disabled={generating}
                    className="btn-primary flex items-center gap-2">
                    <Eye size={18} />
                    {generating ? 'Generating PDF...' : 'Generate & Preview'}
                  </button>

                  {pdfUrl && (
                    <>
                      <a href={pdfUrl} download className="btn-secondary flex items-center gap-2">
                        <Download size={18} /> Download PDF
                      </a>
                      <button onClick={handlePublish} disabled={publishing}
                        className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2 ml-auto">
                        <Send size={18} />
                        {publishing ? 'Publishing...' : 'Publish Newsletter'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* PDF Preview */}
              {pdfUrl && (
                <div className="card p-0 overflow-hidden">
                  <div className="p-4 border-b border-white/10 flex items-center gap-2">
                    <FileText size={16} className="text-white/50" />
                    <span className="text-sm text-white/50">PDF Preview</span>
                  </div>
                  <iframe
                    src={pdfUrl}
                    className="w-full"
                    style={{ height: '600px' }}
                    title="Newsletter Preview"
                  />
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
