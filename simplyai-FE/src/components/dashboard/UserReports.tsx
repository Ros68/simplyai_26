import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Download, ChevronDown, ChevronUp, CheckSquare } from "lucide-react";
import { fetchReportsByUser, UserReport } from "@/services/report";
import { API_BASE_URL } from "@/config/api";

// ── Types ──────────────────────────────────────────────────────────────────
interface CompletedQuestionnaire {
  id: string;
  questionnaire_id: string;
  questionnaire_title: string;
  completed_at: string;
  answers: Record<string, any>;
  pdf_url?: string | null;
}

const fetchCompletedQuestionnaires = async (
  userId: string
): Promise<CompletedQuestionnaire[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/reports/user/${userId}/completed-questionnaires`
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.success ? data.completedQuestionnaires || [] : [];
  } catch {
    return [];
  }
};

// ── Collapsible answers panel ─────────────────────────────────────────────
const AnswerPanel = ({ answers }: { answers: Record<string, any> }) => {
  const entries = Object.entries(answers || {});
  if (entries.length === 0)
    return <p className="text-sm text-white/70 italic mt-3">Nessuna risposta registrata.</p>;

  return (
    <div className="mt-3 space-y-2 border-t border-white/20 pt-3">
      <p className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-2">Risposte</p>
      {entries.map(([question, answer], idx) => (
        <div key={idx} className="bg-white rounded-md p-3 text-sm shadow-sm">
          <p className="font-medium text-gray-800 mb-1">{question}</p>
          <p className="text-gray-600">
            {Array.isArray(answer) ? answer.join(", ") : String(answer)}
          </p>
        </div>
      ))}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
export const UserReports = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [completedQuestionnaires, setCompletedQuestionnaires] = useState<CompletedQuestionnaire[]>([]);
  const [exportingReportId, setExportingReportId] = useState<string | null>(null);
  const [exportingQId, setExportingQId] = useState<string | null>(null);
  const [expandedQId, setExpandedQId] = useState<string | null>(null);

  useEffect(() => {
    const loadAll = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const [userReports, completions] = await Promise.all([
          fetchReportsByUser(user.id),
          fetchCompletedQuestionnaires(user.id),
        ]);
        setReports(userReports);
        setCompletedQuestionnaires(completions);
      } catch (error) {
        console.error("Errore nel caricamento:", error);
        toast({ variant: "destructive", title: "Errore", description: "Non è stato possibile caricare i dati" });
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, [user, toast]);

  const handleViewReport = (reportId: string) => navigate(`/report/${reportId}`);

  // ── Frontend PDF generation ──────────────────────────────────────────────
  const generatePdfFromElement = async (element: HTMLElement, filename: string) => {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`${filename.replace(/\s+/g, "_")}.pdf`);
  };

  const handleExportPDF = async (report: UserReport) => {
    try {
      setExportingReportId(report.id);
      toast({ title: "Generazione PDF…", description: "Attendere prego" });

      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:#fff;padding:40px;font-family:Inter,sans-serif;";

      const content = report.content as any;
      const aiText = content?.ai_response || content?.textSections?.intro || "";
      const title = report.title || "Report";

      container.innerHTML = `
        <h1 style="font-size:24px;font-weight:bold;margin-bottom:8px;color:#1a1a2e;">${title}</h1>
        <p style="color:#666;font-size:13px;margin-bottom:24px;">Data: ${new Date(report.created_at).toLocaleDateString("it-IT")}</p>
        <hr style="margin-bottom:24px;border-color:#e5e7eb;"/>
        <div style="font-size:14px;line-height:1.8;color:#374151;white-space:pre-wrap;">${aiText || "Contenuto del report non disponibile."}</div>
      `;

      document.body.appendChild(container);
      await generatePdfFromElement(container, title);
      document.body.removeChild(container);

      toast({ title: "PDF scaricato", description: `"${title}" scaricato con successo` });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast({ variant: "destructive", title: "Errore", description: "Non è stato possibile generare il PDF" });
    } finally {
      setExportingReportId(null);
    }
  };

  const handleDownloadQuestionnairePdf = async (q: CompletedQuestionnaire) => {
    setExportingQId(q.id);
    try {
      toast({ title: "Generazione PDF…", description: "Attendere prego" });

      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:#fff;padding:40px;font-family:Inter,sans-serif;";

      const entries = Object.entries(q.answers || {});
      const answersHtml = entries.length === 0
        ? "<p style=\'color:#999;\'>Nessuna risposta registrata.</p>"
        : entries.map(([question, answer]) => `
            <div style="margin-bottom:16px;padding:14px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;">
              <p style="font-weight:600;color:#374151;margin-bottom:6px;">${question}</p>
              <p style="color:#6b7280;">${Array.isArray(answer) ? answer.join(", ") : String(answer)}</p>
            </div>
          `).join("");

      container.innerHTML = `
        <h1 style="font-size:22px;font-weight:bold;margin-bottom:8px;color:#1a1a2e;">${q.questionnaire_title}</h1>
        <p style="color:#666;font-size:13px;margin-bottom:4px;">Data completamento: ${new Date(q.completed_at).toLocaleDateString("it-IT")}</p>
        <p style="display:inline-block;background:#dcfce7;color:#166534;padding:3px 10px;border-radius:9999px;font-size:12px;margin-bottom:24px;">Completato</p>
        <hr style="margin-bottom:24px;border-color:#e5e7eb;"/>
        <h2 style="font-size:16px;font-weight:600;margin-bottom:16px;color:#374151;">Risposte</h2>
        ${answersHtml}
      `;

      document.body.appendChild(container);
      await generatePdfFromElement(container, q.questionnaire_title);
      document.body.removeChild(container);

      toast({ title: "PDF scaricato", description: `"${q.questionnaire_title}" scaricato` });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast({ variant: "destructive", title: "Errore", description: "Non è stato possibile generare il PDF" });
    } finally {
      setExportingQId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── Section 1: Completed Questionnaires with Answers ──── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-[var(--color-secondary)]" />
            Questionari completati
          </CardTitle>
          <CardDescription>
            Visualizza le risposte fornite e scarica il PDF di ogni questionario completato
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : completedQuestionnaires.length > 0 ? (
            <div className="space-y-4">
              {completedQuestionnaires.map((q) => (
                
                <Card key={q.id} className="bg-[var(--color-secondary)] text-white border-none shadow-md">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start flex-wrap gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-base">{q.questionnaire_title}</h3>
                          {/* YAHAN BADGE KO SOLID PRIMARY COLOR DIYA HAI */}
                          <Badge className="bg-[var(--color-primary)] text-white border-none hover:opacity-90 text-xs">
                            Completato
                          </Badge>
                          {q.pdf_url && (
                            <Badge className="bg-[var(--color-primary)] text-white border-none hover:opacity-90 text-xs">
                              ✓ PDF disponibile
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm opacity-90">
                          Data: {new Date(q.completed_at).toLocaleDateString("it-IT")}
                        </p>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleDownloadQuestionnairePdf(q)}
                          disabled={exportingQId === q.id}
                          className="flex items-center bg-[var(--color-primary)] text-white hover:opacity-90 border-none"
                        >
                          {exportingQId === q.id ? (
                            <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Elaborazione…</>
                          ) : (
                            <><Download className="h-4 w-4 mr-1" />{q.pdf_url ? "Scarica PDF" : "Genera PDF"}</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setExpandedQId(expandedQId === q.id ? null : q.id)}
                          className="flex items-center bg-[var(--color-primary)] text-white hover:opacity-90 border-none"
                        >
                          {expandedQId === q.id ? (
                            <><ChevronUp className="h-4 w-4 mr-1" />Nascondi</>
                          ) : (
                            <><ChevronDown className="h-4 w-4 mr-1" />Vedi risposte</>
                          )}
                        </Button>
                      </div>
                    </div>

                    {expandedQId === q.id && <AnswerPanel answers={q.answers} />}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="mb-2">Nessun questionario completato ancora</p>
              <p className="text-sm text-gray-500">
                Compila un questionario per vedere le tue risposte qui
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 2: AI-Generated Reports ──────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--color-primary)]" />
            I miei report
          </CardTitle>
          <CardDescription>
            Visualizza e gestisci i report AI generati dai tuoi questionari
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
          ) : reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="bg-[var(--color-secondary)] text-white border-none shadow-md">
                  <CardContent className="p-6 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{report.title}</h3>
                      <div className="flex space-x-4 text-sm opacity-90 mt-1 items-center">
                        <span>Data: {new Date(report.created_at).toLocaleDateString("it-IT")}</span>
                        {report.pdf_url && (
                          <Badge className="bg-[var(--color-primary)] text-white border-none hover:opacity-90 text-xs">
                            ✓ PDF disponibile
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleExportPDF(report)}
                        disabled={exportingReportId === report.id}
                        className="flex items-center bg-[var(--color-primary)] text-white hover:opacity-90 border-none"
                      >
                        {exportingReportId === report.id ? (
                          <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Elaborazione…</>
                        ) : (
                          <><Download className="h-4 w-4 mr-1" />{report.pdf_url ? "Scarica PDF" : "Genera PDF"}</>
                        )}
                      </Button>
                      <Button onClick={() => handleViewReport(report.id)} size="sm" className="flex items-center bg-[var(--color-primary)] text-white hover:opacity-90 border-none">
                        <FileText className="h-4 w-4 mr-1" />
                        Visualizza
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="mb-4">Non hai ancora report generati</p>
              <p className="text-sm text-gray-500">
                Completa un questionario per generare un report personalizzato
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};