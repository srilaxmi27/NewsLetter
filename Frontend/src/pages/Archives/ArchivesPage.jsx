import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Download, Search, FileText } from 'lucide-react';
import { MONTHS } from '../../utils/constants';

const ArchivesPage = () => {
  const [newsletters, setNewsletters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({ month: '', year: '' });

  useEffect(() => {
    api.get('/newsletters/archives').then(res => {
      setNewsletters(res.data.data);
      setFiltered(res.data.data);
      setLoading(false);
    });
  }, []);

  const handleSearch = () => {
    let result = newsletters;
    if (search.month) result = result.filter(n => n.month === search.month);
    if (search.year) result = result.filter(n => String(n.year) === String(search.year));
    setFiltered(result);
  };

  const handleReset = () => {
    setSearch({ month: '', year: '' });
    setFiltered(newsletters);
  };

  const getYears = () => {
    const years = [...new Set(newsletters.map(n => n.year))].sort((a, b) => b - a);
    return years;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Newsletter Archives</h1>
        <p className="text-white/40">Browse and download all published department newsletters</p>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label">Month</label>
            <select className="select" value={search.month}
              onChange={e => setSearch(prev => ({ ...prev, month: e.target.value }))}>
              <option value="">All Months</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="label">Year</label>
            <select className="select" value={search.year}
              onChange={e => setSearch(prev => ({ ...prev, year: e.target.value }))}>
              <option value="">All Years</option>
              {getYears().map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={handleSearch} className="btn-primary flex items-center gap-2">
            <Search size={16} /> Search
          </button>
          <button onClick={handleReset} className="btn-secondary">Reset</button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-white/30 animate-pulse">Loading archives...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/30">No newsletters found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(n => (
            <div key={n.id} className="card hover:border-white/20 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center">
                  <FileText size={22} className="text-primary-400" />
                </div>
                <span className={`badge ${n.status === 'Published' ? 'badge-published' : 'badge-archived'}`}>
                  {n.status}
                </span>
              </div>
              <h3 className="font-bold text-white text-lg">{n.month} {n.year}</h3>
              <p className="text-sm text-white/40 mb-4">{n.department_name}</p>

              {n.files?.length > 0 ? (
                <div className="flex gap-2">
                  <a href={`http://localhost:5000${n.files[0].file_url}`} target="_blank" rel="noreferrer"
                    className="btn-secondary flex items-center gap-2 text-sm flex-1 justify-center">
                    <FileText size={16} /> View
                  </a>
                  <a href={`http://localhost:5000${n.files[0].file_url}`} download
                    className="btn-primary flex items-center gap-2 text-sm flex-1 justify-center">
                    <Download size={16} /> Download
                  </a>
                </div>
              ) : (
                <p className="text-xs text-white/30">No PDF available</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchivesPage;
