function Pagination({ page, totalPages, total, onPageChange }) {
  if (total === 0) return null;

  return (
    <div className="pagination">
      <span className="pagination-info">
        Page {page} of {totalPages} ({total} {total === 1 ? 'lead' : 'leads'})
      </span>
      <div className="pagination-buttons">
        <button
          type="button"
          className="btn btn-small btn-secondary"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-small btn-secondary"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;