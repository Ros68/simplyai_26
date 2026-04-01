import { API_BASE_URL } from "@/config/api";

export const savePlan = async (planData: any, isUpdate: boolean) => {
  const url = isUpdate
    ? `${API_BASE_URL}/plans/${planData.id}`
    : `${API_BASE_URL}/plans`;

  const method = isUpdate ? "PUT" : "POST";

  console.log("Sending request to:", url);
  console.log("Method:", method);
  console.log("Is Update:", isUpdate);
  console.log("Plan data:", planData);

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(planData),
  });

  console.log("Response status:", response.status);
  console.log("Response ok:", response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error response:", errorText);
    throw new Error(`Failed to save plan: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log("Response data:", result);
  return result;
};

export const fetchAllPlans = async () => {
  const url = `${API_BASE_URL}/plans`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch plans");
  }

  const result = await response.json();
  return result.data;
};

export const fetchAllPlansForAdmin = async () => {
  const url = `${API_BASE_URL}/plans/admin/all`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch all plans for admin");
  }

  const result = await response.json();
  return result.data;
};

export const fetchPlan = async (id: string) => {
  const url = `${API_BASE_URL}/plans/${id}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch plan");
  }

  const result = await response.json();
  return result;
};

export const fetchPlanForAdmin = async (id: string) => {
  const url = `${API_BASE_URL}/plans/admin/${id}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch plan for admin");
  }

  const result = await response.json();
  return result;
};

export const deletePlan = async (id: string) => {
  const url = `${API_BASE_URL}/plans/${id}`;

  const response = await fetch(url, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete plan");
  }

  return await response.json();
};

export const checkPlanHasUsers = async (planId: string): Promise<boolean> => {
  try {
    const url = `${API_BASE_URL}/plans/${planId}/has-users`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to check if plan has users:', response.status);
      return false;
    }

    const result = await response.json();
    return result.hasUsers === true;
  } catch (error) {
    console.error('Error checking if plan has users:', error);
    return false;
  }
};

export const updatePlanStatus = async (id: string, active: boolean) => {
  try {
    const currentPlan = await fetchPlanForAdmin(id);
    if (!currentPlan.success) {
      throw new Error("Failed to fetch current plan data");
    }

    const planData = currentPlan.data;

    const url = `${API_BASE_URL}/plans/${id}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: planData.name,
        description: planData.description || "",
        price: planData.price || 0,
        is_free: planData.is_free || false,
        features: planData.features || [],
        active: active,
        button_text: planData.button_text || "",
        button_variant: planData.button_variant || "",
        sort_order: planData.sort_order || 0,
        interval: planData.interval || "month",
        is_popular: planData.is_popular || false,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update plan status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating plan status:", error);
    throw error;
  }
};

// ==================== NEW: Create Free Subscription ====================
export const createFreeSubscription = async (userId: string, planId: string) => {
  try {
    const url = `${API_BASE_URL}/plans/create-free-subscription`;
    
    console.log("🆓 Creating free subscription:", { userId, planId });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        plan_id: planId
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Failed to create free subscription:", errorText);
      throw new Error(`Failed to create free subscription: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Free subscription created:", result);
    return result;
  } catch (error) {
    console.error("❌ Error in createFreeSubscription:", error);
    throw error;
  }
};

// ==================== NEW: Fetch Questionnaires by Plan ID (Public) ====================
export const fetchQuestionnairesByPlanId = async (planId: string) => {
  try {
    const url = `${API_BASE_URL}/plans/questionnaires-public/${planId}`;
    console.log("📥 [ApiService] Fetching public questionnaires for plan:", planId);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("📥 [ApiService] Response status:", response.status);

    if (!response.ok) {
      console.error("❌ [ApiService] Failed to fetch questionnaires:", response.status);
      return [];
    }

    const result = await response.json();
    console.log("📦 [ApiService] Questionnaires response:", result);
    
    if (result.data && Array.isArray(result.data)) {
      return result.data;
    } else if (Array.isArray(result)) {
      return result;
    } else {
      return [];
    }
  } catch (error) {
    console.error("❌ [ApiService] Error fetching questionnaires by plan ID:", error);
    return [];
  }
};

// ==================== Questionnaire Functions ====================

export const fetchAllQuestionnaires = async () => {
  try {
    const url = `${API_BASE_URL}/questionnaires`;
    console.log("📥 [ApiService] Fetching all questionnaires from:", url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("📥 [ApiService] Response status:", response.status);

    if (!response.ok) {
      console.error("❌ [ApiService] Failed to fetch questionnaires:", response.status);
      return [];
    }

    const result = await response.json();
    console.log("📦 [ApiService] Questionnaires API response:", result);
    
    if (result.data && Array.isArray(result.data)) {
      console.log("✅ [ApiService] Found questionnaires in result.data:", result.data.length);
      return result.data;
    } else if (Array.isArray(result)) {
      console.log("✅ [ApiService] Found questionnaires in result array:", result.length);
      return result;
    } else {
      console.warn("⚠️ [ApiService] No questionnaires found in response");
      return [];
    }
  } catch (error) {
    console.error("❌ [ApiService] Error fetching questionnaires:", error);
    return [];
  }
};

export const fetchPlanQuestionnaires = async (planId: string) => {
  try {
    const url = `${API_BASE_URL}/plans/${planId}/questionnaires`;
    console.log("📥 [ApiService] Fetching plan questionnaires from:", url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("📥 [ApiService] Response status:", response.status);

    if (!response.ok) {
      console.error("❌ [ApiService] Failed to fetch plan questionnaires:", response.status);
      return [];
    }

    const result = await response.json();
    console.log("📦 [ApiService] Plan questionnaires response:", result);
    
    if (result.data && Array.isArray(result.data)) {
      return result.data;
    } else if (Array.isArray(result)) {
      return result;
    } else {
      return [];
    }
  } catch (error) {
    console.error("❌ [ApiService] Error fetching plan questionnaires:", error);
    return [];
  }
};

export const savePlanQuestionnaires = async (
  planId: string,
  questionnaires: any[]
) => {
  try {
    const url = `${API_BASE_URL}/plans/${planId}/questionnaires`;

    console.log("📝 [ApiService] ===== SAVING QUESTIONNAIRES START =====");
    console.log("📝 [ApiService] Plan ID:", planId);
    console.log("📝 [ApiService] Questionnaires data:", JSON.stringify(questionnaires, null, 2));

    const payload = {
      questionnaires: questionnaires.map(q => ({
        questionnaire_id: q.id || q.questionnaire_id,
        sequence_order: q.sequence || q.sequence_order || 0,
        periodicity: q.periodicity || null,
        repetitions: q.repetitions || null
      }))
    };

    console.log("📤 [ApiService] Sending payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("📥 [ApiService] Save response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [ApiService] Error saving questionnaires. Status:", response.status);
      console.error("❌ [ApiService] Error response:", errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error("❌ [ApiService] Parsed error:", errorJson);
      } catch (e) {
        // Not JSON, ignore
      }
      
      throw new Error(`Failed to save plan questionnaires: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ [ApiService] Questionnaires saved successfully:", result);
    console.log("📝 [ApiService] ===== SAVING QUESTIONNAIRES END =====");
    
    return result;
  } catch (error) {
    console.error("❌ [ApiService] Exception in savePlanQuestionnaires:", error);
    throw error;
  }
};

// ==================== FIXED: fetchUserQuestionnairesWithAccess ====================
// ==================== CRITICAL FIX: Use /plans/ endpoint NOT /forms/ ====================
export const fetchUserQuestionnairesWithAccess = async (userId: string) => {
  try {
    console.log("🔍 [ApiService] Fetching user subscription for user:", userId);
    
    // ========== CRITICAL FIX: Use /plans/user-subscription ==========
    const subscriptionUrl = `${API_BASE_URL}/plans/user-subscription?userId=${encodeURIComponent(userId)}`;
    console.log("📡 [ApiService] Calling URL:", subscriptionUrl);
    
    const subscriptionResponse = await fetch(subscriptionUrl, {
      headers: { "Content-Type": "application/json" },
    });
    
    console.log("📡 [ApiService] Response status:", subscriptionResponse.status);
    
    let planId = null;
    let planInfo = null;
    
    if (subscriptionResponse.ok) {
      const subscriptionData = await subscriptionResponse.json();
      console.log("📦 [ApiService] Subscription data:", subscriptionData);
      
      if (subscriptionData.data && subscriptionData.data.plan_id) {
        planId = subscriptionData.data.plan_id;
        planInfo = {
          planId: subscriptionData.data.plan_id,
          planName: subscriptionData.data.plan_name || "Piano attivo",
          planOptions: subscriptionData.data.plan_options || {}
        };
      }
    } else {
      console.log("⚠️ [ApiService] Subscription 404, trying localStorage fallback");
      const storedPlanId = localStorage.getItem('selectedPlanId');
      if (storedPlanId) {
        planId = storedPlanId;
        planInfo = { planId: storedPlanId, planName: "Piano selezionato", planOptions: {} };
      }
    }
    
    if (!planId) {
      console.warn("⚠️ [ApiService] No plan found for user:", userId);
      return {
        success: false,
        message: "Nessun piano attivo trovato",
        data: [],
        questionnaires: [],
        planInfo: null
      };
    }
    
    console.log("✅ [ApiService] Using plan:", planId);
    
    // Fetch questionnaires
    const questionnairesUrl = `${API_BASE_URL}/plans/questionnaires-public/${planId}`;
    console.log("🔍 [ApiService] Fetching from:", questionnairesUrl);
    
    const response = await fetch(questionnairesUrl, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch questionnaires: ${response.status}`);
    }

    const result = await response.json();
    console.log("📦 [ApiService] Questionnaires result:", result);
    
    if (result.data && Array.isArray(result.data)) {
      const transformedData = result.data.map((q: any, index: number) => ({
        id: q.questionnaire_id || q.id,
        title: q.title || `Questionario ${index + 1}`,
        description: q.description || "",
        status: 'available',
        sequence_order: q.sequence_order || index + 1,
        canAccess: true,
        reason: "Disponibile nel tuo piano",
        completionCount: 0,
        lastCompletedAt: null
      }));
      
      return {
        success: true,
        data: transformedData,
        questionnaires: transformedData,
        planInfo: planInfo,
        message: `Trovati ${transformedData.length} questionari`
      };
    }
    
    return { success: false, data: [], planInfo: null, message: "No questionnaires" };
    
  } catch (error) {
    console.error("❌ [ApiService] Error:", error);
    return {
      success: false,
      message: error.message,
      data: [],
      questionnaires: [],
      planInfo: null
    };
  }
};
// ==================== BACKUP: Direct fetch by plan ID (no subscription needed) ====================
export const fetchUserQuestionnairesDirect = async (planId: string) => {
  try {
    console.log("🔍 [ApiService] Direct fetch for plan:", planId);
    
    const url = `${API_BASE_URL}/plans/questionnaires-public/${planId}`;
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.data && Array.isArray(result.data)) {
      const transformedData = result.data.map((q: any, index: number) => ({
        id: q.questionnaire_id || q.id,
        title: q.title || `Questionario ${index + 1}`,
        description: q.description || "",
        status: 'available',
        sequence_order: q.sequence_order || index + 1,
        canAccess: true,
        reason: "Disponibile nel tuo piano",
        completionCount: 0,
        lastCompletedAt: null
      }));
      
      return {
        success: true,
        data: transformedData,
        planInfo: { planId }
      };
    }
    
    return { success: false, data: [], planInfo: null };
  } catch (error) {
    console.error("❌ [ApiService] Error in direct fetch:", error);
    return { success: false, data: [], planInfo: null };
  }
};

export const fetchUserSubscription = async (token: string) => {
  // Try /forms/ first, if that fails, user might not have forms router
  // This is kept for backward compatibility
  const url = `${API_BASE_URL}/forms/user-subscription`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user subscription");
  }

  const result = await response.json();
  return result;
};

// ==================== Auth Functions ====================

export const registerUser = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  subscription_plan?: string;
}) => {
  const url = `${API_BASE_URL}/auth/register`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Registration failed");
  }

  return await response.json();
};

export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  const url = `${API_BASE_URL}/auth/login`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Login failed");
  }

  return await response.json();
};

export const getCurrentUser = async (token: string) => {
  const url = `${API_BASE_URL}/auth/me`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to get user data");
  }

  return await response.json();
};

export const logoutUser = async (token: string) => {
  const url = `${API_BASE_URL}/auth/logout`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Logout failed");
  }

  return await response.json();
};

export const registerUserWithGoogle = async (
  googleData: any,
  subscription_plan?: string
) => {
  const url = `${API_BASE_URL}/auth/register/google`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      googleData,
      subscription_plan,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Google registration failed");
  }

  return await response.json();
};

export const registerUserWithFacebook = async (
  facebookData: any,
  subscription_plan?: string
) => {
  const url = `${API_BASE_URL}/auth/register/facebook`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      facebookData,
      subscription_plan,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Facebook registration failed");
  }

  return await response.json();
};

export const processPayment = async (
  userInfo: any,
  paymentInfo: any,
  planInfo: any,
  tempUserId?: string
) => {
  const url = `${API_BASE_URL}/payment/process-payment`;

  const requestBody: {
    userInfo: any;
    paymentInfo: any;
    planInfo: any;
    tempUserId?: string;
  } = {
    userInfo,
    paymentInfo,
    planInfo,
  };

  if (tempUserId) {
    requestBody.tempUserId = tempUserId;
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Payment processing failed");
  }

  return await response.json();
};

export const processOAuthPayment = async (
  userId: string,
  userInfo: any,
  paymentInfo: any,
  planInfo: any
) => {
  const url = `${API_BASE_URL}/payment/process-oauth-payment`;

  console.log("🔐 Processing OAuth payment...");
  console.log("User ID:", userId);
  console.log("User Info:", userInfo);
  console.log("Payment Info:", paymentInfo);
  console.log("Plan Info:", planInfo);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      userInfo,
      paymentInfo,
      planInfo,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("❌ OAuth payment failed:", errorData);
    throw new Error(errorData.message || "OAuth payment processing failed");
  }

  const result = await response.json();
  console.log("✅ OAuth payment successful:", result);
  return result;
};

export const completeRegistrationWithPlan = async (
  tempUserData: any,
  planId: string
) => {
  const url = `${API_BASE_URL}/auth/register/complete-with-plan`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tempUserData,
      planId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Registration completion failed");
  }

  return await response.json();
};

export const checkEmailExists = async (email: string) => {
  const url = `${API_BASE_URL}/auth/check-email`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Failed to check email availability");
  }

  const result = await response.json();
  return result;
};

// ==================== FIX 6.2.5 — User Profile CRUD ====================

const getAuthToken = (): string => {
  return localStorage.getItem("auth_token") || localStorage.getItem("authToken") || "";
};

/**
 * Fetch full user profile (all fields including billing/invoice data)
 */
export const getUserProfile = async (userId: string) => {
  const url = `${API_BASE_URL}/users/${userId}/profile`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch user profile");
  }

  return await response.json();
};

/**
 * Update full user profile (including billing/invoice fields)
 */
export const updateUserProfileFull = async (userId: string, profileData: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  jobTitle?: string;
  vatNumber?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
}) => {
  const url = `${API_BASE_URL}/users/${userId}/profile`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update user profile");
  }

  return await response.json();
};