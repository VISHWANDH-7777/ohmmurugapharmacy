const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5002/api' : '/api');

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'customer' | 'admin' | 'owner';
  avatar?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  user: Omit<User, 'password'>;
  token?: string;
  error?: string;
}

export interface CustomerStats {
  id: string;
  user_id: string;
  loyalty_points: number;
  order_count: number;
  total_spent: number;
}

// ============ AUTHENTICATION ============

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: 'customer' | 'admin' | 'owner',
  avatar?: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, avatar })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error: any) {
    return { success: false, user: {} as User, error: error.message };
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    // Save token to localStorage
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }

    return data;
  } catch (error: any) {
    return { success: false, user: {} as User, error: error.message };
  }
}

export function logoutUser() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
}

// ============ USER MANAGEMENT ============

export async function getAllUsers(role?: string): Promise<{ success: boolean; users: User[]; error?: string }> {
  try {
    const url = role ? `${API_BASE_URL}/users?role=${role}` : `${API_BASE_URL}/users`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error: any) {
    return { success: false, users: [], error: error.message };
  }
}

export async function getUserById(id: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUsersByRole(role: 'customer' | 'admin' | 'owner'): Promise<{ success: boolean; users: User[]; error?: string }> {
  return getAllUsers(role);
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function searchUsers(query: string): Promise<{ success: boolean; users: User[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/search/${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error: any) {
    return { success: false, users: [], error: error.message };
  }
}

// ============ CUSTOMER STATS ============

export async function getCustomerStats(userId: string): Promise<{ success: boolean; stats?: CustomerStats; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/customers/${userId}/stats`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCustomerStats(
  userId: string,
  orderCount: number,
  totalSpent: number,
  loyaltyPoints: number
): Promise<{ success: boolean; stats?: CustomerStats; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/customers/${userId}/stats`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderCount, totalSpent, loyaltyPoints })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    return data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============ UTILITY FUNCTIONS ============

export function saveCurrentUser(user: User) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

export function getCurrentUser(): User | null {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
