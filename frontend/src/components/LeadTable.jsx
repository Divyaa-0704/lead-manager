import StatusBadge from './StatusBadge';

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
];

const SORTABLE = ['name', 'email', 'company', 'status'];

function LeadTable({ leads, showOwner, sortBy, order, onSort, onEdit, onDelete }) {
    function arrow(key) {
    if (sortBy !== key) return '';
    return order === 'asc' ? ' ▲' : ' ▼';
  }

  return (
    <div className="table-wrap">
      <table className="lead-table">
        <thead>
          <tr>
            {COLUMNS.map(({ key, label }) =>
              SORTABLE.includes(key) ? (
                <th key={key}>
                  <button type="button" className="sort-btn" onClick={() => onSort(key)}>
                    {label}
                    {arrow(key)}
                  </button>
                </th>
              ) : (
                <th key={key}>{label}</th>
              )
            )}
            {showOwner && <th>Owner</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>{lead.name}</td>
              <td>{lead.email}</td>
              <td>{lead.phone}</td>
              <td>{lead.company}</td>
              <td>{lead.source}</td>
              <td>
                <StatusBadge status={lead.status} />
              </td>
              {showOwner && <td>{lead.owner_name}</td>}
              <td className="actions">
                <button type="button" className="btn btn-small btn-secondary" onClick={() => onEdit(lead)}>
                  Edit
                </button>
                <button type="button" className="btn btn-small btn-danger" onClick={() => onDelete(lead)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LeadTable;