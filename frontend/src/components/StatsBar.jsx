import { STATUSES } from '../constants';

function StatsBar({ stats }) {
  if (!stats) return null;

  return (
    <div className="stats-bar">
      <div className="stat-card stat-total">
        <span className="stat-number">{stats.total}</span>
        <span className="stat-label">Total Leads</span>
      </div>
      {STATUSES.map((status) => (
        <div className={`stat-card stat-${status.toLowerCase()}`} key={status}>
          <span className="stat-number">{stats.byStatus[status] ?? 0}</span>
          <span className="stat-label">{status}</span>
        </div>
      ))}
    </div>
  );
}

export default StatsBar;