import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. Import Eye and EyeOff icons
import { Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { apiService } from '../services/api';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  // 2. Add state to track password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  // 3. Function to toggle password visibility state
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
              <div className="login-input-wrapper" style={{ position: 'relative' }}>
                <div className="login-input-icon">
                  <Lock size={20} />
                </div>
                <input
                  name="password"
                  // 4. Dynamic type based on state
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={handleChange}
                  required
                  className="login-input"
                  placeholder="Enter your password"
                  // Add padding right so text doesn't go under the new eye icon
                  style={{ paddingRight: '40px' }} 
                />
                
                {/* 5. The Toggle Button */}
                <button
                  type="button" // Crucial: prevents form submission on click
                  onClick={togglePasswordVisibility}
                  style={{
                    position: 'absolute',
                    right: '0',
                    top: '0',
                    height: '100%',
                    padding: '0 10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#a0aec0', // Adjust color to match your theme
                    zIndex: 2
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
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