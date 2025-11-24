// src/pages/GenerateProposal.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { generatorService } from '../services/generator';
import { 
  LogOut, ArrowLeft, Wand2, FileText, Copy, Check, Loader2, 
  Pencil, AlertCircle, CheckCircle, X 
} from 'lucide-react';
import './Dashboard.css'; 

const GenerateProposal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ jobDescription: '', questions: '' });
  const [generatedResult, setGeneratedResult] = useState('');
  
  // UI States
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  const textareaRef = useRef(null);

  // --- Toast Helper ---
  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleGenerate = async () => {
    if (!formData.jobDescription) {
      triggerToast("Please enter a job description", "error");
      return;
    }
    
    setLoading(true);
    setGeneratedResult('');
    setIsEditing(false); // Reset edit mode

    try {
      const response = await generatorService.generateProposalOnDemand(formData.jobDescription, formData.questions);
      const resultText = response.proposal || response.result || (typeof response === 'string' ? response : JSON.stringify(response));
      setGeneratedResult(resultText);
      triggerToast("Proposal generated successfully!", "success");
    } catch (error) {
      console.error(error);
      triggerToast("Failed to generate proposal. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    triggerToast("Result copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleEdit = () => {
    if (!isEditing) {
        // Enabling edit mode
        setIsEditing(true);
        setTimeout(() => textareaRef.current?.focus(), 100);
    } else {
        // Disabling edit (Saving)
        setIsEditing(false);
        triggerToast("Changes saved locally.", "success");
    }
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
        {/* Header */}
        <header className="dashboard-header">
          <div style={{display:'flex', alignItems:'center', gap: 16}}>
            <button onClick={() => navigate('/dashboard')} className="view-btn">
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <h1 className="dashboard-title">Proposal Generator</h1>
          </div>
          <button onClick={() => apiService.logout()} className="logout-button">
            <LogOut size={18}/> Logout
          </button>
        </header>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap', height: 'calc(100vh - 140px)' }}>
          
          {/* LEFT: Input Section */}
          <div className="table-card" style={{ flex: 1, padding: '24px', minWidth: '350px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 className="panel-title" style={{marginBottom: '20px'}}>Job Details</h3>
            
            <div style={{marginBottom: '16px', flex: 2, display: 'flex', flexDirection: 'column'}}>
              <label className="item-title" style={{marginBottom: '8px'}}>Job Requirement *</label>
              <textarea 
                className="dashboard-input" 
                style={{flex: 1, resize: 'none'}}
                placeholder="Paste the job description here..."
                value={formData.jobDescription}
                onChange={e => setFormData({...formData, jobDescription: e.target.value})}
              />
            </div>

            <div style={{marginBottom: '24px', flex: 1, display: 'flex', flexDirection: 'column'}}>
              <label className="item-title" style={{marginBottom: '8px'}}>Questions (Optional)</label>
              <textarea 
                className="dashboard-input" 
                style={{flex: 1, resize: 'none'}}
                placeholder="Paste any specific client questions..."
                value={formData.questions}
                onChange={e => setFormData({...formData, questions: e.target.value})}
              />
            </div>

            <button 
              className="save-button" 
              onClick={handleGenerate} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="loader-spinner" style={{marginBottom:0, animationDuration: '1s'}} /> 
                  Generating...
                </>
              ) : (
                <><Wand2 size={16} /> Generate Proposal</>
              )}
            </button>
          </div>

          {/* RIGHT: Output Section */}
          <div className="table-card" style={{ flex: 1, padding: '24px', minWidth: '350px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <h3 className="panel-title">Generated Result</h3>
                {generatedResult && !loading && (
                    <span style={{
                        fontSize:'12px', 
                        color: isEditing ? '#15803d' : '#64748b', 
                        background: isEditing ? '#dcfce7' : '#f1f5f9', 
                        padding:'2px 8px', borderRadius:'12px',
                        fontWeight: 500, transition: 'all 0.2s'
                    }}>
                        {isEditing ? 'Editing...' : 'Read Only'}
                    </span>
                )}
              </div>
              
              {/* Action Buttons */}
              {generatedResult && !loading && (
                <div style={{display: 'flex', gap: '8px'}}>
                    <button 
                        className="copy-btn" 
                        onClick={toggleEdit}
                        style={{ background: isEditing ? '#dcfce7' : '#eff6ff', borderColor: isEditing ? '#86efac' : '#bfdbfe', color: isEditing ? '#166534' : '#2563eb'}}
                    >
                        {isEditing ? <Check size={14} /> : <Pencil size={14} />} 
                        {isEditing ? 'Done' : 'Edit'}
                    </button>

                    <button className="copy-btn" onClick={handleCopy}>
                        {copied ? <Check size={14} /> : <Copy size={14} />} 
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
              )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              
              {/* Case 1: Loading State */}
              {loading ? (
                <div style={{
                  flex: 1, 
                  background: '#f8fafc', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center'
                }}>
                  <Loader2 size={48} className="loader-spinner" />
                  <p className="loading-text" style={{marginTop: 16}}>Crafting your proposal...</p>
                </div>
              ) : generatedResult ? (
                /* Case 2: Result Loaded */
                <textarea
                  ref={textareaRef}
                  className="dashboard-input"
                  readOnly={!isEditing} // Read-only until Edit is clicked
                  style={{
                    flex: 1,
                    resize: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.6',
                    fontSize: '15px',
                    padding: '16px',
                    border: isEditing ? '2px solid #2563eb' : '1px solid #e2e8f0', // Visual cue for edit mode
                    background: isEditing ? '#ffffff' : '#f8fafc', // Visual cue for read-only
                    color: '#334155',
                    transition: 'all 0.2s'
                  }}
                  value={generatedResult}
                  onChange={(e) => setGeneratedResult(e.target.value)}
                  placeholder="Generated proposal will appear here..."
                />
              ) : (
                /* Case 3: Empty State */
                <div style={{
                  flex: 1, 
                  background: '#f8fafc', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#94a3b8'
                }}>
                  <FileText size={48} style={{marginBottom: 16, opacity: 0.3}} />
                  <p>Result will appear here</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GenerateProposal;