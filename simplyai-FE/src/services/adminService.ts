// Admin API Service

import { API_BASE_URL } from "@/config/api";

// Helper function to get auth token
const getAuthToken = () => {
  const token = localStorage.getItem("token");
  return token;
};

// Helper function to create headers with auth token
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export interface AdminUser {
  id: string; // Changed from number to string for UUID
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  role: string;
  created_at: string;
  last_login?: string;
  planStatus?: QuestionnaireProgress;
}

export interface QuestionnaireProgress {
  totalQuestionnaires: number;
  completedQuestionnaires: number;
  percentage: number;
  planName?: string;
}

export interface UpdateUserRoleData {
  role: "user" | "premium_user" | "administrator";
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: "user" | "premium_user" | "administrator";
  subscription_plan?: string;
}

// Fetch all users
export const fetchAllUsers = async (): Promise<AdminUser[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch users: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data;
};

// Delete a user
export const deleteUser = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete user: ${response.status} ${errorText}`);
  }
};

// Update user role
export const updateUserRole = async (
  userId: string,
  role: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to update user role: ${response.status} ${errorText}`
    );
  }
};

// Get user details
export const getUserDetails = async (userId: string): Promise<AdminUser> => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch user details: ${response.status} ${errorText}`
    );
  }

  const result = await response.json();
  return result.data;
};

// Create a new user
export const createUser = async (
  userData: CreateUserData
): Promise<AdminUser> => {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create user: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data;
};

// Fetch questionnaire progress for a specific user
export const getUserQuestionnaireProgress = async (
  userId: string
): Promise<QuestionnaireProgress> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/${userId}/questionnaire-progress`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        `Failed to fetch questionnaire progress for user ${userId}: ${response.status} ${errorText}`
      );
      // Return default progress data instead of throwing error
      return {
        totalQuestionnaires: 0,
        completedQuestionnaires: 0,
        percentage: 0,
      };
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.warn(
      `Error fetching questionnaire progress for user ${userId}:`,
      error
    );
    // Return default progress data to allow graceful degradation
    return {
      totalQuestionnaires: 0,
      completedQuestionnaires: 0,
      percentage: 0,
    };
  }
};

export const sendDeadlineReminders = async (userIds: string[]) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/users/send-deadline-reminders`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userIds }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to send deadline reminders: ${response.status} ${errorText}`
    );
  }

  return response.json();
};
// Fetch questionnaire progress for all users
export const getAllUsersQuestionnaireProgress = async (): Promise<
  Record<string, QuestionnaireProgress>
> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admin/users/questionnaire-progress`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        `Failed to fetch all users questionnaire progress: ${response.status} ${errorText}`
      );
      // Return empty object instead of throwing error to allow graceful degradation
      return {};
    }

    const result = await response.json();
    return result.data || {};
  } catch (error) {
    console.warn(
      "Error fetching questionnaire progress, returning empty data:",
      error
    );
    // Return empty object to allow the UI to function without progress data
    return {};
  }
};
