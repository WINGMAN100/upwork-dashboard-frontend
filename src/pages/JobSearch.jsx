// src/pages/JobSearch.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatorService } from '../services/generator'; 
import { apiService } from '../services/api'; 
import { 
  LogOut, ArrowLeft, Search, ExternalLink, CheckCircle, 
  Copy, Check, Loader2, AlertCircle, X 
} from 'lucide-react';
import './Dashboard.css';

const JobSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
        triggerToast("Please enter a search term", "error");
        return;
    }

    setLoading(true);
    setHasSearched(true);
    setResults([]); 

    try {
      const response = await generatorService.searchJobLinks(query);
      const data = Array.isArray(response) ? response : [];
      setResults(data);
      
      if (data.length === 0) {
        triggerToast("No results found", "error");
      } else {
        triggerToast(`Found ${data.length} results`, "success");
      }
    } catch (error) {
      console.error(error);
      triggerToast("Failed to fetch jobs. Please try again.", "error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (link, index) => {
    navigator.clipboard.writeText(link);
    setCopiedIndex(index);
    triggerToast("Link copied to clipboard!", "success");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="dashboard-container">
      
      {/* --- Toast Component --- */}
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
          <div style={{display:'flex', alignItems:'center', gap: 16}}>
            <button onClick={() => navigate('/dashboard')} className="view-btn">
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <h1 className="dashboard-title">Link Search</h1>
          </div>
          <button onClick={() => apiService.logout()} className="logout-button">
            <LogOut size={18}/> Logout
          </button>
        </header>

        {/* Search Section */}
        <div className="table-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px' }}>
            <div className="search-wrapper" style={{ flex: 1, maxWidth: '100%' }}>
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                className="search-input"
                placeholder="Search for links (e.g. AWS, Looker, PowerBI) ..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="save-button" style={{ width: 'auto', padding: '0 32px' }} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Results Table */}
        <div className="table-card">
          {/* Loading State Overlay */}
          {loading ? (
             <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={48} className="loader-spinner" />
                <p className="loading-text" style={{marginTop: 16}}>Searching for relevant links...</p>
             </div>
          ) : (
            <div className="table-container">
                <table className="glass-table">
                <thead>
                    <tr>
                    <th style={{width: '50px'}}>#</th>
                    <th style={{width: '300px'}}>Link & Action</th>
                    <th style={{width: '400px'}}>Description & Scenario</th>
                    <th style={{width: '250px'}}>Technologies</th>
                    </tr>
                </thead>
                <tbody>
                    {results.map((item, index) => (
                    <tr key={index}>
                        <td style={{fontWeight: 'bold', color: '#64748b'}}>{index + 1}</td>
                        
                        {/* LINK & COPY COLUMN (Merged) */}
                        <td className="query-cell">
                        <div className="table-item">
                            <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="item-title hover-link"
                            style={{color: '#2563eb', textDecoration: 'none', wordBreak: 'break-all', marginBottom:'8px', display:'block'}}
                            >
                            {item.link} <ExternalLink size={12} />
                            </a>
                            
                            {/* Copy Button moved here */}
                            <button 
                                className="copy-btn" 
                                onClick={() => handleCopyLink(item.link, index)}
                                style={{width: 'fit-content', padding: '4px 12px', fontSize:'11px'}}
                            >
                                {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />} 
                                {copiedIndex === index ? 'Copied' : 'Copy Link'}
                            </button>
                        </div>
                        </td>

                        {/* DESCRIPTION + SCENARIO COLUMN */}
                        <td>
                        <div className="table-item">
                            <div>
                                <span style={{fontWeight:600, fontSize:'13px', color:'#0f172a'}}>Description: </span>
                                <span className="item-desc" style={{display:'inline'}}>{item.description}</span>
                            </div>
                            <div style={{marginTop:'8px'}}>
                                <span style={{fontWeight:600, fontSize:'13px', color:'#0f172a'}}>Usage: </span>
                                <span className="item-desc" style={{display:'inline', color:'#475569'}}>{item.usage_scenario}</span>
                            </div>
                        </div>
                        </td>

                        {/* TECHNOLOGIES COLUMN */}
                        <td>
                            <div style={{display:'flex', flexWrap:'wrap', gap:'6px'}}>
                                {item.technologies && item.technologies.map((tech, i) => (
                                    <span key={i} style={{
                                        fontSize:'11px', 
                                        background:'#f1f5f9', 
                                        color:'#475569', 
                                        padding:'4px 8px', 
                                        borderRadius:'12px',
                                        border:'1px solid #e2e8f0'
                                    }}>
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </td>
                    </tr>
                    ))}

                    {!loading && hasSearched && results.length === 0 && (
                    <tr>
                        <td colSpan="4" style={{textAlign: 'center', padding: '60px', color: '#64748b'}}>
                        <CheckCircle size={48} style={{marginBottom: '16px', opacity: 0.5, display: 'inline-block'}} />
                        <p>No results found for "{query}"</p>
                        </td>
                    </tr>
                    )}

                    {!hasSearched && (
                    <tr>
                    <td colSpan="4" style={{textAlign: 'center', padding: '60px', color: '#64748b'}}>
                        <p>Enter a keyword above to search for project links.</p>
                    </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default JobSearch;