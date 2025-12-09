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
  getRole(){
    return localStorage.getItem('role');
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

 async getProposals(page = 1, limit = 20, search = '', timeFilter = 'all') {
  const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
  const timeParam = timeFilter !== 'all' ? `&time_filter=${timeFilter}` : '';
  
  return await this.request(`/dashboard/all?page=${page}&limit=${limit}${searchParam}${timeParam}`);
}
async get_count(search = '', timeFilter = 'all') {
    const params = new URLSearchParams();
    
    if (search) {
      params.append('search', search);
    }
    
    if (timeFilter && timeFilter !== 'all') {
      params.append('time_filter', timeFilter);
    }
    
    const queryString = params.toString();
    return await this.request(`/dashboard/count${queryString ? `?${queryString}` : ''}`);
  }

  async updateProposal(rowId, payload) {
    return await this.request(`/dashboard/update/${rowId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}


export const apiService = new ApiService();