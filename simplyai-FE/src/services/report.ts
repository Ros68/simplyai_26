import { API_BASE_URL } from "@/config/api";

export type UserReport = {
  id: string;
  questionnaire_id: string;
  created_at: string;
  title: string;
  pdf_url: string | null;
  user_id: string;
  content: ReportData;
};

export type ReportData = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdf_url: any;
  title?: string;
  date?: string;
  sections?: {
    title: string;
    content: string;
    type: "text" | "bar-chart" | "pie-chart";
    chartData?: any[];
  }[];
  textSections?: Record<string, string>;
  chartSections?: Record<string, any>;
  tableSections?: Record<string, any>;
  ai_response?: string;
  questionnaire_id?: string;
};

// Raw report from database (before parsing)
type RawUserReport = {
  id: string;
  questionnaire_id: string;
  created_at: string;
  title: string;
  pdf_url: string | null;
  user_id: string;
  content: string; // This comes as a JSON string from MySQL
};

export const fetchReportsByUser = async (
  userId: string
): Promise<UserReport[]> => {
  try {
    console.log("Fetching reports for user:", userId);
    const response = await fetch(`${API_BASE_URL}/reports/user/${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Raw data from API:", data);

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch reports");
    }

    // Parse the content field for each report
    const parsedReports: UserReport[] = (data.reports || []).map(
      (report: RawUserReport) => {
        try {
          // Parse the content field if it's a string
          const parsedContent =
            typeof report.content === "string"
              ? JSON.parse(report.content)
              : report.content;

          return {
            ...report,
            content: parsedContent,
          };
        } catch (parseError) {
          console.error(
            "Error parsing report content for report:",
            report.id,
            parseError
          );
          // Return report with empty content if parsing fails
          return {
            ...report,
            content: {},
          };
        }
      }
    );

    console.log("Parsed reports:", parsedReports);
    return parsedReports;
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
};

export const fetchReportById = async (
  reportId: string
): Promise<ReportData | null> => {
  try {
    console.log(
      "fetchReportById - Making request to:",
      `${API_BASE_URL}/reports/${reportId}`
    );
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("fetchReportById - Response status:", response.status);

    const data = await response.json();
    console.log("fetchReportById - Raw response data:", data);

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch report");
    }

    // Parse content if it's a string
    let reportData = data.report;
    if (reportData && typeof reportData.content === "string") {
      try {
        reportData = {
          ...reportData,
          content: JSON.parse(reportData.content),
        };
      } catch (parseError) {
        console.error("Error parsing report content:", parseError);
      }
    }

    console.log("fetchReportById - Returning parsed report:", reportData);
    return reportData as ReportData;
  } catch (error) {
    console.error("Error fetching report:", error);
    return null;
  }
};

export const saveReportTemplate = async (template: {
  title: string;
  content: string;
  description?: string;
}): Promise<boolean> => {
  try {
    // For now, we'll just return true as template saving is not implemented in backend yet
    console.log("Save report template not implemented yet", template);
    return true;
  } catch (error) {
    console.error("Error saving report template:", error);
    return false;
  }
};

export const fetchLatestReportTemplate = async (): Promise<string | null> => {
  try {
    // For now, we'll just return null as template fetching is not implemented in backend yet
    console.log("Fetch latest report template not implemented yet");
    return null;
  } catch (error) {
    console.error("Error fetching report template:", error);
    return null;
  }
};
