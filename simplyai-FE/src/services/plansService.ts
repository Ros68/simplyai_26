// Plans API Service

import { API_BASE_URL } from '@/config/api';


export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  is_popular: boolean;
  button_text: string;
  button_variant: 'outline' | 'default';
  is_free: boolean;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all active subscription plans
export const fetchAllPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await fetch(`${API_BASE_URL}/plans`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch plans: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data;
};

// Fetch a specific subscription plan by ID
export const fetchPlanById = async (planId: string): Promise<SubscriptionPlan> => {
  const response = await fetch(`${API_BASE_URL}/plans/${planId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch plan: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data;
};
