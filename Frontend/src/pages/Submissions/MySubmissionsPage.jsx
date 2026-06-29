import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatters';
import {
  Plus, Search, MessageSquare, FileText,
  ChevronDown, ChevronUp, SlidersHorizontal, Pencil,
  CheckCircle, Clock, Send, Archive, XCircle,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const STATUSES = ['All', 'Draft', 'Pending', 'Approved', 'Rejected', 'Selected', 'Published', 'Archived'];

// ── Status timeline ─────────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { key: 'Draft',     label: 'Draft',       icon: FileText    },
  { key: 'Pending',   label: 'Submitted',   icon: Send        },
  { key: 'Approved',  label: 'Approved',    icon: CheckCircle },
  { key: 'Published', label: 'Published',   icon: Archive     },
];

// Map any status to its position in the timeline
const STATUS_STEP = {
  Draft:     0,
  Pending:   1,
  Approved:  2,
  Selected:  2,
  Published: 3,
  Archived:  3,
  Rejected:  -1, // special
};

const SubmissionTimeline = ({ status }) => {
  const isRejected = status === 'Rejected';
  const activeIdx  = STATUS_STEP[status] ?? 0;

  if (isRejected) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200">
          <XCircle size={13} className="text-red-500" />
          <span className="text-xs font-medium text-red-600">Rejected — edit and resubmit</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 py-2">
      {TIMELINE_STEPS.map(({ key, label, icon: Icon }, idx) => {
        const done   = idx < activeIdx;
        const active = idx === activeIdx;
        return (
          <div key={key} className="flex items-center">
            {/* Node */}
            <div className={`flex flex-col items-center gap-1 ${idx === 0 ? '' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors
                ${done   ? 'bg-primary-600 border-primary-600 text-white'
                : active ? 'bg-white border-primary-500 text-primary-600'
                :          'bg-white border-ink-200 text-ink-300'}`}>
                {done
                  ? <CheckCircle size={13} className="text-white" />
                  : <Icon size={12} />
                }
              </div>
              <span className={`text-2xs font-medium leading-none ${
                active ? 'text-primary-600' : done ? 'text-ink-500' : 'text-ink-300'
              }`}>{label}</span>
            </div>
            {/* Connector */}
            {idx < TIMELINE_STEPS.length - 1 && (
              <div className={`h-0.5 w-10 mx-1 mb-4 ${done ? 'bg-primary-500' : 'bg-ink-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Proof image strip ────────────────────────────────────────────────────────

const ProofStrip = ({ files }) => {
  if (!files?.length) return null;
  const imgs = files.filter(f => ['jpg','jpeg','png'].includes(f.file_url?.split('.').pop()?.toLowerCase()));
  const docs = files.filter(f => !['jpg','jpeg','png'].includes(f.file_url?.split('.').pop()?.toLowerCase()));
  return (
    <div>
      <p className="text-2xs font-semibold text-ink-400 uppercase tracking-widest mb-2">Attachments</p>
      <div className="flex flex-wrap gap-2">
        {imgs.map(f => (
          <a key={f.id} href={`${API_BASE}${f.file_url}`} target="_blank" rel="noreferrer"
            className="block rounded-lg overflow-hidden border border-ink-200 hover:border-primary-300 transition-colors">
            <img src={`${API_BASE}${f.file_url}`} alt="proof"
              className="w-24 h-20 object-cover"
              onError={e => { e.target.style.display = 'none'; }} />
          </a>
        ))}
        {docs.map(f => (
          <a key={f.id} href={`${API_BASE}${f.file_url}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-lg transition-colors">
            <FileText size={11} /> View file
          </a>
        ))}
      </div>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────

const MySubmissionsPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [expanded,    setExpanded]    = useState(null);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('All');
  const [sort,        setSort]        = useState('date_desc');

  useEffect(() => {
    api.get('/submissions/mine')
      .then(r => { setSubmissions(r.data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = submissions;
    if (filter !== 'All') list = list.filter(s => s.status === filter);
    if (search.trim())    list = list.filter(s =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.type.toLowerCase().includes(search.toLowerCase())
    );
    if (sort === 'date_desc') list = [...list].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    if (sort === 'date_asc')  list = [...list].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    if (sort === 'status')    list = [...list].sort((a,b) => a.status.localeCompare(b.status));
    return list;
  }, [submissions, filter, search, sort]);

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">My Submissions</h1>
          <p className="page-subtitle">{submissions.length} total</p>
        </div>
        <Link to="/submissions/new" className="btn-primary">
          <Plus size={15} /> New submission
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2.5 items-center mb-5">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="input pl-8 py-2 w-52 text-xs" placeholder="Search…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border
                ${filter === s
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-ink-500 border-ink-200 hover:border-ink-300 hover:text-ink-700'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <SlidersHorizontal size={13} className="text-ink-400" />
          <select className="select py-1.5 text-xs w-36" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="status">By status</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2.5">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-ink-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <FileText size={32} className="text-ink-200 mx-auto mb-3" />
          <p className="text-ink-400 text-sm mb-4">
            {submissions.length === 0 ? 'No submissions yet' : 'No results match your filters'}
          </p>
          {submissions.length === 0 && (
            <Link to="/submissions/new" className="btn-primary">
              <Plus size={15} /> Create first submission
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className="bg-white border border-ink-200 rounded-xl shadow-xs overflow-hidden hover:shadow-sm transition-shadow">
              {/* Summary row */}
              <div className="flex items-center gap-4 px-4 py-3.5 cursor-pointer"
                onClick={() => setExpanded(e => e === s.id ? null : s.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-ink-800 text-sm truncate">{s.title}</h3>
                    <StatusBadge status={s.status} />
                    {s.admin_remarks && (
                      <MessageSquare size={12} className="text-amber-400 flex-shrink-0" title="Has admin remarks" />
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 text-2xs text-ink-400">
                    <span className="px-1.5 py-0.5 bg-ink-100 rounded font-medium">{s.type}</span>
                    <span>{formatDate(s.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(s.status === 'Draft' || s.status === 'Rejected') && (
                    <Link to={`/submissions/edit/${s.id}`} onClick={e => e.stopPropagation()}
                      className="btn-secondary py-1.5 text-xs gap-1.5">
                      <Pencil size={12} />
                      {s.status === 'Rejected' ? 'Resubmit' : 'Edit'}
                    </Link>
                  )}
                  {expanded === s.id
                    ? <ChevronUp size={14} className="text-ink-400" />
                    : <ChevronDown size={14} className="text-ink-400" />}
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === s.id && (
                <div className="border-t border-ink-100 px-4 py-4 bg-ink-50/40 space-y-4">
                  {/* Timeline */}
                  <SubmissionTimeline status={s.status} />

                  {s.description && (
                    <div>
                      <p className="text-2xs font-semibold text-ink-400 uppercase tracking-widest mb-1">Description</p>
                      <p className="text-sm text-ink-700 leading-relaxed">{s.description}</p>
                    </div>
                  )}

                  {s.metadata && Object.keys(s.metadata).length > 0 && (
                    <div>
                      <p className="text-2xs font-semibold text-ink-400 uppercase tracking-widest mb-2">Details</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                        {Object.entries(s.metadata).filter(([,v]) => v).map(([k, v]) => (
                          <div key={k} className="flex gap-2 text-sm">
                            <span className="text-ink-400 capitalize">{k.replace(/_/g, ' ')}:</span>
                            <span className="text-ink-700 font-medium">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {s.files?.length > 0 && <ProofStrip files={s.files} />}

                  {s.admin_remarks && (
                    <div className="remarks-banner">
                      <MessageSquare size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-2xs font-bold text-amber-700 mb-0.5 uppercase tracking-widest">Admin remarks</p>
                        <p className="text-sm text-amber-800 leading-relaxed">{s.admin_remarks}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-5 text-xs text-ink-400 pt-0.5">
                    <span>Submitted <strong className="text-ink-600 font-medium">{formatDate(s.created_at)}</strong></span>
                    {s.updated_at && s.updated_at !== s.created_at && (
                      <span>Updated <strong className="text-ink-600 font-medium">{formatDate(s.updated_at)}</strong></span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySubmissionsPage;
