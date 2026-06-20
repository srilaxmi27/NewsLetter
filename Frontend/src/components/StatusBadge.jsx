import { STATUS_CLASSES } from '../utils/constants';

const StatusBadge = ({ status }) => {
  const cls = STATUS_CLASSES[status] || 'badge bg-white/10 text-white/60';
  return <span className={cls}>{status}</span>;
};

export default StatusBadge;
