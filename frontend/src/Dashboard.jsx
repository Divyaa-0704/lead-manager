import { useCallback, useEffect, useState } from 'react';
import { getLeads, getStats, createLead, updateLead, deleteLead } from './api';
import StatsBar from './components/StatsBar';
import SearchBar from './components/SearchBar';
import LeadTable from './components/LeadTable';
import Pagination from './components/Pagination';
import LeadForm from './components/LeadForm';
import ConfirmDialog from './components/ConfirmDialog';

const PAGE_SIZE = 10;

function Dashboard({ user, onLogout }) {
  const isManager = user.role === 'manager';

  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, total: 0 });
  const [stats, setStats] = useState(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formState, setFormState] = useState({ open: false, lead: null });
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // If the login has expired, go back to the login page. Otherwise show the message.
  const handleError = useCallback(
    (err) => {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setError(err.message);
    },
    [onLogout]
  );

  // Wait until the user stops typing before searching
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadLeads = useCallback(async () => {
    try {
      const result = await getLeads({
        search: debouncedSearch,
        status,
        sortBy,
        order,
        page,
        limit: PAGE_SIZE,
      });
      if (result.data.length === 0 && page > 1) {
        setPage(Math.max(result.pagination.totalPages, 1));
        return;
      }
      setLeads(result.data);
      setPagination(result.pagination);
      setError('');
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, sortBy, order, page, handleError]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await getStats());
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  function handleStatusChange(value) {
    setStatus(value);
    setPage(1);
  }

  function handleSort(key) {
    if (sortBy === key) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setOrder('asc');
    }
    setPage(1);
  }

  async function handleSave(values) {
    if (formState.lead) {
      await updateLead(formState.lead.id, values);
    } else {
      await createLead(values);
    }
    setFormState({ open: false, lead: null });
    loadLeads();
    loadStats();
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await deleteLead(leadToDelete.id);
      setLeadToDelete(null);
      loadLeads();
      loadStats();
    } catch (err) {
      handleError(err);
      setLeadToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = Boolean(debouncedSearch || status);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Lead Manager</h1>
        <div className="header-actions">
          <span className="user-info">
            {user.name} <span className="role-tag">{user.role}</span>
          </span>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => setFormState({ open: true, lead: null })}
          >
            + Add Lead
          </button>
          <button type="button" className="btn btn-outline" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner" role="alert">
            {error}
            <button type="button" className="btn btn-small btn-secondary" onClick={loadLeads}>
              Retry
            </button>
          </div>
        )}

        <StatsBar stats={stats} />

        <SearchBar
          search={search}
          status={status}
          onSearchChange={setSearch}
          onStatusChange={handleStatusChange}
        />

        {loading ? (
          <p className="empty-state">Loading leads...</p>
        ) : leads.length === 0 ? (
          <p className="empty-state">
            {hasFilters ? 'No leads match your search.' : 'No leads yet. Click "+ Add Lead" to create one.'}
          </p>
        ) : (
          <>
            <LeadTable
              leads={leads}
              showOwner={isManager}
              sortBy={sortBy}
              order={order}
              onSort={handleSort}
              onEdit={(lead) => setFormState({ open: true, lead })}
              onDelete={setLeadToDelete}
            />
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </main>

      {formState.open && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="dialog">
            <LeadForm
              lead={formState.lead}
              onSubmit={handleSave}
              onCancel={() => setFormState({ open: false, lead: null })}
            />
          </div>
        </div>
      )}

      {leadToDelete && (
        <ConfirmDialog
          title="Delete lead?"
          message={`Are you sure you want to delete ${leadToDelete.name}? This cannot be undone.`}
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setLeadToDelete(null)}
        />
      )}
    </div>
  );
}

export default Dashboard;