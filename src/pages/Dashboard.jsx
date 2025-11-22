// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { formatDistanceToNow, subDays, subHours } from 'date-fns';
import { 
  LogOut, ExternalLink, Save, Clock, FileText, 
  Copy, X, Eye, Search, Filter, CheckCircle, 
  LayoutTemplate, Loader2, AlertCircle, Check, 
  Pencil, Maximize2 
} from 'lucide-react';
import './Dashboard.css';

// --- OPTIMIZED ROW COMPONENT ---
const ProposalRow = React.memo(({ 
  row, 
  activeRowId, 
  savingMap, 
  onOpenModal, 
  onOpenPanel, 
  onInputChange, 
  onSave 
}) => {
  
  const formatTime = (d) => { 
    try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } 
    catch (e) { return "Just now"; }
  };

  return (
    <tr className={activeRowId === row.id ? 'active-row' : ''}>
      
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
                  onMouseEnter={(e) => e.target.style.color = '#2563eb'}
                  onMouseLeave={(e) => e.target.style.color = '#0f172a'}
                >
                  {row.title} <ExternalLink size={12} style={{color: '#94a3b8'}}/>
                </a>
             ) : (
                <span className="item-title">{row.title}</span>
             )}
           </div>

           <div 
             className="item-desc" 
             onClick={() => onOpenModal(row.id, row.title, row.description, false)}
             style={{cursor: 'pointer'}}
             title="Click to view full description"
           >
              {row.description}
           </div>
        </div>
      </td>

      {/* PROPOSAL COLUMN */}
      <td>
        {row.proposal ? (
          <div className="table-item">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 4}}>
              <span className="item-title" style={{fontSize: '11px', color: '#64748b', textTransform: 'uppercase'}}>
                Preview
              </span>
              <div style={{display:'flex', gap: 8}}>
                <button 
                  onClick={() => onOpenModal(row.id, 'Generated Proposal', row.proposal, true, false)}
                  style={{border:'none', background:'transparent', cursor:'pointer', padding:0}}
                  title="View Full"
                >
                  <Eye size={14} color="#94a3b8"/>
                </button>
                <button 
                  onClick={() => onOpenModal(row.id, 'Edit Proposal', row.proposal, true, true)} 
                  style={{border:'none', background:'transparent', cursor:'pointer', padding:0}}
                  title="Edit & Copy to Feedback"
                >
                  <Pencil size={14} color="#2563eb"/>
                </button>
              </div>
            </div>
            <div 
              className="item-desc" 
              onClick={() => onOpenModal(row.id, 'Generated Proposal', row.proposal, true, false)}
            >
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
      <td>
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
      <td>
        <select 
          value={row.applied || 'no'} 
          onChange={(e) => onInputChange(row.id, 'applied', e.target.value)} 
          className="dashboard-select"
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </td>

      {/* ACTIONS COLUMN */}
      <td>
        <div className="action-buttons">
          <button onClick={() => onSave(row)} disabled={savingMap[row.id]} className="save-button">
            {savingMap[row.id] ? '...' : <><Save size={16} /> Save</>}
          </button>
          
          {row.proposal && (
            <button className="compare-btn" onClick={() => onOpenPanel(row)}>
              <LayoutTemplate size={14} /> Review
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

// --- MAIN COMPONENT ---
const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingMap, setSavingMap] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');

  // Panel State
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null); 
  const [viewMode, setViewMode] = useState('split'); 
  
  // Panel Edit State
  const [panelEditMode, setPanelEditMode] = useState(false);
  const [panelText, setPanelText] = useState('');

  // Modal State
  const [modal, setModal] = useState({ 
    open: false, rowId: null, title: '', content: '', showCopy: false, isEditing: false 
  });
  const [editedContent, setEditedContent] = useState('');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => { fetchData(); }, []);

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const fetchData = async () => {
    try {
      const result = await apiService.getProposals();
      const mappedData = result.map(item => ({
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
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(row => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      (row.title && row.title.toLowerCase().includes(term)) ||
      (row.description && row.description.toLowerCase().includes(term)) ||
      (row.id && row.id.toString().toLowerCase().includes(term));

    let matchesTime = true;
    if (timeFilter !== 'all') {
      const rowDate = new Date(row.created_at);
      const now = new Date();
      if (!isNaN(rowDate.getTime())) {
        if (timeFilter === '1h') matchesTime = rowDate >= subHours(now, 1);
        else if(timeFilter === '3h') matchesTime = rowDate >= subHours(now, 3);
        else if (timeFilter === '6h') matchesTime = rowDate >= subHours(now, 6);
        else if (timeFilter === '12h') matchesTime = rowDate >= subHours(now, 12);
        else if (timeFilter === '24h') matchesTime = rowDate >= subHours(now, 24);
        else if (timeFilter === '7d') matchesTime = rowDate >= subDays(now, 7);
      }
    }
    return matchesSearch && matchesTime;
  });

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

  // --- MODAL LOGIC ---
  const openModal = useCallback((rowId, title, content, showCopy = false, isEditing = false) => {
    setModal({ open: true, rowId, title, content, showCopy, isEditing });
    setEditedContent(content);
  }, []);

  const saveEditedContentToFeedback = () => {
    if (modal.rowId) {
      // Updates BOTH feedback and the proposal text in the table
      setData(prevData => prevData.map(row => 
        row.id === modal.rowId 
          ? { ...row, comments: editedContent, proposal: editedContent } 
          : row
      ));
      triggerToast('Updated Feedback & Proposal View!', 'success');
      setModal(prev => ({ ...prev, open: false }));
    }
  };

  // --- SIDE PANEL LOGIC ---
  const handleOpenPanel = useCallback((row) => {
    setSelectedRow(row);
    setViewMode('split'); 
    setPanelOpen(true);
    setPanelEditMode(false);
    setPanelText(row.proposal || '');
  }, []);

  // FIX: Updates both Data and SelectedRow state so panel reflects changes instantly
  const handlePanelSave = () => {
    if (selectedRow) {
      // 1. Update Global Data (Table)
      setData(prevData => prevData.map(row => 
        row.id === selectedRow.id 
          ? { ...row, comments: panelText, proposal: panelText } 
          : row
      ));

      // 2. Update Local Panel State (Panel View)
      setSelectedRow(prev => ({ ...prev, comments: panelText, proposal: panelText }));

      triggerToast('Proposal updated and saved to Feedback!', 'success');
      setPanelEditMode(false);
    }
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
  };

  const copyToClipboard = async (text) => {
    try { 
      await navigator.clipboard.writeText(text); 
      triggerToast('Copied to clipboard!', 'success');
    } catch (err) { console.error('Failed to copy:', err); }
  };

  if (loading) return (
    <div className="loading-container">
      <Loader2 size={48} className="loader-spinner" />
      <p className="loading-text">Fetching proposals...</p>
    </div>
  );

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
          <button onClick={() => apiService.logout()} className="logout-button"><LogOut size={18}/> Logout</button>
        </header>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" placeholder="Search by ID, title, or description..." className="search-input" 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-wrapper">
            <Filter size={18} className="filter-icon" />
            <select className="filter-select" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
              <option value="all">All Time</option>
              <option value="1h">Last 1 Hour</option>
              <option value="3h">Last 3 Hours</option>
              <option value="6h">Last 6 Hours</option>
              <option value="12h">Last 12 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
        </div>

        {/* Table */}
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
                {filteredData.map((row) => (
                  <ProposalRow 
                    key={row.id}
                    row={row}
                    activeRowId={selectedRow?.id || modal.rowId}
                    savingMap={savingMap}
                    onOpenModal={openModal}
                    onOpenPanel={handleOpenPanel}
                    onInputChange={handleInputChange}
                    onSave={handleSave}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAL (Quick View & Edit) --- */}
      {modal.open && (
        <div className="modal-overlay" onClick={() => setModal({ ...modal, open: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{width: '700px'}}>
            <div className="modal-header">
              <div style={{display:'flex', alignItems:'center', gap: 10}}>
                <h3 className="modal-title">{modal.title}</h3>
                {modal.isEditing && <span style={{fontSize:'12px', background:'#dbeafe', color:'#1e40af', padding:'2px 8px', borderRadius:'4px'}}>Editing Mode</span>}
              </div>
              <button className="modal-close" onClick={() => setModal({ ...modal, open: false })}><X size={24} /></button>
            </div>
            
            <div className="modal-body">
              {modal.isEditing ? (
                <textarea 
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  style={{width: '100%', height: '400px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6', resize: 'none'}}
                  placeholder="Edit proposal here..."
                />
              ) : (
                <div style={{whiteSpace: 'pre-wrap'}}>{modal.content}</div>
              )}
            </div>

            <div className="modal-footer" style={{justifyContent: 'space-between'}}>
              <div style={{fontSize:'12px', color:'#64748b'}}>{modal.isEditing ? "Changes update Proposal text & Feedback." : ""}</div>
              <div style={{display:'flex', gap: 10}}>
                {modal.isEditing ? (
                  <button className="save-button" style={{width:'auto', padding:'10px 20px'}} onClick={saveEditedContentToFeedback}>
                    <Check size={16} /> Save Changes
                  </button>
                ) : (
                  modal.showCopy && (
                    <>
                      <button className="copy-btn" onClick={() => setModal(prev => ({...prev, isEditing: true, title: 'Edit Proposal'}))} style={{marginRight:'auto'}}>
                        <Pencil size={16} /> Edit
                      </button>
                      <button className="copy-btn" onClick={() => copyToClipboard(modal.content)}>
                        <Copy size={16} /> Copy Text
                      </button>
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SIDE PANEL (Review & Edit) --- */}
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
              {/* VIEW: JOB ONLY */}
              {viewMode === 'job' && (
                <div className="panel-column full-width">
                   <div className="container-limit">
                      <div className="column-header"><span>Job Description</span></div>
                      <h4 className="panel-job-title" style={{fontSize: '20px', marginBottom: '16px'}}>{selectedRow.title}</h4>
                      <p className="panel-text">{selectedRow.description}</p>
                   </div>
                </div>
              )}

              {/* VIEW: PROPOSAL ONLY */}
              {viewMode === 'proposal' && (
                <div className="panel-column full-width">
                   <div className="container-limit">
                      <div className="column-header" style={{justifyContent:'space-between'}}>
                         <div style={{display:'flex', gap:8, alignItems:'center'}}>
                           <span>Generated Proposal</span>
                           {/* {panelEditMode && <span style={{fontSize:'10px', background:'#dbeafe', color:'#1e40af', padding:'2px 6px', borderRadius:'4px'}}>Editing</span>} */}
                         </div>
                         
                         <div style={{display:'flex', gap: 8}}>
                             <>
                               <button className="copy-btn" onClick={() => copyToClipboard(panelText)}><Copy size={14} /> Copy</button>
                             </>
                           
                         </div>
                      </div>
                      <div className="panel-text">{selectedRow.proposal}</div>
                   </div>
                </div>
              )}

              {/* VIEW: SPLIT (JOB + PROPOSAL) */}
              {viewMode === 'split' && (
                <>
                  {/* Left: Job */}
                  <div className="panel-column left">
                    <div className="column-header"><span>Job Description</span></div>
                    <h4 className="panel-job-title">{selectedRow.title}</h4>
                    <p className="panel-text" style={{marginTop:'12px'}}>{selectedRow.description}</p>
                  </div>

                  {/* Right: Proposal (Editable) */}
                  <div className="panel-column right">
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
                      <textarea 
                        value={panelText} onChange={(e) => setPanelText(e.target.value)}
                        style={{width:'100%', height:'100%', minHeight:'300px', padding:'12px', border:'1px solid #e2e8f0', borderRadius:'8px', resize:'none', fontFamily:'inherit', lineHeight: 1.6}}
                      />
                    ) : (
                      <div className="panel-text">{selectedRow.proposal}</div>
                    )}
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