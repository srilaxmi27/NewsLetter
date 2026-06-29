import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { Download, FileText, Eye, X } from 'lucide-react';
import { MONTHS } from '../../utils/constants';

const ArchivesPage = () => {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [month, setMonth]             = useState('');
  const [year,  setYear]              = useState('');

  useEffect(() => {
    api.get('/newsletters/archives').then(r => {
      setNewsletters(r.data.data || []);
      setLoading(false);
    });
  }, []);

  const years = useMemo(() =>
    [...new Set(newsletters.map(n => n.year))].sort((a,b) => b - a), [newsletters]);

  const filtered = useMemo(() => {
    let list = newsletters;
    if (month) list = list.filter(n => n.month === month);
    if (year)  list = list.filter(n => String(n.year) === String(year));
    return list;
  }, [newsletters, month, year]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Archives</h1>
        <p className="page-subtitle">Browse and download all published newsletters</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2.5 items-end flex-wrap mb-5">
        <div>
          <label className="label text-xs">Month</label>
          <select className="select w-40 py-2 text-sm" value={month} onChange={e => setMonth(e.target.value)}>
            <option value="">All months</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-xs">Year</label>
          <select className="select w-28 py-2 text-sm" value={year} onChange={e => setYear(e.target.value)}>
            <option value="">All years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {(month || year) && (
          <button onClick={() => { setMonth(''); setYear(''); }} className="btn-ghost text-ink-400 self-end py-2">
            <X size={13} /> Clear
          </button>
        )}
        <span className="text-xs text-ink-400 self-end pb-2 ml-auto">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Results */}
      {loading ? (
        <div className="card space-y-2.5 p-4">
          {[1,2,3,4].map(i => <div key={i} className="h-10 bg-ink-100 rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-14">
          <FileText size={36} className="text-ink-200 mx-auto mb-3" />
          <p className="text-ink-400 text-sm">No newsletters found</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-ink-50 border-b border-ink-200">
              <tr>
                <th className="table-header">Newsletter</th>
                <th className="table-header">Department</th>
                <th className="table-header">Status</th>
                <th className="table-header">Items</th>
                <th className="table-header text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(n => (
                <tr key={n.id} className="table-row">
                  <td className="table-cell font-medium text-ink-800">{n.month} {n.year}</td>
                  <td className="table-cell text-ink-500 text-sm">{n.department_name}</td>
                  <td className="table-cell">
                    <span className={`badge ${n.status === 'Published' ? 'badge-published' : 'badge-archived'}`}>{n.status}</span>
                  </td>
                  <td className="table-cell text-ink-400 text-sm">{n.item_count ?? '—'}</td>
                  <td className="table-cell text-right pr-5">
                    {n.files?.length > 0 ? (
                      <div className="flex justify-end gap-2">
                        <a href={`http://localhost:5000${n.files[0].file_url}`} target="_blank" rel="noreferrer"
                          className="btn-secondary py-1.5 text-xs">
                          <Eye size={12} /> View
                        </a>
                        <a href={`http://localhost:5000${n.files[0].file_url}`} download
                          className="btn-primary py-1.5 text-xs">
                          <Download size={12} /> Download
                        </a>
                      </div>
                    ) : <span className="text-xs text-ink-300">No PDF</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ArchivesPage;
