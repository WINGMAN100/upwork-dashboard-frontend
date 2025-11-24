// src/pages/JobSearch.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { LogOut, ArrowLeft, Search, ExternalLink, CheckCircle } from 'lucide-react';
import './Dashboard.css';

const JobSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await apiService.searchJobLinks(query);
      // Assuming response is an array of objects { title, link, snippet, source }
      // If response is { data: [...] }, adjust accordingly.
      setResults(Array.isArray(response) ? response : []); 
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
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
                placeholder="Search for links for your projects (e.g. AWS, Looker) ..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="save-button" style={{ width: 'auto', padding: '0 32px' }} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        <div style={{textAlign: 'center', marginBottom: '16px', color: '#64748b'}}>
          <h2>This Page is under construction</h2>
          <p>More features will be added soon!</p>
        </div>

        {/* Results Table
        <div className="table-card">
          <div className="table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th style={{width: '60px'}}>#</th>
                  <th style={{width: '40%'}}>Job Title & Link</th>
                  <th>Description Snippet</th>
                  <th style={{width: '120px'}}>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, index) => (
                  <tr key={index}>
                    <td style={{fontWeight: 'bold', color: '#64748b'}}>{index + 1}</td>
                    <td className="query-cell">
                      <div className="table-item">
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="item-title hover-link"
                          style={{color: '#2563eb', textDecoration: 'none'}}
                        >
                          {item.title} <ExternalLink size={12} />
                        </a>
                        <span style={{fontSize:'12px', color:'#94a3b8'}}>{item.source || 'Web Source'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="item-desc">{item.snippet || item.description || 'No description available.'}</div>
                    </td>
                    <td>
                      <a href={item.link} target="_blank" rel="noreferrer" className="link-button">
                        Visit Site
                      </a>
                    </td>
                  </tr>
                ))}

                {!loading && hasSearched && results.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                      <CheckCircle size={48} style={{marginBottom: '16px', opacity: 0.5, display: 'inline-block'}} />
                      <p>No results found for "{query}"</p>
                    </td>
                  </tr>
                )}

                {!hasSearched && (
                   <tr>
                   <td colSpan="4" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
                     <p>Enter a keyword above to search for jobs.</p>
                   </td>
                 </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>  */}

      </div>
    </div>
  );
};

export default JobSearch;