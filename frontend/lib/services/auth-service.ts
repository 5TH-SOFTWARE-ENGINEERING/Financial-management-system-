// lib/services/auth-service.ts
import { User } from '../rbac/models';
import { UserType } from '../rbac/models';

interface LoginResponse {
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    phone?: string | null;
    role: UserType;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
    last_login?: Date | null;  // Allow null to match User interface
  };
  access_token: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log('Login Request:', JSON.stringify({
        requestData: { email, password: '********' },
        timestamp: new Date().toISOString()
      }, null, 2));

      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),  // Backend expects email/password
      });

      const data = await response.json();

      // Log the exact JSON response from the backend with formatting
      console.group('Backend Response Details');
      console.log('Raw Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      console.log('JSON Data:', data);
      console.table(data.user); // Shows user data in table format
      console.groupEnd();

      // Handle unauthorized access
      if (response.status === 401) {
        throw new Error('Invalid credentials');
      }

      // Ensure `data.user` exists
      if (!data || !data.user) {
        console.error('Unexpected Response:', JSON.stringify(data, null, 2));
        throw new Error('Unexpected response from server: User data is missing');
      }

      // Destructure user with default values for optional fields
      const {
        id,
        username,
        email: userEmail,
        full_name = '',
        phone = null,
        role,
        is_active = true,
        created_at,
        updated_at,
        last_login
      } = data.user;

      // Create the complete user object aligned with finance system
      const completeUser: User = {
        id,
        username,
        email: userEmail,
        full_name,
        phone,
        role,  // UserType from backend (e.g., ADMIN, MANAGER, ACCOUNTANT)
        is_active,
        created_at: created_at ? new Date(created_at) : new Date(),
        updated_at: updated_at ? new Date(updated_at) : new Date(),
        last_login: last_login ? new Date(last_login) : null,
      };

      // Log processed response
      console.log('Processed Response:', {
        user: completeUser,
        token: data.access_token ? '[PRESENT]' : '[MISSING]'
      });

      return {
        access_token: data.access_token,
        user: completeUser
      };
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  }
};