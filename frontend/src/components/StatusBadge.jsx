import { formatStatus } from '../utils';

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status || 'UNKNOWN'}`}><span className="status-dot" />{formatStatus(status)}</span>;
}
