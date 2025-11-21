// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { formatDistanceToNow, subHours, subDays } from 'date-fns';
import { 
  LogOut, 
  ExternalLink, 
  Save, 
  Clock, 
  FileText, 
  MessageSquare, 
  Copy, 
  X, 
  Eye, 
  Search, 
  Filter,
  CheckCircle
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingMap, setSavingMap] = useState({});
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', '24h', '7d', '30d'

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [currentProposal, setCurrentProposal] = useState({ title: '', content: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await apiService.getProposals();
      console.log(result)
      
      // --- DATA MAPPING ---
      // Maps backend fields (url, proposal_1) to frontend state
      const mappedData = result.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        link: item.url, 
        proposal_v1: item.proposal_1, 
        proposal_v2: item.proposal_2, 
        proposal_v3: item.proposal_3, 
        created_at: item.created_date_time, 
        comments: item.comments || '',
        applied: item.applied || 'no'
      }));

      setData(mappedData);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load proposals.");
    } finally {
      setLoading(false);
    }
  };

  // --- FILTER LOGIC ---
  const filteredData = data.filter(row => {
    // 1. Search Logic (Title & Description)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (row.title && row.title.toLowerCase().includes(searchLower)) ||
      (row.description && row.description.toLowerCase().includes(searchLower));

    // 2. Time Filter Logic
    let matchesTime = true;
    if (timeFilter !== 'all') {
      const rowDate = new Date(row.created_at);
      const now = new Date();
      
      if (timeFilter === '1h') {
        matchesTime = rowDate >= subHours(now, 1);
      } else if (timeFilter === '3h') {
        matchesTime = rowDate >= subHours(now, 3);
      } else if (timeFilter === '6h') {
        matchesTime = rowDate >= subHours(now, 6);
      }
      else if (timeFilter === '12h') {
        matchesTime = rowDate >= subHours(now, 12);
      }
      else if (timeFilter === '24h') {
        matchesTime = rowDate >= subHours(now, 24);
      } else if (timeFilter === '7d') {
        matchesTime = rowDate >= subDays(now, 7);
      } else if (timeFilter === '30d') {
        matchesTime = rowDate >= subDays(now, 30);
      }
    }

    return matchesSearch && matchesTime;
  });

  const handleInputChange = (id, field, value) => {
    setData(prevData => 
      prevData.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSave = async (row) => {
    setSavingMap(prev => ({ ...prev, [row.id]: true }));
    try {
      await apiService.updateProposal(row.id, {
        comments: row.comments,
        applied: row.applied
      });
      
      alert(`Success! Row ${row.id} updated.`);
      
      // // Remove from view if status changes from 'no' (optional)
      // if (row.applied !== 'no') {
      //   setData(prev => prev.filter(item => item.id !== row.id));
      // }
    } catch (err) {
      alert("Failed to update row.");
    } finally {
      setSavingMap(prev => ({ ...prev, [row.id]: false }));
    }
  };

  const openProposalModal = (version, content) => {
    setCurrentProposal({ title: version, content: content || '' });
    setModalOpen(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentProposal.content);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "Just now";
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <div className="dashboard-background"></div>
        <div style={{color: 'white', zIndex: 10}}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-background"></div>
      <div className="dashboard-blur-left"></div>
      <div className="dashboard-blur-right"></div>

      <div className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">ProWiz-Upwork Dashboard</h1>
            <p className="dashboard-subtitle">Review and manage your generated proposals</p>
          </div>
          <button onClick={() => apiService.logout()} className="logout-button">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </header>

        {error && (
          <div style={{background: 'rgba(239,68,68,0.2)', color: '#fca5a5', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(239,68,68,0.5)'}}>
            {error}
          </div>
        )}

        {/* Toolbar: Search & Filter */}
        <div className="toolbar">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by job title or description..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-wrapper">
            <Filter size={18} className="filter-icon" />
            <select 
              className="filter-select"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
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

        <div className="table-card">
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th style={{width: '50px'}}>ID</th>
                  <th style={{width: '100px'}}>
                    <div style={{display:'flex', gap: 6, alignItems:'center'}}>
                      <Clock size={14}/> Posted
                    </div>
                  </th>
                  <th style={{width: '300px'}}>
                    <div style={{display:'flex', gap: 6, alignItems:'center'}}>
                      <FileText size={14}/> Query
                    </div>
                  </th>
                  <th style={{width: '100px'}}>Link</th>
                  <th style={{width: '200px'}}>Proposals</th>
                  <th style={{width: '250px'}}>
                     <div style={{display:'flex', gap: 6, alignItems:'center'}}>
                      <MessageSquare size={14}/> Feedback
                    </div>
                  </th>
                  <th style={{width: '150px'}}>Applied</th>
                  <th style={{width: '100px'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr key={row.id}>
                    <td style={{fontWeight: 'bold', color: '#94a3b8'}}>#{row.id}</td>
                    
                    <td style={{whiteSpace: 'nowrap', color: '#94a3b8'}}>
                      {formatTime(row.created_at)}
                    </td>
                    
                    <td className="query-cell">
                      <span className="query-title">{row.title}</span>
                      <span className="query-desc">
                        {row.description}
                      </span>
                    </td>

                    <td>
                      {row.link ? (
                        <a 
                          href={row.link} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="link-button"
                        >
                          Open Job <ExternalLink size={14} />
                        </a>
                      ) : (
                        <span style={{color: '#64748b', fontSize: '12px'}}>No Link</span>
                      )}
                    </td>

                    <td>
                      {/* Logic to handle null/missing proposals */}
                      {row.proposal_v1 ? (
                        <button 
                          className="proposal-btn"
                          onClick={() => openProposalModal('Proposal Version 1', row.proposal_v1)}
                        >
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <span>Proposal 1</span>
                            <Eye size={14} />
                          </div>
                        </button>
                      ) : (
                         <div style={{fontSize: '12px', color: '#64748b', marginBottom: 5, paddingLeft: 4}}>No Proposal</div>
                      )}
                      
                      {row.proposal_v2 && (
                        <button 
                          className="proposal-btn"
                          onClick={() => openProposalModal('Proposal Version 2', row.proposal_v2)}
                        >
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <span>Proposal 2</span>
                            <Eye size={14} />
                          </div>
                        </button>
                      )}
                      {/* Handle V3 if your data has it */}
                      {row.proposal_v3 && (
                        <button 
                          className="proposal-btn"
                          onClick={() => openProposalModal('Proposal Version 3', row.proposal_v3)}
                        >
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <span>Proposal 3</span>
                            <Eye size={14} />
                          </div>
                        </button>
                      )}
                    </td>

                    <td>
                      <textarea
                        value={row.comments || ''}
                        onChange={(e) => handleInputChange(row.id, 'comments', e.target.value)}
                        placeholder="Add feedback..."
                        rows={3}
                        className="dashboard-input"
                        style={{resize: 'vertical', minHeight: '80px'}}
                      />
                    </td>

                    <td>
                      <select
                        value={row.applied || 'no'}
                        onChange={(e) => handleInputChange(row.id, 'applied', e.target.value)}
                        className="dashboard-select"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </td>

                    <td>
                      <button
                        onClick={() => handleSave(row)}
                        disabled={savingMap[row.id]}
                        className="save-button"
                      >
                        {savingMap[row.id] ? (
                          <span style={{fontSize: '12px'}}>...</span>
                        ) : (
                          <>
                            <Save size={16} /> Save
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>
                      <CheckCircle size={48} style={{marginBottom: '16px', opacity: 0.5, display: 'inline-block'}} />
                      <p>No jobs found matching your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- MODAL COMPONENT --- */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{currentProposal.title}</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {currentProposal.content}
            </div>
            <div className="modal-footer">
              <button className="copy-btn" onClick={copyToClipboard}>
                <Copy size={16} /> Copy Text
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;