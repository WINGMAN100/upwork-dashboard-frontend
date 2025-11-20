import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight } from 'lucide-react';
import { apiService } from '../services/api';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); 
    
    try {
      await apiService.login(credentials.username, credentials.password);
      navigate('/dashboard'); 
      
    } catch (err) {
      console.error(err);
      setError('Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background"></div>
      <div className="login-gradient-overlay"></div>
      <div className="login-blur-left"></div>
      <div className="login-blur-right"></div>

      <div className="login-content">
        <div className="login-header">
          <h1 className="login-title">
          <span className="login-accent">Welcome</span>
          </h1>
          <p className="login-subtitle">
            Sign in to continue to your dashboard
          </p>
        </div>

        <div className="login-card">
          {error && (
            <div className="login-error" style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form-group">
              <label className="login-label">Username</label>
              <div className="login-input-wrapper">
                <div className="login-input-icon">
                  <User size={20} />
                </div>
                <input
                  name="username"
                  type="text"
                  value={credentials.username}
                  onChange={handleChange}
                  required
                  className="login-input"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div className="login-form-group">
              <label className="login-label">Password</label>
              <div className="login-input-wrapper">
                <div className="login-input-icon">
                  <Lock size={20} />
                </div>
                <input
                  name="password"
                  type="password"
                  value={credentials.password}
                  onChange={handleChange}
                  required
                  className="login-input"
                  placeholder="Enter your password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="login-button"
              style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={20} className="login-button-icon" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="login-copyright">
          <p>© 2025 ProWiz Infotech LLP. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;