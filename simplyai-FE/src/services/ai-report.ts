import { supabase } from "@/integrations/supabase/client";
import { fetchPromptForQuestionnaire } from "./prompt-templates";
import type { PromptTemplate } from "@/types/supabase";

export const findBestPromptTemplate = async (userId: string, questionnaireResponseId: string): Promise<PromptTemplate | null> => {
  try {
    // Get user's active subscription
    const { data: subscriptionData } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!subscriptionData) {
      console.log('No active subscription found for user');
      return null;
    }

    // Get questionnaire response to determine sequence
    const { data: responseData } = await supabase
      .from('questionnaire_responses')
      .select('*, previous_version_id')
      .eq('id', questionnaireResponseId)
      .maybeSingle();

    if (!responseData) {
      console.log('Questionnaire response not found');
      return null;
    }

    // Count previous versions to determine sequence index
    let sequenceIndex = 0;
    if (responseData.previous_version_id) {
      const { count } = await supabase
        .from('questionnaire_responses')
        .select('id', { count: 'exact' })
        .eq('questionnaire_id', responseData.questionnaire_id)
        .eq('user_id', userId)
        .lt('created_at', responseData.created_at);

      sequenceIndex = (count || 0) + 1;
    }

    // Fetch appropriate prompt template
    const promptTemplate = await fetchPromptForQuestionnaire(
      subscriptionData.plan_id,
      responseData.questionnaire_id,
      sequenceIndex
    );

    return promptTemplate;
  } catch (error) {
    console.error('Error finding best prompt template:', error);
    return null;
  }
};

// Importiamo la libreria OpenAI
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

interface ReportGenerationParams {
  questionnaireResponseId: string;
  userId: string;
  promptTemplateId?: string;
}

interface ReportGenerationResult {
  success: boolean;
  report?: any;
  error?: string;
}

export const generateReport = async (
  params: ReportGenerationParams
): Promise<ReportGenerationResult> => {
  try {
    const { questionnaireResponseId, userId, promptTemplateId } = params;

    // Fetch questionnaire response
    const { data: questionnaireResponse, error: responseError } = await supabase
      .from("questionnaire_responses")
      .select("*")
      .eq("id", questionnaireResponseId)
      .single();

    if (responseError) {
      console.error("Error fetching questionnaire response:", responseError);
      return {
        success: false,
        error: "Failed to fetch questionnaire response.",
      };
    }

    // Fetch user subscription plan
    const { data: userSubscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (subscriptionError) {
      console.error("Error fetching user subscription:", subscriptionError);
      return {
        success: false,
        error: "Failed to fetch user subscription.",
      };
    }

    // Fetch prompt template
    let promptTemplate;
    if (promptTemplateId) {
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .eq("id", promptTemplateId)
        .single();

      if (error) {
        console.error("Error fetching prompt template:", error);
        return {
          success: false,
          error: "Failed to fetch prompt template.",
        };
      }
      promptTemplate = data;
    } else {
      promptTemplate = await findBestPromptTemplate(userId, questionnaireResponseId);
    }

    if (!promptTemplate) {
      console.log("No prompt template found, using default prompt.");
      return {
        success: false,
        error: "No prompt template found.",
      };
    }

    // Prepare prompt content
    const prompt = promptTemplate.content.replace(
      "{questionnaire_data}",
      JSON.stringify(questionnaireResponse.answers)
    );

    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-4o", // userSubscription.subscription_plans?.chatgpt_model || "gpt-4o",
      messages: [
        {
          role: "system",
          content: promptTemplate.system_prompt,
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000, // userSubscription.subscription_plans?.chatgpt_max_tokens || 2000,
      temperature: 0.7, // userSubscription.subscription_plans?.chatgpt_temperature || 0.7,
    });

    const reportContent = completion.data.choices[0].message?.content;

    // Structure the report content
    const structuredContent = structureReportContent(reportContent);

    // Save the report to the database - we'll use reports table instead of ai_reports
    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .insert([
        {
          user_id: userId,
          questionnaire_id: questionnaireResponseId,
          title: promptTemplate.title,
          content: structuredContent,
          created_at: new Date().toISOString()
        },
      ])
      .select()
      .single();

    if (reportError) {
      console.error("Error saving report:", reportError);
      return {
        success: false,
        error: "Failed to save the report.",
      };
    }

    // Generate PDF after saving the report
    const pdfUrl = await generateReportPDF(reportData.id);
    
    if (pdfUrl) {
      // Update the report with the PDF URL
      await supabase
        .from("reports")
        .update({ pdf_url: pdfUrl })
        .eq("id", reportData.id);
      
      reportData.pdf_url = pdfUrl;
    }

    return {
      success: true,
      report: reportData,
    };
  } catch (error: any) {
    console.error("Error generating report:", error);
    return {
      success: false,
      error: error.message || "Failed to generate report.",
    };
  }
};

// Funzione placeholder per la generazione del PDF
// In una implementazione reale, utilizzerai librerie come jsPDF o un servizio esterno
const generateReportPDF = async (reportId: string): Promise<string | null> => {
  try {
    // Qui andrebbe implementata la logica di generazione PDF
    // Per ora restituiamo un URL fittizio
    return `https://example.com/reports/${reportId}.pdf`;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
};

const structureReportContent = (reportContent: string | undefined) => {
  if (!reportContent) {
    return { sections: [] };
  }

  // Split the report content into sections based on headings
  const sections = reportContent.split(/(?=\n###?\s)/).map((section) => {
    const lines = section.trim().split("\n");
    const titleMatch = lines[0].match(/^###?\s(.*)$/);
    const title = titleMatch ? titleMatch[1] : "Untitled Section";
    const content = lines.slice(1).join("\n").trim();
    return { title, content };
  });

  return { sections };
};

export const getReportById = async (reportId: string) => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (error) {
      console.error("Error fetching report:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching report:", error);
    return null;
  }
};

// Funzione per generare un report completo con shortcode
export const generateReportWithShortcodes = async (
  params: ReportGenerationParams
): Promise<ReportGenerationResult> => {
  try {
    const { questionnaireResponseId, userId, promptTemplateId } = params;
    
    // Genera il report base con il testo
    const basicReportResult = await generateReport(params);
    
    if (!basicReportResult.success) {
      return basicReportResult;
    }
    
    // Estrai i dati per i grafici e le tabelle
    const { data: chartData, error: chartError } = await generateChartData(questionnaireResponseId);
    const { data: tableData, error: tableError } = await generateTableData(questionnaireResponseId);
    
    if (chartError || tableError) {
      console.error("Error generating chart or table data:", chartError || tableError);
      return {
        success: false,
        error: "Failed to generate chart or table data."
      };
    }
    
    // Aggiorna il report con i dati dei grafici e delle tabelle
    const updatedContent = {
      ...basicReportResult.report.content,
      chartSections: chartData,
      tableSections: tableData
    };
    
    // Aggiorna il report nel database
    const { data: updatedReport, error: updateError } = await supabase
      .from("reports")
      .update({ content: updatedContent })
      .eq("id", basicReportResult.report.id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Error updating report with charts and tables:", updateError);
      return {
        success: false,
        error: "Failed to update report with charts and tables."
      };
    }
    
    return {
      success: true,
      report: updatedReport
    };
  } catch (error: any) {
    console.error("Error generating report with shortcodes:", error);
    return {
      success: false,
      error: error.message || "Failed to generate report with shortcodes."
    };
  }
};

// Funzioni placeholder per generare dati per grafici e tabelle
const generateChartData = async (questionnaireResponseId: string) => {
  try {
    // In una implementazione reale, qui si elaborerebbero i dati delle risposte
    // per creare i grafici appropriati
    return {
      data: {
        "[chart_revenue]": {
          type: "bar",
          title: "Andamento Ricavi",
          data: {
            labels: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu"],
            datasets: [
              {
                label: "Ricavi 2023",
                data: [65, 59, 80, 81, 56, 55],
                backgroundColor: "#4f46e5"
              }
            ]
          }
        },
        "[chart_customers]": {
          type: "pie",
          title: "Distribuzione Clienti",
          data: {
            labels: ["Nord", "Centro", "Sud", "Estero"],
            datasets: [
              {
                data: [300, 150, 100, 50],
                backgroundColor: ["#4f46e5", "#60a5fa", "#34d399", "#fbbf24"]
              }
            ]
          }
        }
      },
      error: null
    };
  } catch (error) {
    return { data: {}, error };
  }
};

const generateTableData = async (questionnaireResponseId: string) => {
  try {
    // In una implementazione reale, qui si elaborerebbero i dati delle risposte
    // per creare le tabelle appropriate
    return {
      data: {
        "[table_summary]": {
          title: "Riepilogo Dati",
          headers: ["Categoria", "Q1", "Q2", "Q3", "Q4", "Totale"],
          rows: [
            ["Prodotto A", "€1,200", "€1,350", "€1,400", "€1,650", "€5,600"],
            ["Prodotto B", "€950", "€1,100", "€1,250", "€1,500", "€4,800"],
            ["Prodotto C", "€800", "€950", "€1,100", "€1,300", "€4,150"],
            ["Totale", "€2,950", "€3,400", "€3,750", "€4,450", "€14,550"]
          ]
        },
        "[table_growth]": {
          title: "Tasso di Crescita",
          headers: ["Periodo", "Crescita %"],
          rows: [
            ["Q1 vs Anno Prec.", "+15%"],
            ["Q2 vs Anno Prec.", "+12%"],
            ["Q3 vs Anno Prec.", "+18%"],
            ["Q4 vs Anno Prec.", "+22%"]
          ]
        }
      },
      error: null
    };
  } catch (error) {
    return { data: {}, error };
  }
};
