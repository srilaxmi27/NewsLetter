const STATUS_MAP = {
  Draft:     'badge-draft',
  Pending:   'badge-pending',
  Approved:  'badge-approved',
  Rejected:  'badge-rejected',
  Selected:  'badge-selected',
  Published: 'badge-published',
  Archived:  'badge-archived',
};

const StatusBadge = ({ status }) => (
  <span className={STATUS_MAP[status] || 'badge bg-ink-100 text-ink-400'}>
    {status}
  </span>
);

export default StatusBadge;
