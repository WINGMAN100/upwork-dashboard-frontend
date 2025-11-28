import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatorService } from '../services/generator';
import { apiService } from '../services/api';
import { 
  ArrowLeft, Settings, Save, LogOut,
  X, CheckCircle, AlertCircle, Loader2, MousePointerClick, 
  RefreshCw, List, Globe, Plus, Info // Ensure Info is imported
} from 'lucide-react';
import './Config.css';
import './Dashboard.css'; 

// --- UPDATED TAG EDITOR WITH INFO TOOLTIP ---
const TagEditor = ({ title, items, onAdd, onRemove, description }) => {
  const [input, setInput] = useState('');
  
  const safeItems = items || []; 
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        onAdd(input.trim());
        setInput('');
      }
    }
  };

  return (
    <div className="tag-editor-card">
      <div className="tag-header">
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <span className="tag-title">{title}</span>
          {/* Tooltip Wrapper */}
          {description && (
            <div className="card-info-wrapper">
              <Info size={14} className="card-info-icon" />
              <div className="card-tooltip">{description}</div>
            </div>
          )}
        </div>
        <span className="tag-count">{safeItems.length}</span>
      </div>
      <div className="tag-input-wrapper">
        <Plus size={14} className="input-icon" />
        <input 
          type="text" 
          className="tag-input" 
          placeholder="Add new... (Press Enter)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="tag-list">
        {safeItems.map((item, idx) => (
          <span key={`${item}-${idx}`} className="tag-chip">
            {item}
            <button onClick={() => onRemove(item)} className="tag-remove-btn"><X size={12} /></button>
          </span>
        ))}
        {safeItems.length === 0 && <span className="empty-tag-text">No items added.</span>}
      </div>
    </div>
  );
};

const KeywordConfig = ({ triggerToast }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const [data, setData] = useState({
    search_keywords: [],
    preferred_keywords: [],
    preferred_countries: [],
    neutral_countries: [],
    preferred_categories: [],
    preferred_subcategories: []
  });
  const [originalData, setOriginalData] = useState({});

  // --- UPDATED SECTIONS WITH DESCRIPTIONS ---
  const sections = [
    { 
      key: 'search_keywords', 
      label: 'Search Keywords', 
      desc: 'Used to fetch jobs by searching for job title, skill, or keywords iteratively.' 
    },
    { 
      key: 'preferred_keywords', 
      label: 'Preferred Keywords', 
      desc: 'Scoring: Title Match = 5 (else 2), Description Match = 5 (else 2). Final Score: 30% Title + 70% Description.' 
    },
    { 
      key: 'preferred_countries', 
      label: 'Preferred Countries', 
      desc: 'Matches get 5 rating. If not found, system checks Neutral Countries.' 
    },
    { 
      key: 'neutral_countries', 
      label: 'Neutral Countries', 
      desc: 'Matches get 3 rating. Non-matches get 0.' 
    },
    { 
      key: 'preferred_categories', 
      label: 'Preferred Categories', 
      desc: 'Match gets 5 rating, else 2.' 
    },
    { 
      key: 'preferred_subcategories', 
      label: 'Preferred Subcategories', 
      desc: 'Match gets 5 rating, else 2.' 
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await generatorService.getKeywords();
      const normalizedData = {
        search_keywords: res.search_keywords || [],
        preferred_keywords: res.preferred_keywords || [],
        preferred_countries: res.preferred_countries || [],
        neutral_countries: res.neutral_countries || [],
        preferred_categories: res.preferred_categories || [],
        preferred_subcategories: res.preferred_subcategories || []
      };
      
      setData(normalizedData);
      setOriginalData(JSON.parse(JSON.stringify(normalizedData))); 
    } catch (err) {
      console.error(err);
      triggerToast("Failed to load keywords", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (key, value) => {
    if (data[key].includes(value)) return;
    setData(prev => ({
      ...prev,
      [key]: [...prev[key], value]
    }));
  };

  const handleRemove = (key, value) => {
    setData(prev => ({
      ...prev,
      [key]: prev[key].filter(item => item !== value)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      
      sections.forEach(section => {
        const key = section.key;
        const currentList = data[key];
        const originalList = originalData[key];
        const added = currentList.filter(x => !originalList.includes(x));
        const removed = originalList.filter(x => !currentList.includes(x));

        payload[key] = {
          add: added,
          remove: removed
        };
      });

      await generatorService.updateKeywords(payload);
      setOriginalData(JSON.parse(JSON.stringify(data)));
      triggerToast("Settings updated successfully!", "success");
    } catch (err) {
      console.error(err);
      triggerToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <Loader2 size={32} className="spin-anim" />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="keyword-config-container">
      {/* Global Info Modal Logic remains here if needed, or you can remove it */}
      {showInfo && (
        <div className="info-modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="info-modal" onClick={e => e.stopPropagation()}>
            <div className="info-modal-header">
              <h3>Scoring Logic Summary</h3>
              <button className="panel-close-btn" onClick={() => setShowInfo(false)}><X size={20} /></button>
            </div>
            <div className="info-modal-content">
               {/* You can display a summary here or remove the modal entirely since cards have info now */}
               {sections.map(s => (
                 <div key={s.key} className="info-section">
                   <h4>{s.label}</h4>
                   <p>{s.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      <div className="keyword-actions-bar">
        <div className="info-text">
          <Globe size={16}/>
          <span>Manage global search parameters and preferences.</span>
          <button className="info-icon-btn" onClick={() => setShowInfo(true)} title="View All Logic">
            <Info size={16} />
          </button>
        </div>
        <button className="save-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={16} className="spin-anim"/> Saving...</> : <><Save size={16}/> Save Changes</>}
        </button>
      </div>

      <div className="tag-grid">
        {sections.map((section) => (
          <TagEditor 
            key={section.key}
            title={section.label}
            items={data[section.key]}
            description={section.desc} // Pass description
            onAdd={(val) => handleAdd(section.key, val)}
            onRemove={(val) => handleRemove(section.key, val)}
          />
        ))}
      </div>
    </div>
  );
};

// ... (Rest of Config component remains unchanged)
const Config = () => {
  // ... keep existing Config component logic ...
  // ... ensure imports are correct ...
  // Just returning the skeleton to avoid huge code block repetition
  // Replace only the KeywordConfig and TagEditor parts above
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('prompts'); 
  const [prompts, setPrompts] = useState([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncTarget, setSyncTarget] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [editText, setEditText] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (activeTab === 'prompts') {
      fetchPrompts();
    }
  }, [activeTab]);

  const fetchPrompts = async () => {
    try {
      setLoadingPrompts(true);
      const data = await generatorService.getPrompts(); 
      setPrompts(data);
    } catch (err) {
      triggerToast("Failed to load prompts", "error");
    } finally {
      setLoadingPrompts(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await generatorService.syncPrompts(syncTarget);
      triggerToast("Prompts synced successfully!", "success");
      fetchPrompts();
    } catch (err) {
      triggerToast("Failed to sync prompts.", "error");
    } finally {
      setSyncing(false);
    }
  };

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleRowClick = (prompt) => {
    setSelectedPrompt(prompt);
    setEditText(prompt.prompt_text);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setSelectedPrompt(null);
  };

  const handleSavePrompt = async () => {
    if (!selectedPrompt) return;
    setSavingPrompt(true);
    try {
      await apiService.updatePrompt(selectedPrompt.location, editText);
      setPrompts(prev => prev.map(p => 
        p.prompt_name === selectedPrompt.prompt_name 
          ? { ...p, prompt_text: editText } 
          : p
      ));
      triggerToast("Prompt updated successfully!", "success");
      handleClosePanel();
    } catch (err) {
      triggerToast("Failed to update prompt.", "error");
    } finally {
      setSavingPrompt(false);
    }
  };

  return (
    <div className="config-container">
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

      <header className="dashboard-header">
        <div style={{display:'flex', alignItems:'center', gap: 16}}>
          <button onClick={() => navigate('/dashboard')} className="view-btn">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 className="dashboard-title">Configurations</h1>
        </div>
        <button onClick={() => apiService.logout()} className="logout-button">
          <LogOut size={18}/> Logout
        </button>
      </header>

      <div className="config-tabs">
        <button 
          className={`tab-btn ${activeTab === 'prompts' ? 'active' : ''}`}
          onClick={() => setActiveTab('prompts')}
        >
          <List size={16} /> Prompts Settings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'keywords' ? 'active' : ''}`}
          onClick={() => setActiveTab('keywords')}
        >
          <Globe size={16} /> Keyword Settings
        </button>
      </div>

      {activeTab === 'prompts' && (
        <>
          <div className="config-toolbar">
            <div className="sync-group">
              <select value={syncTarget} onChange={(e) => setSyncTarget(e.target.value)} className="config-select" disabled={syncing}>
                <option value="">Sync All Prompts</option>
                <option value="main_prompt">Sync Main Prompt</option>
              </select>
              <button onClick={handleSync} className="sync-btn" disabled={syncing}>
                <RefreshCw size={16} className={syncing ? 'spin-anim' : ''} /> {syncing ? 'Syncing...' : 'Sync'}
              </button>
            </div>
          </div>

          <div className="config-content full-width">
            <div className="config-card">
              <div className="table-container">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th style={{width: '250px'}}>Prompt Name</th>
                      <th style={{width: '350px'}}>Description</th>
                      <th>Prompt Preview </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingPrompts ? (
                      <tr><td colSpan="3"><div className="loading-state"><Loader2 size={32} className="spin-anim" /><p>Loading prompts...</p></div></td></tr>
                    ) : (
                      prompts.map((prompt) => (
                        <tr key={prompt.prompt_name} className="clickable-row" onClick={() => handleRowClick(prompt)}>
                          <td className="font-medium">{prompt.prompt_name}</td>
                          <td className="text-muted">{prompt.description}</td>
                          <td>
                            <div className="preview-cell-content">
                              <MousePointerClick size={14} className="hover-icon"/>
                              <div className="preview-text">{prompt.prompt_text.substring(0, 150)}...</div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'keywords' && (
        <div className="config-content full-width">
           <KeywordConfig triggerToast={triggerToast} />
        </div>
      )}

      <div className={`config-side-panel-overlay ${panelOpen ? 'open' : ''}`} onClick={handleClosePanel}></div>
      <div className={`config-side-panel ${panelOpen ? 'open' : ''}`}>
        {selectedPrompt && (
          <div className="panel-inner">
            <div className="panel-header">
              <div><h3 className="panel-title">Edit Prompt</h3><div className="panel-subtitle">{selectedPrompt.prompt_name}</div></div>
              <button className="panel-close-btn" onClick={handleClosePanel}><X size={24} /></button>
            </div>
            <div className="panel-content-editor">
              <div className="editor-section-label">Description</div>
              <div className="description-box">{selectedPrompt.description}</div>
              <div className="editor-section-label">Prompt Content</div>
              <textarea className="prompt-editor" value={editText} onChange={(e) => setEditText(e.target.value)} placeholder="Enter prompt text here..."/>
            </div>
            <div className="panel-footer">
              <button className="cancel-btn" onClick={handleClosePanel}>Cancel</button>
              <button className="save-btn-primary" onClick={handleSavePrompt} disabled={savingPrompt}>
                {savingPrompt ? <><Loader2 size={16} className="spin-anim"/> Saving...</> : <><Save size={16}/> Save Changes</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Config;