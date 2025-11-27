import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatorService } from '../services/generator';
import { apiService } from '../services/api';
import { 
  ArrowLeft, Settings, Save, LogOut,
  X, CheckCircle, AlertCircle, Loader2, MousePointerClick, 
  RefreshCw, List, Globe, Plus
} from 'lucide-react';
import './Config.css';
import './Dashboard.css'; 

const TagEditor = ({ title, items, onAdd, onRemove }) => {
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
        <span className="tag-title">{title}</span>
        <span className="tag-count">{safeItems.length}</span>
      </div>
      <div className="tag-input-wrapper">
        <Plus size={14} className="input-icon" />
        <input 
          type="text" 
          className="tag-input" 
          placeholder="Type new keyword -> press enter -> click save changes"
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
  const [data, setData] = useState({
    search_keywords: [],
    preferred_keywords: [],
    preferred_countries: [],
    neutral_countries: [],
    preferred_categories: [],
    preferred_subcategories: []
  });
  const [originalData, setOriginalData] = useState({});

  const sections = [
    { key: 'search_keywords', label: 'Search Keywords' },
    { key: 'preferred_keywords', label: 'Preferred Keywords' },
    { key: 'preferred_countries', label: 'Preferred Countries' },
    { key: 'neutral_countries', label: 'Neutral Countries' },
    { key: 'preferred_categories', label: 'Preferred Categories' },
    { key: 'preferred_subcategories', label: 'Preferred Subcategories' }
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
      <div className="keyword-actions-bar">
        <div className="info-text">
          <Globe size={16}/>
          <span>Manage your keywords.</span>
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
            onAdd={(val) => handleAdd(section.key, val)}
            onRemove={(val) => handleRemove(section.key, val)}
          />
        ))}
      </div>
    </div>
  );
};

// --- MAIN CONFIG PAGE ---
const Config = () => {
  const navigate = useNavigate();
  // Tab State
  const [activeTab, setActiveTab] = useState('prompts'); 

  // Prompts State
  const [prompts, setPrompts] = useState([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncTarget, setSyncTarget] = useState('');

  // Panel State
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
      // Fetch all prompts by default (no query param)
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

      {/* Header */}
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

      {/* --- TABS --- */}
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

      {/* --- TAB CONTENT: PROMPTS --- */}
      {activeTab === 'prompts' && (
        <>
          <div className="config-toolbar">
            {/* Filter group removed */}
            
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

      {/* --- TAB CONTENT: KEYWORDS --- */}
      {activeTab === 'keywords' && (
        <div className="config-content full-width">
           <KeywordConfig triggerToast={triggerToast} />
        </div>
      )}

      {/* --- SIDE PANEL (Only for Prompts) --- */}
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