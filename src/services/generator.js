const GENERATE_URL = import.meta.env.VITE_GENERATE_URL;
const GENERATE_USERNAME = import.meta.env.VITE_GENERATE_USERNAME;
const GENERATE_PASSWORD = import.meta.env.VITE_GENERATE_PASSWORD;

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class GeneratorService {
  
  isAuthenticated() {
    const token = localStorage.getItem('geneAuthToken');
    const expiry = localStorage.getItem('geneTokenExpiry');
    
    if (!token || !expiry) return false;
    return Date.now() < parseInt(expiry);
  }

  getToken() {
    return localStorage.getItem('geneAuthToken');
  }
  logout() {
    localStorage.removeItem('geneAuthToken');
    localStorage.removeItem('geneTokenExpiry');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${GENERATE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
      }
      throw new ApiError(data.message || 'API Error', response.status, data);
    }

    return data;
  }

  async login(username, password) {
    const response = await fetch(`${GENERATE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
        localStorage.setItem('geneAuthToken', data.access_token);
        const expiryTime = Date.now() + (data.expires_in * 1000); 
        localStorage.setItem('geneTokenExpiry', expiryTime.toString());
        return true;
    } else {
        return false;
    }
  }

  async generateProposalOnDemand(jobDescription, questions) {
    if (!this.isAuthenticated()) {
        console.log("Not authenticated, attempting auto-login...");
        const isLoggedIn = await this.login(GENERATE_USERNAME, GENERATE_PASSWORD);
        if (!isLoggedIn) {
            throw new ApiError('Authentication failed for Generator Service', 401);
        }
    }    
    let formattedQuestions = [];
    if (typeof questions === 'string' && questions.trim().length > 0) {
        formattedQuestions = questions.split('\n').map(q => q.trim()).filter(q => q !== '');
    } else if (Array.isArray(questions)) {
        formattedQuestions = questions;
    }

    const payload = { 
        client_requirement: jobDescription, 
        screening_questions: formattedQuestions,
        similarity_threshold: 0.30,
        hybrid_alpha: 0.5,
        use_section_approach: true,
        job_id: "1.98097717646467E+018" 
    };
    const response = await this.request('/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return response;
  }
  async searchJobLinks(query) {
    if (!this.isAuthenticated()) {
        console.log("Not authenticated, attempting auto-login...");
        const isLoggedIn = await this.login(GENERATE_USERNAME, GENERATE_PASSWORD); 
        if (!isLoggedIn) {
            throw new ApiError('Authentication failed for Search Service', 401);
        }
    }
    const response = await this.request(`/search-link?q=${encodeURIComponent(query)}&k=5`); 
    return response.results || [];
  }
}

export const generatorService = new GeneratorService();