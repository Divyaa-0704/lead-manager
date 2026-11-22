import { STATUSES } from '../constants';

function SearchBar({ search, status, onSearchChange, onStatusChange }) {
  return (
    <div className="search-bar">
      <input
        type="search"
        className="search-input"
        placeholder="Search by name, email or company..."
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        aria-label="Search leads"
      />
      <select
        className="status-filter"
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SearchBar;