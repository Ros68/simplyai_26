
import { API_BASE_URL } from '@/config/api';


export const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch dashboard statistics');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get recent users
  getRecentUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/recent-users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch recent users');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching recent users:', error);
      throw error;
    }
  },

  // Get recent questionnaire responses
  getRecentResponses: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/recent-responses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch recent responses');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching recent responses:', error);
      throw error;
    }
  }
};
