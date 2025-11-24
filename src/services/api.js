const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
const GENERATE_URL = import.meta.env.VITE_GENERATE_URL;
class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiService {
  
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiry) return false;
    return Date.now() < parseInt(expiry);
  }

  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }

  getToken() {
    return localStorage.getItem('authToken');
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (response.access_token) {
        localStorage.setItem('authToken', response.access_token);
        localStorage.setItem('role', response.role);
        const expiryTime = Date.now() + (response.expires_in * 1000); 
        localStorage.setItem('tokenExpiry', expiryTime.toString());
    }
    
    return response;
  }

  async getProposals() {
    return await this.request('/dashboard/all'); 
  }

  async updateProposal(rowId, payload) {
    return await this.request(`/dashboard/update/${rowId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
  async generateProposalOnDemand(jobDescription, questions) {
    response =  await fetch('http://35.223.232.116:8000/generate', {
      method: 'POST',
      body: JSON.stringify({ 
        client_requirement: jobDescription, 
        screening_questions: questions,
        similarity_threshold: 0.30,
        hybrid_alpha: 0.5,
        use_section_approach: true,
        job_id:1.98097717646467E+018
      }),
    });
    if (!response.ok) {
      throw new ApiError('Failed to generate proposal', response.status);
    }
    const responseData = await response.json();
    const response = responseData.generated_proposal;
    return response
  }

  async searchJobLinks(query) {
    return await this.request(`/search-jobs?q=${encodeURIComponent(query)}`);
  }
}


export const apiService = new ApiService();