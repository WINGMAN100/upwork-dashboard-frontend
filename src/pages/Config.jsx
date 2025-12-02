import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatorService } from '../services/generator';
import { apiService } from '../services/api';
import { 
  ArrowLeft, Settings, Save, LogOut,
  X, CheckCircle, AlertCircle, Loader2, MousePointerClick, 
  RefreshCw, List, Globe, Plus, Info, Star, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import './Config.css';
import './Dashboard.css'; 

// --- TAG EDITOR (Unchanged) ---
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

// --- KEYWORD CONFIG ---
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

  const sections = [
    { key: 'search_keywords', label: 'Search Keywords', desc: 'Used to fetch jobs by searching for job title, skill, or keywords iteratively.' },
    { key: 'preferred_keywords', label: 'Preferred Keywords', desc: 'Scoring: Title Match = 5 (else 2), Description Match = 5 (else 2). Final Score: 30% Title + 70% Description.' },
    { key: 'preferred_countries', label: 'Preferred Countries', desc: 'Matches get 5 rating. If not found, system checks Neutral Countries.' },
    { key: 'neutral_countries', label: 'Neutral Countries', desc: 'Matches get 3 rating. Non-matches get 0.' },
    { key: 'preferred_categories', label: 'Preferred Categories', desc: 'Match gets 5 rating, else 2.' },
    { key: 'preferred_subcategories', label: 'Preferred Subcategories', desc: 'Match gets 5 rating, else 2.' }
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
      await fetchData();
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
      {/* Global Info Modal */}
      {showInfo && (
        <div className="info-modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="info-modal" onClick={e => e.stopPropagation()}>
            <div className="info-modal-header">
              <h3>Scoring Logic Summary</h3>
              <button className="panel-close-btn" onClick={() => setShowInfo(false)}><X size={20} /></button>
            </div>
            <div className="info-modal-content">
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
            description={section.desc} 
            onAdd={(val) => handleAdd(section.key, val)}
            onRemove={(val) => handleRemove(section.key, val)}
          />
        ))}
      </div>
    </div>
  );
};

// --- UPDATED RULE EDITOR ---
const RuleEditor = ({ rules, onChange }) => {
  const addRule = () => {
    onChange([...rules, { op: '>=', value: 0, score: 0 }]);
  };

  const updateRule = (index, field, val) => {
    const newRules = [...rules];
    // FIX: Allow empty string to handle backspacing
    const value = val === '' ? '' : Number(val);
    newRules[index] = { ...newRules[index], [field]: field === 'op' ? val : value };
    onChange(newRules);
  };

  const removeRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    onChange(newRules);
  };

  return (
    <div className="rules-container">
      <div className="rules-header">
        <span className="rules-col" style={{flex: 0.8}}>Operator</span>
        <span className="rules-col" style={{flex: 1.5}}>Value</span>
        <span className="rules-col" style={{flex: 1}}>Score</span>
        <span className="rules-action" style={{width: 32}}></span>
      </div>
      {rules.map((rule, index) => (
        <div key={index} className="rule-row">
          <select 
            value={rule.op} 
            onChange={(e) => updateRule(index, 'op', e.target.value)} 
            className="rule-input"
            style={{flex: 0.8}}
          >
            <option value=">">{'>'}</option>
            <option value=">=">{'>='}</option>
            <option value="<">{'<'}</option>
            <option value="<=">{'<='}</option>
            <option value="==">{'='}</option>
          </select>
          <input 
            type="number" 
            value={rule.value} 
            onChange={(e) => updateRule(index, 'value', e.target.value)} 
            className="rule-input"
            style={{flex: 1.5}}
          />
          <input 
            type="number" 
            value={rule.score} 
            onChange={(e) => updateRule(index, 'score', e.target.value)} 
            className="rule-input"
            style={{flex: 1}}
          />
          <button onClick={() => removeRule(index)} className="rule-delete-btn"><Trash2 size={14} /></button>
        </div>
      ))}
      <button onClick={addRule} className="add-rule-btn"><Plus size={12} /> Add Rule</button>
    </div>
  );
};

// --- UPDATED RATING CONFIG ---
const RatingConfig = ({ triggerToast }) => {
  const [data, setData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await generatorService.getRatingConfig();
      setData(res);
      setOriginalData(JSON.parse(JSON.stringify(res)));
    } catch (err) {
      console.error(err);
      triggerToast("Failed to load rating config", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // FIX: Handle empty strings for controlled inputs to allow backspacing
  const handleScalarChange = (section, field, value, subfield = null) => {
    setData(prev => {
      // Allow empty string for UI, convert to Number only when value exists
      const valToSet = value === '' ? '' : Number(value);
      
      const newSection = { ...prev[section] };
      if (subfield) {
        newSection[field] = { ...newSection[field], [subfield]: valToSet };
      } else {
        newSection[field] = valToSet;
      }
      return { ...prev, [section]: newSection };
    });
  };

  const handleRulesChange = (section, ruleKey, newRules) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], [ruleKey]: newRules }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      
      Object.keys(data).forEach(sectionKey => {
        payload[sectionKey] = {};
        const currentSection = data[sectionKey];
        const originalSection = originalData[sectionKey];

        Object.keys(currentSection).forEach(fieldKey => {
          const val = currentSection[fieldKey];
          
          if (Array.isArray(val)) {
            const originalArr = originalSection[fieldKey] || [];
            
            // Clean data before comparing (ensure numbers are numbers, not empty strings)
            const cleanVal = val.map(r => ({
              ...r, 
              value: r.value === '' ? 0 : Number(r.value),
              score: r.score === '' ? 0 : Number(r.score)
            }));

            const added = cleanVal.filter(r => !originalArr.some(or => JSON.stringify(or) === JSON.stringify(r)));
            const removed = originalArr.filter(or => !cleanVal.some(r => JSON.stringify(r) === JSON.stringify(or)));

            if (added.length > 0 || removed.length > 0) {
              payload[sectionKey][fieldKey] = { add: added, remove: removed };
            }
          } else {
             payload[sectionKey][fieldKey] = val;
          }
        });
      });

      await generatorService.updateRatingConfig(payload);
      setOriginalData(JSON.parse(JSON.stringify(data)));
      triggerToast("Rating configuration updated!", "success");
      await fetchConfig()
    } catch (err) {
      console.error(err);
      triggerToast("Failed to update rating config", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) return <div className="loading-state"><Loader2 size={32} className="spin-anim" /><p>Loading configuration...</p></div>;

  const renderSection = (key, title, content) => (
    <div className="config-section-card" style={{height: 'fit-content'}}>
      <div className="section-header" onClick={() => toggleSection(key)}>
        <span className="section-title">{title}</span>
        {expandedSections[key] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>
      {expandedSections[key] && <div className="section-body">{content}</div>}
    </div>
  );

  return (
    <div className="rating-config-container">
      <div className="keyword-actions-bar">
        <div className="info-text"><Star size={16}/><span>Configure scoring algorithms.</span></div>
        <button className="save-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={16} className="spin-anim"/> Saving...</> : <><Save size={16}/> Save Changes</>}
        </button>
      </div>

      <div className="config-grid">
        {/* BUDGET */}
        {renderSection('budget', 'Budget Scoring', (
          <>
            <label className="config-label">Fixed Price Rules</label>
            <RuleEditor rules={data.budget.fixed_rules} onChange={r => handleRulesChange('budget', 'fixed_rules', r)} />
            <label className="config-label mt-4">Hourly Rate Rules</label>
            <RuleEditor rules={data.budget.hourly_min_rules} onChange={r => handleRulesChange('budget', 'hourly_min_rules', r)} />
            <div className="input-row mt-4"><label>Default Score</label><input type="number" value={data.budget.default_score} onChange={e => handleScalarChange('budget', 'default_score', e.target.value)} /></div>
          </>
        ))}

        {/* CLIENT */}
        {renderSection('client', 'Client Stats', (
          <>
            <label className="config-label">Feedback Score Rules</label>
            <RuleEditor rules={data.client.feedback_rules} onChange={r => handleRulesChange('client', 'feedback_rules', r)} />
            <label className="config-label mt-4">Total Reviews Rules</label>
            <RuleEditor rules={data.client.reviews_rules} onChange={r => handleRulesChange('client', 'reviews_rules', r)} />
            <div className="subsection mt-4">
              <h4>Weights & Defaults</h4>
              <div className="grid-3-col">
                <div className="input-group"><label>Weight: Feedback</label><input type="number" step="0.1" value={data.client.weights.feedback} onChange={e => handleScalarChange('client', 'weights', e.target.value, 'feedback')} /></div>
                <div className="input-group"><label>Weight: Reviews</label><input type="number" step="0.1" value={data.client.weights.reviews} onChange={e => handleScalarChange('client', 'weights', e.target.value, 'reviews')} /></div>
                <div className="input-group"><label>Default Score</label><input type="number" value={data.client.default_score} onChange={e => handleScalarChange('client', 'default_score', e.target.value)} /></div>
              </div>
            </div>
          </>
        ))}

        {/* HIRE RATIO */}
        {renderSection('hire_ratio', 'Hire Ratio', (
          <>
            <label className="config-label">Ratio Rules</label>
            <RuleEditor rules={data.hire_ratio.ratio_rules} onChange={r => handleRulesChange('hire_ratio', 'ratio_rules', r)} />
            <label className="config-label mt-4">Total Hires Rules</label>
            <RuleEditor rules={data.hire_ratio.total_hires_rules} onChange={r => handleRulesChange('hire_ratio', 'total_hires_rules', r)} />
            <div className="subsection mt-4">
              <h4>Weights & Defaults</h4>
              <div className="grid-2-col">
                <div className="input-group"><label>Weight: Ratio</label><input type="number" step="0.1" value={data.hire_ratio.weights.ratio} onChange={e => handleScalarChange('hire_ratio', 'weights', e.target.value, 'ratio')} /></div>
                <div className="input-group"><label>Weight: Total Hires</label><input type="number" step="0.1" value={data.hire_ratio.weights.total_hires} onChange={e => handleScalarChange('hire_ratio', 'weights', e.target.value, 'total_hires')} /></div>
                <div className="input-group"><label>Ratio Default</label><input type="number" value={data.hire_ratio.ratio_default_score} onChange={e => handleScalarChange('hire_ratio', 'ratio_default_score', e.target.value)} /></div>
                <div className="input-group"><label>Hires Default</label><input type="number" value={data.hire_ratio.total_hires_default_score} onChange={e => handleScalarChange('hire_ratio', 'total_hires_default_score', e.target.value)} /></div>
              </div>
            </div>
          </>
        ))}

        {/* KEYWORD SCORING (NEW) */}
        {renderSection('keyword', 'Keyword Scoring Strategy', (
          <div className="config-inner-stack">
            <div className="subsection">
              <h4>Description Keyword Logic</h4>
              <div className="grid-3-col">
                <div className="input-group"><label>Per Match Score</label><input type="number" step="0.1" value={data.keyword.description.per_match} onChange={e => handleScalarChange('keyword', 'description', e.target.value, 'per_match')} /></div>
                <div className="input-group"><label>Max Score</label><input type="number" step="0.1" value={data.keyword.description.max_score} onChange={e => handleScalarChange('keyword', 'description', e.target.value, 'max_score')} /></div>
                <div className="input-group"><label>Default Score</label><input type="number" value={data.keyword.description.default_score} onChange={e => handleScalarChange('keyword', 'description', e.target.value, 'default_score')} /></div>
              </div>
            </div>
            
            <div className="subsection">
              <h4>Title Keyword Logic</h4>
              <div className="grid-3-col">
                <div className="input-group"><label>With Keyword</label><input type="number" value={data.keyword.title.score_with_keyword} onChange={e => handleScalarChange('keyword', 'title', e.target.value, 'score_with_keyword')} /></div>
                <div className="input-group"><label>No Keyword</label><input type="number" value={data.keyword.title.score_without_keyword} onChange={e => handleScalarChange('keyword', 'title', e.target.value, 'score_without_keyword')} /></div>
                <div className="input-group"><label>Default Score</label><input type="number" value={data.keyword.title.default_score} onChange={e => handleScalarChange('keyword', 'title', e.target.value, 'default_score')} /></div>
              </div>
            </div>

            <div className="subsection">
              <h4>Combined Weights</h4>
              <div className="grid-2-col">
                <div className="input-group"><label>Title Weight</label><input type="number" step="0.1" value={data.keyword.combined.title_weight} onChange={e => handleScalarChange('keyword', 'combined', e.target.value, 'title_weight')} /></div>
                <div className="input-group"><label>Description Weight</label><input type="number" step="0.1" value={data.keyword.combined.description_weight} onChange={e => handleScalarChange('keyword', 'combined', e.target.value, 'description_weight')} /></div>
              </div>
            </div>
          </div>
        ))}

        {/* SIMPLE SCORES */}
        {renderSection('other', 'Simple Matches', (
          <div className="config-inner-stack">
            <div className="subsection">
              <h4>Country Match</h4>
              <div className="grid-3-col">
                 <div className="input-group"><label>Preferred</label><input type="number" value={data.country.score_preferred} onChange={e => handleScalarChange('country', 'score_preferred', e.target.value)} /></div>
                 <div className="input-group"><label>Neutral</label><input type="number" value={data.country.score_neutral} onChange={e => handleScalarChange('country', 'score_neutral', e.target.value)} /></div>
                 <div className="input-group"><label>Other</label><input type="number" value={data.country.score_other} onChange={e => handleScalarChange('country', 'score_other', e.target.value)} /></div>
              </div>
              <div className="input-row mt-2"><label>Default Score</label><input type="number" value={data.country.default_score} onChange={e => handleScalarChange('country', 'default_score', e.target.value)} /></div>
            </div>

            <div className="grid-2-col">
              <div className="subsection">
                <h4>Category Match</h4>
                <div className="input-group"><label>Match</label><input type="number" value={data.category.score_match} onChange={e => handleScalarChange('category', 'score_match', e.target.value)} /></div>
                <div className="input-group mt-2"><label>No Match</label><input type="number" value={data.category.score_no_match} onChange={e => handleScalarChange('category', 'score_no_match', e.target.value)} /></div>
                <div className="input-group mt-2"><label>Default</label><input type="number" value={data.category.default_score} onChange={e => handleScalarChange('category', 'default_score', e.target.value)} /></div>
              </div>
              
              <div className="subsection">
                <h4>Title (Simple)</h4>
                <div className="input-group"><label>With Keyword</label><input type="number" value={data.title.score_with_keyword} onChange={e => handleScalarChange('title', 'score_with_keyword', e.target.value)} /></div>
                <div className="input-group mt-2"><label>No Keyword</label><input type="number" value={data.title.score_without_keyword} onChange={e => handleScalarChange('title', 'score_without_keyword', e.target.value)} /></div>
                <div className="input-group mt-2"><label>Default</label><input type="number" value={data.title.default_score} onChange={e => handleScalarChange('title', 'default_score', e.target.value)} /></div>
              </div>
            </div>
          </div>
        ))}

        {/* OVERALL WEIGHTS */}
        {renderSection('overall', 'Global Weights', (
          <div className="grid-3-col">
             {Object.keys(data.overall.weights).map(wKey => (
               <div key={wKey} className="input-group">
                 <label className="capitalize">{wKey.replace('_', ' ')}</label>
                 <input type="number" step="0.1" value={data.overall.weights[wKey]} onChange={e => handleScalarChange('overall', 'weights', e.target.value, wKey)} />
               </div>
             ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN CONFIG PAGE ---
const Config = () => {
  const navigate = useNavigate();
  
  // 1. Initialize State from LocalStorage (Persist on Reload)
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('config_active_tab') || 'prompts';
  });

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

  // 2. Save to LocalStorage whenever activeTab changes
  useEffect(() => {
    localStorage.setItem('config_active_tab', activeTab);
  }, [activeTab]);

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
        <button 
          className={`tab-btn ${activeTab === 'rating' ? 'active' : ''}`}
          onClick={() => setActiveTab('rating')}
        >
          <Star size={16} /> Rating Settings
        </button>
      </div>

      {/* --- TAB CONTENT: PROMPTS --- */}
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

      {/* --- TAB CONTENT: KEYWORDS --- */}
      {activeTab === 'keywords' && (
        <div className="config-content full-width">
           <KeywordConfig triggerToast={triggerToast} />
        </div>
      )}

      {/* --- NEW TAB CONTENT: RATING --- */}
      {activeTab === 'rating' && (
        <div className="config-content full-width">
           <RatingConfig triggerToast={triggerToast} />
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