import { API_BASE_URL } from '@/config/api';

export interface PageContent {
  id: string;
  title: string;
  content?: string;
  menuTitle?: string;
  inMainMenu?: boolean;
  order?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Fetch all pages for navbar/menu
export const fetchAllPages = async (): Promise<PageContent[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pages`);
    if (!response.ok) {
      console.error(`Failed to fetch pages: ${response.status}`);
      return [];
    }
    const result = await response.json();
    return result.data || result || [];
  } catch (error) {
    console.error("Error fetching all pages:", error);
    return [];
  }
};

// Fetch single page data by ID
export const fetchPageData = async (id: string): Promise<PageContent | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pages/${id}`);
    if (!response.ok) {
      console.error(`Failed to fetch page ${id}: ${response.status}`);
      return null;
    }
    const result = await response.json();
    return result.data || result || null;
  } catch (error) {
    console.error(`Error fetching page ${id}:`, error);
    return null;
  }
};

// Create new page
export const createPage = async (page: PageContent): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page),
    });
    return response.ok;
  } catch (error) {
    console.error(`Error creating page ${page.id}:`, error);
    return false;
  }
};

// Save page data (update or create)
export const savePageData = async (page: PageContent): Promise<PageContent | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pages/${page.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page),
    });

    if (!response.ok) {
      console.error(`Failed to save page ${page.id}: ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data || result || null;
  } catch (error) {
    console.error(`Error saving page ${page.id}:`, error);
    return null;
  }
};

// Delete page
export const deletePage = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pages/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error(`Error deleting page ${id}:`, error);
    return false;
  }
};