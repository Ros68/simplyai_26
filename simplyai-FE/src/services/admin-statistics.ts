import { API_BASE_URL } from "@/config/api";

// ── Helper ────────────────────────────────────────────────────────────────────
function buildQuery(dateRange: any = null, filters: any = {}, extra: any = {}): string {
  const params = new URLSearchParams();
  if (dateRange?.from) params.set("from", new Date(dateRange.from).toISOString());
  if (dateRange?.to)   params.set("to",   new Date(dateRange.to).toISOString());
  Object.entries(filters).forEach(([k, v]) => { if (v && v !== "all") params.set(k, v as string); });
  Object.entries(extra).forEach(([k, v])   => { if (v) params.set(k, v as string); });
  const q = params.toString();
  return q ? `?${q}` : "";
}

async function apiGet<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.statistics ?? data.data ?? data ?? fallback;
  } catch (error) {
    console.error("admin-statistics fetch error:", url, error);
    return fallback;
  }
}

// ── User Statistics ───────────────────────────────────────────────────────────
export const fetchUserStatistics = async (dateRange: any = null, filters: any = {}) => {
  const fallback = {
    totalUsers: 0,
    newUsersThisMonth: 0,
    usersByRole: [],
    usersByPlan: [],
    registrationTrend: [],
  };
  return apiGet(`${API_BASE_URL}/admin/statistics/users${buildQuery(dateRange, filters)}`, fallback);
};

// ── Questionnaire Statistics ──────────────────────────────────────────────────
export const fetchQuestionnaireStatistics = async (dateRange: any = null, filters: any = {}) => {
  const fallback = {
    totalQuestionnaires: 0,
    totalResponses: 0,
    completedQuestionnaires: 0,
    completionRate: 0,
    responsesPerQuestionnaire: [],
    responseTrend: [],
  };
  return apiGet(
    `${API_BASE_URL}/admin/statistics/questionnaires${buildQuery(dateRange, filters)}`,
    fallback
  );
};

// ── Subscription Statistics ───────────────────────────────────────────────────
export const fetchSubscriptionStatistics = async (dateRange: any = null, filters: any = {}) => {
  const fallback = {
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    subscriptionsByPlan: [],
    subscriptionTrend: [],
  };
  return apiGet(
    `${API_BASE_URL}/admin/statistics/subscriptions${buildQuery(dateRange, filters)}`,
    fallback
  );
};

// ── Question Answer Stats ─────────────────────────────────────────────────────
export const fetchQuestionAnswerStats = async (
  questionId: string,
  dateRange: any = null,
  filters: any = {}
) => {
  const fallback = { questionText: "No data", totalResponses: 0, answerDistribution: [] };
  return apiGet(
    `${API_BASE_URL}/admin/statistics/question-answers${buildQuery(dateRange, filters, { questionId })}`,
    fallback
  );
};

// ── All Questions (for dropdown) ──────────────────────────────────────────────
export const fetchAllQuestions = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/statistics/questions`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to fetch questions");
    return result.questions || [];
  } catch (error) {
    console.error("Error fetching questions:", error);
    return []; // Return empty array instead of throwing — prevents page crash
  }
};

// ── Demographic Data ──────────────────────────────────────────────────────────
export const fetchDemographicData = async (
  field: string,
  dateRange: any = null,
  filters: any = {}
) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/statistics/demographics${buildQuery(dateRange, filters, { field })}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.demographics || [];
  } catch (error) {
    console.error(`Error fetching demographic data for ${field}:`, error);
    return [];
  }
};

// ── Available Filters ─────────────────────────────────────────────────────────
export const fetchAvailableFilters = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/statistics/filters`);
    if (!res.ok) return {};
    const data = await res.json();
    return data.filters || {};
  } catch (error) {
    console.error("Error fetching available filters:", error);
    return {};
  }
};

// ── Age Distribution ──────────────────────────────────────────────────────────
export const fetchAgeDistribution = async (dateRange: any = null, filters: any = {}) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/statistics/age-distribution${buildQuery(dateRange, filters)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    // Agar backend mein birth_date column nahi to empty rows return karo (crash nahi)
    if (!data.ageDistribution || data.ageDistribution.length === 0) {
      return [
        { age_group: "18-24", count: 0 },
        { age_group: "25-34", count: 0 },
        { age_group: "35-44", count: 0 },
        { age_group: "45-54", count: 0 },
        { age_group: "55+",   count: 0 },
      ];
    }
    return data.ageDistribution;
  } catch (error) {
    console.error("Error fetching age distribution:", error);
    return [];
  }
};

// ── Retention Data ────────────────────────────────────────────────────────────
export const fetchRetentionData = async (dateRange: any = null) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/statistics/retention${buildQuery(dateRange)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.retentionData || [];
  } catch (error) {
    console.error("Error fetching retention data:", error);
    return [];
  }
};

// ── Completion by Demographic ─────────────────────────────────────────────────
export const fetchCompletionByDemographic = async (
  demographic: string = "role",
  dateRange: any = null
) => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/statistics/completion-by-demographic${buildQuery(
        dateRange,
        {},
        { field: demographic }
      )}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.completionByDemographic || [];
  } catch (error) {
    console.error(`Error fetching completion data by ${demographic}:`, error);
    return [];
  }
};