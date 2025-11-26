import React, { useEffect, useState, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { 
  LogOut, ExternalLink, Save, Clock, FileText, 
  Copy, X, Eye, Search, Filter, CheckCircle, 
  LayoutTemplate, Loader2, AlertCircle, 
  Pencil, Maximize2, Wand2, ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import './Dashboard.css';

const LIMIT = 20; // Items per page
const CACHE_KEY = 'dashboard_state';

// --- ROW COMPONENT ---
const ProposalRow = React.memo(({ 
  row, 
  activeRowId, 
  savingMap, 
  onOpenPanel, 
  onInputChange, 
  onSave 
}) => {
  const formatTime = (d) => { 
    try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } 
    catch (e) { return "Just now"; }
  };

  return (
    <tr 
      className={activeRowId === row.id ? 'active-row' : ''}
      onClick={() => onOpenPanel(row)}
      style={{ cursor: 'pointer' }}
    >
      {/* QUERY COLUMN */}
      <td className="query-cell">
        <div className="table-item">
           <div style={{
             fontSize: '11px', color: '#94a3b8', fontWeight: '600', 
             textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px'
           }}>
              <Clock size={10} /> {formatTime(row.created_at)}
           </div>

           <div style={{marginBottom: '6px'}}>
             {row.link ? (
                <a 
                  href={row.link} target="_blank" rel="noreferrer" 
                  style={{color: '#0f172a', fontWeight: '600', fontSize: '15px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'}}
                  className="hover-link"
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.color = '#0f172a'}
                >
                  {row.title} <ExternalLink size={12} style={{color: '#94a3b8'}}/>
                </a>
             ) : (
                <span className="item-title">{row.title}</span>
             )}
           </div>

           <div className="item-desc" title="Click row to view details">
              {row.description}
           </div>
        </div>
      </td>

      {/* PROPOSAL COLUMN */}
      <td>
        {row.proposal ? (
          <div className="table-item">
            <div style={{display:'flex', alignItems:'center', gap: 6, marginBottom: 4}}>
              <span className="item-title" style={{fontSize: '11px', color: '#64748b', textTransform: 'uppercase', margin: 0}}>
                Preview
              </span>
              <Eye size={12} color="#94a3b8"/>
            </div>
            <div className="item-desc">
              {row.proposal}
            </div>
          </div>
        ) : (
          <div style={{padding:'8px', fontSize:13, color:'#94a3b8', fontStyle:'italic'}}>
            Pending...
          </div>
        )}
      </td>

      {/* FEEDBACK COLUMN */}
      <td onClick={(e) => e.stopPropagation()}>
        <textarea 
          value={row.comments || ''} 
          onChange={(e) => onInputChange(row.id, 'comments', e.target.value)} 
          placeholder="Add your feedback here..." 
          rows={3} 
          className="dashboard-input" 
          style={{resize:'vertical', minHeight:'100px', fontSize: '14px', lineHeight: '1.5'}}
        />
      </td>

      {/* APPLIED COLUMN */}
      <td onClick={(e) => e.stopPropagation()}>
        <select 
          value={row.applied || 'no'} 
          onChange={(e) => onInputChange(row.id, 'applied', e.target.value)} 
          className="dashboard-select"
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
          <option value="not_relevant">Not Relevant</option>
        </select>
      </td>

      {/* ACTIONS COLUMN */}
      <td onClick={(e) => e.stopPropagation()}>
        <div className="action-buttons">
          <button onClick={() => onSave(row)} disabled={savingMap[row.id]} className="save-button">
            {savingMap[row.id] ? '...' : <><Save size={16} /> Save</>}
          </button>
        </div>
      </td>
    </tr>
  );
});

// --- MAIN DASHBOARD ---
const Dashboard = () => {
  // Data State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMap, setSavingMap] = useState({});
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0); // NEW: Stores total items
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');

  // Panel State
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null); 
  const [viewMode, setViewMode] = useState('split'); 
  const [panelEditMode, setPanelEditMode] = useState(false);
  const [panelText, setPanelText] = useState('');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const isFirstRun = useRef(true);

  // 1. Initial Load (Check Cache)
  useEffect(() => {
    const restoreState = () => {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData(parsed.data);
          setPage(parsed.page);
          setTotalCount(parsed.totalCount || 0);
          setSearchTerm(parsed.searchTerm || '');
          setDebouncedSearch(parsed.searchTerm || '');
          setTimeFilter(parsed.timeFilter || 'all');
          setLoading(false);
          setTimeout(() => window.scrollTo(0, parsed.scrollTop || 0), 100);
          return true;
        } catch (e) {
          sessionStorage.removeItem(CACHE_KEY);
        }
      }
      return false;
    };

    const loadedFromCache = restoreState();
    if (!loadedFromCache) {
      // Fetch both data and count on initial load
      fetchData(1, '', 'all'); 
      fetchCount('', 'all');
    }
    isFirstRun.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Persist State
  useEffect(() => {
    if (!loading && data.length > 0) {
      const stateToSave = {
        data,
        page,
        totalCount,
        searchTerm,
        timeFilter,
        scrollTop: window.scrollY
      };
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(stateToSave));
    }
  }, [data, page, totalCount, loading, searchTerm, timeFilter]);

  // 3. Debounce Search
  useEffect(() => {
    if (isFirstRun.current) return;
    const timer = setTimeout(() => {
      if (debouncedSearch !== searchTerm) {
        setDebouncedSearch(searchTerm);
        handleFilterChange(searchTerm, timeFilter);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Wrapper to handle Filter/Search changes (Resets Page & Fetches Count)
  const handleFilterChange = (newSearch, newTime) => {
    setPage(1);
    fetchData(1, newSearch, newTime);
    fetchCount(newSearch, newTime); // Re-fetch count because filters changed
  };

  const handleTimeFilterChange = (e) => {
    const newVal = e.target.value;
    setTimeFilter(newVal);
    handleFilterChange(debouncedSearch, newVal);
  };

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // --- API CALLS ---

  const fetchCount = async (searchArg, timeArg) => {
    try {
      let result;
      if (searchArg || timeArg) {
        result = await apiService.get_count(searchArg, timeArg);
      }
      else{
        result = await apiService.get_count(); 
      }
      const count = result.count !== undefined ? result.count : result;
      setTotalCount(Number(count));
    } catch (err) {
      console.error("Count fetch error:", err);
    }
  };

  const fetchData = async (pageNum, searchArg = searchTerm, timeArg = timeFilter, forceRefresh = false) => {
    if (!forceRefresh) setLoading(true);
    try {
      const result = await apiService.getProposals(pageNum, LIMIT, searchArg, timeArg);
      const rows = Array.isArray(result) ? result : (result.data || []);
      
      const uniqueResult = Array.from(new Map(rows.map(item => [item.id, item])).values());
      
      const mappedData = uniqueResult.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        link: item.url || item.link || item.job_link || null,
        proposal: item.proposal_1 || item.proposal_v1 || item.proposal || null,
        created_at: item.created_at || item.created_date_time || new Date().toISOString(), 
        comments: item.comments || '',
        applied: item.applied || 'no'
      }));

      setData(mappedData);
      setPage(pageNum);
    } catch (err) {
      triggerToast("Failed to load proposals.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    sessionStorage.removeItem(CACHE_KEY);
    fetchData(1, searchTerm, timeFilter, false);
    fetchCount(searchTerm, timeFilter);
  };

  const handleInputChange = useCallback((id, field, value) => {
    setData(prevData => prevData.map(row => row.id === id ? { ...row, [field]: value } : row));
  }, []);

  const handleSave = useCallback(async (row) => {
    setSavingMap(prev => ({ ...prev, [row.id]: true }));
    try {
      await apiService.updateProposal(row.id, { comments: row.comments, applied: row.applied });
      triggerToast(`Row updated successfully!`, 'success');
    } catch (err) {
      triggerToast("Failed to update row.", 'error');
    } finally { 
      setSavingMap(prev => ({ ...prev, [row.id]: false })); 
    }
  }, []);

  // --- PAGINATION LOGIC ---
  const handlePageChange = (newPage) => {
    if (newPage !== page && newPage >= 1 && newPage <= Math.ceil(totalCount / LIMIT)) {
      setPage(newPage);
      fetchData(newPage, debouncedSearch, timeFilter);
      window.scrollTo(0, 0);
    }
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalCount / LIMIT);
    if (totalPages <= 1) return null;

    const pages = [];
    // Always show first page
    pages.push(1);

    let startPage, endPage;
    
    // Logic to show a "Window" of pages (e.g., 1 ... 4 5 6 ... 20)
    if (totalPages <= 7) {
      // If few pages, show all
      startPage = 2;
      endPage = totalPages;
    } else {
      // Dynamic window
      if (page <= 4) {
        startPage = 2;
        endPage = 5;
      } else if (page >= totalPages - 3) {
        startPage = totalPages - 4;
        endPage = totalPages - 1;
      } else {
        startPage = page - 1;
        endPage = page + 1;
      }
    }

    if (startPage > 2) pages.push('...');

    for (let i = startPage; i <= endPage; i++) {
      if (i < totalPages) pages.push(i);
    }

    if (endPage < totalPages - 1) pages.push('...');
    
    // Always show last page
    pages.push(totalPages);

    return pages.map((p, index) => {
      if (p === '...') return <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>;
      return (
        <button
          key={p}
          className={`page-number-btn ${p === page ? 'active' : ''}`}
          onClick={() => handlePageChange(p)}
        >
          {p}
        </button>
      );
    });
  };

  // --- PANEL & UTILS ---
  const handleOpenPanel = useCallback((row) => {
    setSelectedRow(row);
    setViewMode('split'); 
    setPanelOpen(true);
    setPanelEditMode(false);
    setPanelText(row.comments || row.proposal || '');
  }, []);

  const handlePanelSave = () => {
    if (selectedRow) {
      setData(prev => prev.map(r => r.id === selectedRow.id ? { ...r, comments: panelText, proposal: panelText } : r));
      setSelectedRow(prev => ({ ...prev, comments: panelText, proposal: panelText }));
      triggerToast('Saved to Feedback column!', 'success');
      setPanelEditMode(false);
    }
  };

  const handleClosePanel = () => setPanelOpen(false);
  
  const copyToClipboard = async (text) => {
    try { await navigator.clipboard.writeText(text); triggerToast('Copied!', 'success'); } 
    catch (err) { console.error(err); }
  };

  // Calculate range for footer text
  const startItem = (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, totalCount);

  return (
    <div className="dashboard-container">
      {/* Toast */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="toast-content">
              <h4 className="toast-title">{toast.type === 'success' ? 'Success' : 'Error'}</h4>
              <p className="toast-message">{toast.message}</p>
            </div>
            <button className="toast-close" onClick={() => setToast({ ...toast, show: false })}><X size={16} /></button>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">ProWiz-Upwork Dashboard</h1>
            <p className="dashboard-subtitle">Review and manage your generated proposals</p>
          </div>

          <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
            <button onClick={() => window.location.href = '/generate'} className="view-btn" style={{background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe'}}><Wand2 size={16}/> Generator</button>
            <button onClick={() => window.location.href = '/search'} className="view-btn" style={{background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe'}}><Search size={16}/> Search Links</button>
            <button onClick={handleRefresh} className="view-btn" title="Refresh Data" disabled={loading} style={{background: '#f8fafc', color: loading ? '#cbd5e1' : '#64748b', border: '1px solid #e2e8f0'}}>
              <RefreshCw size={16} className={loading ? 'spin-anim' : ''} />
            </button>
            <button onClick={() => apiService.logout()} className="logout-button"><LogOut size={18}/> Logout</button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by title or description (Server-side)" 
              className="search-input" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-wrapper">
            <Filter size={18} className="filter-icon" />
            <select className="filter-select" value={timeFilter} onChange={handleTimeFilterChange}>
              <option value="all">All Time</option>
              <option value="1h">Last 1 Hour</option>
              <option value="3h">Last 3 Hours</option>
              <option value="6h">Last 6 Hours</option>
              <option value="12h">Last 12 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Table Area */}
        <div className={`table-card ${panelOpen ? 'shrink' : ''}`}>
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th style={{width: '400px'}}>Query & Details</th>
                  <th style={{width: '300px'}}>Proposal</th>
                  <th style={{width: '400px'}}>Feedback</th>
                  <th style={{width: '150px'}}>Applied</th>
                  <th style={{width: '120px'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">
                      <div className="table-loading-state">
                        <Loader2 size={40} className="loader-spinner" />
                        <p>Fetching data...</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {data.map((row) => (
                      <ProposalRow 
                        key={row.id}
                        row={row}
                        activeRowId={selectedRow?.id}
                        savingMap={savingMap}
                        onOpenPanel={handleOpenPanel}
                        onInputChange={handleInputChange}
                        onSave={handleSave}
                      />
                    ))}
                    
                    {data.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                          <CheckCircle size={48} style={{marginBottom: '16px', opacity: 0.5, display: 'inline-block'}} />
                          <p>No jobs found matching your criteria.</p>
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="pagination-footer">
            <div className="pagination-info">
              {totalCount > 0 
                ? `Showing ${startItem}-${endItem} of ${totalCount} items`
                : 'No items to show'
              }
            </div>
            
            <div className="pagination-controls-wrapper">
              <button 
                className="page-nav-btn" 
                onClick={() => handlePageChange(page - 1)} 
                disabled={page === 1 || loading}
              >
                <ChevronLeft size={16} /> Prev
              </button>

              <div className="pagination-numbers">
                {renderPagination()}
              </div>

              <button 
                className="page-nav-btn" 
                onClick={() => handlePageChange(page + 1)} 
                disabled={page >= Math.ceil(totalCount / LIMIT) || loading}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- SIDE PANEL (Unchanged) --- */}
      <div className={`side-panel-overlay ${panelOpen ? 'open' : ''}`} onClick={handleClosePanel}></div>
      <div className={`side-panel ${panelOpen ? 'open' : ''}`}>
        {selectedRow && (
          <>
            <div className="panel-header">
              <div style={{display:'flex', alignItems:'center'}}>
                <h3 className="panel-title" style={{marginRight: '20px'}}>Review</h3>
                <div className="panel-controls">
                  <button className={`view-btn ${viewMode === 'job' ? 'active' : ''}`} onClick={() => setViewMode('job')}><FileText size={14} /> Job</button>
                  <button className={`view-btn ${viewMode === 'proposal' ? 'active' : ''}`} onClick={() => setViewMode('proposal')}><Maximize2 size={14} /> Proposal</button>
                  <button className={`view-btn ${viewMode === 'split' ? 'active' : ''}`} onClick={() => setViewMode('split')}><LayoutTemplate size={14} /> Split</button>
                </div>
              </div>
              <button className="panel-close-btn" onClick={handleClosePanel}><X size={24} /></button>
            </div>

            <div className="panel-content">
              {viewMode === 'job' && (
                <div className="panel-column full-width">
                   <div className="column-header"><span>Job Description</span></div>
                   <h4 className="panel-job-title">{selectedRow.title}</h4>
                   <p className="panel-text">{selectedRow.description}</p>
                </div>
              )}

              {viewMode === 'proposal' && (
                <div className="panel-column full-width">
                   <div style={{height: '100%', width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column'}}>
                      <div className="column-header" style={{justifyContent:'space-between'}}>
                         <div style={{display:'flex', gap:8, alignItems:'center'}}>
                           <span>Proposal Draft</span>
                           {panelEditMode && <span style={{fontSize:'10px', background:'#dbeafe', color:'#1e40af', padding:'2px 6px', borderRadius:'4px'}}>Editing</span>}
                           {(!panelEditMode && selectedRow.comments && selectedRow.comments !== selectedRow.proposal) && (
                             <span style={{fontSize:'10px', background:'#dcfce7', color:'#166534', padding:'2px 6px', borderRadius:'4px'}}>Using Feedback Version</span>
                           )}
                         </div>
                         <div style={{display:'flex', gap: 8}}>
                           {panelEditMode ? (
                             <button className="save-button" style={{padding:'6px 12px', fontSize:12, width:'auto'}} onClick={handlePanelSave}>Save</button>
                           ) : (
                             <>
                               <button className="copy-btn" onClick={() => setPanelEditMode(true)}><Pencil size={14}/> Edit</button>
                               <button className="copy-btn" onClick={() => copyToClipboard(panelText)}><Copy size={14} /> Copy</button>
                             </>
                           )}
                         </div>
                      </div>
                      {panelEditMode ? (
                        <textarea value={panelText} onChange={(e) => setPanelText(e.target.value)} style={{flex: 1, width:'100%', padding:'16px', border:'1px solid #e2e8f0', borderRadius:'8px', resize:'none', fontFamily:'inherit', lineHeight: 1.6}} />
                      ) : (
                        <div className="panel-text">{selectedRow.comments || selectedRow.proposal}</div>
                      )}
                   </div>
                </div>
              )}

              {viewMode === 'split' && (
                <>
                  <div className="panel-column left">
                    <div className="column-header"><span>Job Description</span></div>
                    <h4 className="panel-job-title">{selectedRow.title}</h4>
                    <p className="panel-text" style={{marginTop:'12px'}}>{selectedRow.description}</p>
                  </div>
                  <div className="panel-column right">
                    <div style={{height: '100%', width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column'}}>
                        <div className="column-header" style={{justifyContent:'space-between'}}>
                           <div style={{display:'flex', gap:8, alignItems:'center'}}>
                             <span>Generated Proposal</span>
                             {panelEditMode && <span style={{fontSize:'10px', background:'#dbeafe', color:'#1e40af', padding:'2px 6px', borderRadius:'4px'}}>Editing</span>}
                           </div>
                           <div style={{display:'flex', gap: 8}}>
                             {panelEditMode ? (
                               <button className="save-button" style={{padding:'4px 8px', fontSize:11, width:'auto'}} onClick={handlePanelSave}>Save</button>
                             ) : (
                               <>
                                 <button className="copy-btn" style={{padding:'4px 8px', fontSize:11}} onClick={() => setPanelEditMode(true)}><Pencil size={12}/> Edit</button>
                                 <button className="copy-btn" style={{padding:'4px 8px', fontSize:11}} onClick={() => copyToClipboard(panelText)}>Copy</button>
                               </>
                             )}
                           </div>
                        </div>
                        {panelEditMode ? (
                          <textarea value={panelText} onChange={(e) => setPanelText(e.target.value)} style={{flex: 1, width:'100%', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', resize:'none', fontFamily:'inherit', lineHeight: 1.6}} />
                        ) : (
                          <div className="panel-text">{selectedRow.comments || selectedRow.proposal}</div>
                        )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;