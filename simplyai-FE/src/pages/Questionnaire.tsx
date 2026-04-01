/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainNavigation from "@/components/MainNavigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/config/api";
import { Survey } from "survey-react-ui";
import { Model, Serializer } from "survey-core";
import "../assets/surveyjs-defaultV2.min.css";
import ReactModal from "react-modal";
import { registerCustomProperties } from "@/lib/surveyjs-properties";
import { saveQuestionnaireCompletion } from "@/services/questionnaireService";

const Questionnaire = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [surveyJson, setSurveyJson] = useState<any>(null);
  const [originalFormData, setOriginalFormData] = useState<any>(null);
  const [layoutData, setLayoutData] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [guideModal, setGuideModal] = useState<{
    open: boolean;
    content: string;
    loading: boolean;
    error: string;
    questionName: string | null;
  }>({
    open: false,
    content: "",
    loading: false,
    error: "",
    questionName: null,
  });
  const [sidebarText, setSidebarText] = useState("Hover over questions to see lesson content.");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [progress, setProgress] = useState(0);
  const [survey, setSurvey] = useState<Model | null>(null);
  const [showSaveDraftModal, setShowSaveDraftModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const isOnFinalPage = currentPage === totalPages - 1;

  useEffect(() => {
    registerCustomProperties();
  }, []);

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user?.id) return;
      const endpoints = [
        `${API_BASE_URL}/users/${user.id}/subscription`,
        `${API_BASE_URL}/plans/user-subscription?userId=${user.id}`,
        `${API_BASE_URL}/subscriptions/user/${user.id}`,
      ];
      let foundPlanId: string | null = null;
      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const result = await res.json();
          const pid =
            result.data?.planId || result.data?.plan_id || result.data?.plan?.id || result.planId || result.plan_id;
          if (pid) { foundPlanId = pid; break; }
        } catch { }
      }
      setPlanId(foundPlanId || "__no_plan__");
    };
    fetchUserPlan();
  }, [user?.id]);

  useEffect(() => {
    const injectOldUIStyles = () => {
      const styleId = "surveyjs-old-ui-style";
      let styleTag = document.getElementById(styleId);
      if (styleTag) styleTag.remove();

      styleTag = document.createElement("style");
      styleTag.id = styleId;
      styleTag.innerHTML = `
        .sv-container-modern, .sv-root, .sv-body { background: transparent !important; border: none !important; box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; margin: 0 !important; }
        .sv-page { background: #ffffff !important; border: 1px solid #e5e7eb !important; border-radius: 0.5rem !important; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important; overflow: hidden !important; margin: 0 !important; }
        .sv-question { background: transparent !important; border: none !important; margin: 0 !important; padding: 0 !important; }
        .sv-question__title, .sv-question__title .sv-string-viewer { font-size: 1.25rem !important; font-weight: 600 !important; line-height: 1.75rem !important; color: #111827 !important; padding: 1.5rem 1.5rem 0.5rem 1.5rem !important; margin: 0 !important; border-bottom: none !important; }
        .sv-question__content { padding: 0 1.5rem 0 1.5rem !important; margin: 0 !important; }
        .sv-selectbase { margin-top: 1rem !important; }
        .sv-selectbase__item { display: flex !important; align-items: center !important; padding: 1rem !important; margin-bottom: 0.75rem !important; border: 2px solid #e5e7eb !important; border-radius: 0.75rem !important; background: #ffffff !important; cursor: pointer !important; transition: all 0.2s ease-in-out !important; }
        .sv-selectbase__item:hover { border-color: #d8b4fe !important; background-color: #faf5ff !important; }
        .sv-selectbase__item--checked, .sv-selectbase__item--selected { border-color: #9333ea !important; background-color: #faf5ff !important; }
        .sv-selectbase__item input[type="radio"], .sv-selectbase__item input[type="checkbox"] { margin-right: 0.75rem !important; accent-color: #9333ea !important; }
        .sv-selectbase__item .sv-string-viewer { font-size: 0.875rem !important; color: #374151 !important; cursor: pointer !important; flex: 1 !important; padding: 0 !important; margin: 0 !important; }
        .sv-text, .sv-comment { width: 100% !important; min-height: 150px !important; padding: 1rem !important; border: 2px solid #e5e7eb !important; border-radius: 0.75rem !important; margin-top: 1rem !important; font-family: inherit !important; font-size: 0.875rem !important; line-height: 1.5 !important; resize: vertical !important; }
        .sv-text:focus, .sv-comment:focus { outline: none !important; border-color: #c084fc !important; box-shadow: 0 0 0 3px rgba(196, 132, 252, 0.1) !important; }
        .sv-text::placeholder, .sv-comment::placeholder { color: #9ca3af !important; }
        .sv-action-bar { display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 1.5rem !important; border-top: 1px solid #e5e7eb !important; background: #ffffff !important; margin: 0 !important; }
        .sv-action-bar .sv-action-bar-item { margin: 0 !important; }
        .sv-action-bar .sv-action-bar-item:not(:last-child) { margin-right: 0.5rem !important; }
        .sv-action-bar input[type="button"] { display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 0.5rem !important; font-size: 0.875rem !important; font-weight: 500 !important; line-height: 1.25rem !important; border-radius: 0.375rem !important; padding: 0.5rem 1rem !important; transition: all 0.2s ease-in-out !important; cursor: pointer !important; border: 1px solid transparent !important; min-height: 2.25rem !important; }
        .sv-action-bar input[type="button"][value*="Previous"], .sv-action-bar input[value*="Previous"], input[type="button"][value*="Previous"] { background: #ffffff !important; border: 2px solid #9333ea !important; color: #9333ea !important; font-weight: 600 !important; }
        .sv-action-bar input[type="button"][value*="Previous"]:hover:not(:disabled), .sv-action-bar input[value*="Previous"]:hover:not(:disabled), input[type="button"][value*="Previous"]:hover:not(:disabled) { background: #faf5ff !important; border-color: var(--color-primary) !important; color: var(--color-primary) !important; }
        .sv-action-bar input[type="button"]:not([value*="Previous"]), .sv-action-bar input[value*="Next"], .sv-action-bar input[value*="Submit"], input[type="button"][value*="Next"], input[type="button"][value*="Submit"] { background: #9333ea !important; color: #ffffff !important; border: 1px solid #9333ea !important; font-weight: 600 !important; display: none !important; }
        .sv-action-bar input[type="button"]:disabled { opacity: 0.5 !important; cursor: not-allowed !important; }
        .sv-progress, .sv-progress-bar, .sv-header { display: none !important; }
        .sv-page__content, .sv-question__header { margin: 0 !important; padding: 0 !important; }
        .sv-question, .sv-question__content, .sv-question__title { pointer-events: auto !important; }
        .sv-question__description { padding: 0 1.5rem !important; margin-bottom: 1rem !important; }
        .sv-question__description .sv-string-viewer { background: #dbeafe !important; color: #1e40af !important; padding: 0.75rem !important; border-radius: 0.375rem !important; font-size: 0.875rem !important; font-weight: normal !important; }
        .questionnaire-sidebar { background: #ffffff !important; border: 1px solid #e5e7eb !important; border-radius: 0.5rem !important; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important; padding: 1.5rem !important; position: sticky !important; top: 6rem !important; max-height: calc(100vh - 8rem) !important; overflow-y: auto !important; }
        .questionnaire-sidebar h3 { font-size: 1.125rem !important; font-weight: 600 !important; color: #111827 !important; margin: 0 0 1rem 0 !important; }
        .questionnaire-sidebar .guide-content h4 { font-size: 1rem !important; font-weight: 600 !important; color: #374151 !important; margin: 0 0 0.5rem 0 !important; }
        .questionnaire-sidebar .guide-content p { font-size: 0.875rem !important; color: #6b7280 !important; line-height: 1.5 !important; margin: 0 !important; transition: all 0.2s ease-in-out !important; }
        .questionnaire-sidebar .space-y-3 > div { background: #f9fafb !important; border: 1px solid #e5e7eb !important; border-radius: 0.375rem !important; padding: 0.75rem !important; }
        .questionnaire-sidebar .space-y-3 p { margin: 0 !important; font-size: 0.875rem !important; }
        .questionnaire-sidebar .space-y-3 p.font-medium { font-weight: 500 !important; color: #111827 !important; }
        .questionnaire-sidebar .space-y-3 p.text-xs { font-size: 0.75rem !important; color: #6b7280 !important; }
        @media (max-width: 768px) { .sv-action-bar { flex-direction: column !important; gap: 0.75rem !important; } .sv-action-bar input[type="button"] { width: 100% !important; } .questionnaire-sidebar { margin-top: 1.5rem !important; position: relative !important; top: auto !important; max-height: none !important; overflow-y: visible !important; } .progress-steps { flex-wrap: wrap; gap: 0.5rem; } .progress-step { min-width: 1.5rem; } }
      `;

      document.head.appendChild(styleTag);
    };

    injectOldUIStyles();
    const timeout1 = setTimeout(injectOldUIStyles, 100);
    return () => {
      clearTimeout(timeout1);
      const styleTag = document.getElementById("surveyjs-old-ui-style");
      if (styleTag) styleTag.remove();
    };
  }, []);

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/forms/${id}`);
        if (!res.ok) throw new Error("Questionnaire not found");
        const result = await res.json();
        if (!result.success || !result.data) throw new Error("Invalid API response structure");
        const data = result.data;

        setOriginalFormData(data);
        setSurveyJson(data.questions);
        setTitle(data.title || "");
        setDescription(data.description || "");

        try {
          const layoutRes = await fetch(`${API_BASE_URL}/forms/${id}/layout`);
          if (layoutRes.ok) {
            const layoutResult = await layoutRes.json();
            if (layoutResult.success) setLayoutData(layoutResult.data);
          }
        } catch (err) { console.error("Error fetching form layout:", err); }
      } catch (error) {
        toast({ title: "Errore", description: "Impossibile caricare il questionario", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchQuestionnaire();
  }, [id, toast]);

  const handleSaveDraft = () => setShowSaveDraftModal(true);

  const handleConfirmSaveDraft = async () => {
    if (!user || !id) { toast({ title: "Errore", description: "Informazioni utente mancanti", variant: "destructive" }); return; }
    try {
      const response = await fetch(`${API_BASE_URL}/save-questionnaire-completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, questionnaire_id: id, questionnaire_title: title || "Questionario", responses: survey?.data, status: "draft", created_at: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error("Failed to save draft");
      setShowSaveDraftModal(false);
      toast({ title: "Salvato in Bozza", description: "Il questionario è stato salvato con successo" });
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      setShowSaveDraftModal(false);
      toast({ title: "Errore", description: "Impossibile salvare il questionario", variant: "destructive" });
    }
  };

  const handleSubmitQuestionnaire = () => setShowSubmitModal(true);

  useEffect(() => {
    const loadDraftIfExists = async () => {
      if (!user || !id || !survey) return;
      try {
        const response = await fetch(`${API_BASE_URL}/get-questionnaire-draft/${user.id}/${id}`);
        if (!response.ok) return;
        const result = await response.json();
        if (result.success && result.draft && result.draft.answers) {
          survey.data = result.draft.answers;
          toast({ title: "Bozza Caricata", description: `Hai una bozza salvata il ${new Date(result.draft.updated_at).toLocaleDateString("it-IT")}` });
        }
      } catch (error) {}
    };
    if (survey) loadDraftIfExists();
  }, [user, id, survey]);

  const handleConfirmSubmit = async () => {
    if (!user || !id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/save-questionnaire-completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, questionnaire_id: id, questionnaire_title: title || "Questionario", responses: survey?.data, status: "completed", created_at: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error("Failed to submit");
      setShowSubmitModal(false);
      await handleSurveyComplete(survey!);
    } catch (error) {
      setShowSubmitModal(false);
      toast({ title: "Errore", description: "Errore durante l'invio", variant: "destructive" });
    }
  };

  const handleSurveyComplete = async (sender: Model) => {
    if (!user || !id) return;
    const effectivePlanId = (!planId || planId === "__no_plan__") ? null : planId;
    try {
      const success = await saveQuestionnaireCompletion({ user_id: user.id, questionnaire_id: id, questionnaire_title: title || "Questionario", responses: sender.data, completed_at: new Date().toISOString() });
      if (!success) throw new Error("Failed to save");
      toast({ title: "Questionario inviato", description: "Generazione del report in corso..." });

      let templateData: any = null;
      if (effectivePlanId) {
        try {
          const res = await fetch(`${API_BASE_URL}/prompt-templates/plan/${effectivePlanId}/questionnaire/${id}`);
          const resData = await res.json();
          if (resData.success && resData.data && resData.data.length > 0) templateData = resData.data[0];
        } catch (e) {}
      }

      const aiResponse = await fetch(`${API_BASE_URL}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionnaireId: id, responses: sender.data, userId: user.id, title: title || "Generated Report", planId: effectivePlanId, templateData: templateData }),
      });

      if (!aiResponse.ok) {
        toast({ title: "Questionario completato", description: "Risposte salvate." });
        setTimeout(() => navigate("/dashboard"), 1500);
        return;
      }

      const aiResult = await aiResponse.json();
      toast({ title: "Report generato!", description: "Il tuo report è pronto." });
      const reportId = aiResult.reportId || aiResult.id || aiResult.report?.id;
      setTimeout(() => { if (reportId) navigate(`/report/${reportId}`); else navigate("/dashboard"); }, 1000);
    } catch (error) {
      toast({ title: "Errore", description: "Errore durante l'invio", variant: "destructive" });
    }
  };

  useEffect(() => {
    const forceButtonStyles = () => {
      const styleId = "force-purple-buttons";
      let styleTag = document.getElementById(styleId);
      if (styleTag) styleTag.remove();

      styleTag = document.createElement("style");
      styleTag.id = styleId;
      styleTag.innerHTML = `
        button[title*="Previous"], input[value*="Previous"], .sv_nav input[value*="Previous"], .sv-action-bar input[value*="Previous"], .sv-footer input[value*="Previous"] {
          background: #ffffff !important; color: #9333ea !important; border: 2px solid #9333ea !important; font-weight: 600 !important; border-radius: 6px !important; transition: all 0.2s ease-in-out !important;
        }
        button[title*="Previous"]:hover, input[value*="Previous"]:hover, .sv_nav input[value*="Previous"]:hover, .sv-action-bar input[value*="Previous"]:hover, .sv-footer input[value*="Previous"]:hover {
          background: #faf5ff !important; color: var(--color-primary) !important; border-color: var(--color-primary) !important;
        }
        button[title*="Next"], input[value*="Next"], input[value*="Submit"], .sv_nav input[value*="Next"], .sv_nav input[value*="Submit"], .sv-action-bar input[value*="Next"], .sv-action-bar input[value*="Submit"], .sv-footer input[value*="Next"], .sv-footer input[value*="Submit"] {
          display: none !important;
        }
      `;
      document.head.appendChild(styleTag);
    };

    forceButtonStyles();
    const observer = new MutationObserver(() => { setTimeout(forceButtonStyles, 100); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); document.getElementById("force-purple-buttons")?.remove(); };
  }, [survey]);

  useEffect(() => {
    if (!surveyJson) { setSurvey(null); return; }
    const newSurvey = new Model(surveyJson);
    if (!newSurvey) return;

    const updateProgress = () => {
      const currentPageNo = newSurvey.currentPageNo;
      const totalPagesCount = (newSurvey.pages?.filter((page) => page.isVisible) || []).length;
      setCurrentPage(currentPageNo); setTotalPages(totalPagesCount);
      let progressPercentage = 0;
      if (totalPagesCount > 0) {
        if (totalPagesCount === 1) progressPercentage = 100;
        else progressPercentage = (currentPageNo / (totalPagesCount - 1)) * 100;
      }
      setProgress(Math.min(100, Math.max(0, progressPercentage)));
    };

    const handleVisibilityChanged = () => updateProgress();

    try {
      if (newSurvey.onCurrentPageChanged) newSurvey.onCurrentPageChanged.add(() => updateProgress());
      if (newSurvey.onElementVisibilityChanged) newSurvey.onElementVisibilityChanged.add(handleVisibilityChanged);
      if (newSurvey.onQuestionVisibilityChanged) newSurvey.onQuestionVisibilityChanged.add(handleVisibilityChanged);
      if (newSurvey.onAfterPageDisplayed) newSurvey.onAfterPageDisplayed.add(handleVisibilityChanged);
    } catch (error) { }

    const questionMap = new Map();
    if (originalFormData?.questions?.pages) {
      originalFormData.questions.pages.forEach((page: any) => {
        if (page.elements) { page.elements.forEach((element: any) => { questionMap.set(element.name, element); }); }
      });
    }

    newSurvey.onAfterRenderQuestion.add((survey, options) => {
      const titleEl = options.htmlElement.querySelector(".sv-string-viewer, .sv-question__title");
      const originalQuestionData = questionMap.get(options.question.name);

      setTimeout(() => {
        if (originalQuestionData && originalQuestionData.questionImage) {
          const existingImage = options.htmlElement.querySelector(".questionnaire-question-image");
          if (existingImage) existingImage.remove();
          const imageContainer = document.createElement("div");
          imageContainer.className = "questionnaire-question-image";
          imageContainer.style.cssText = "margin: 0 0 1rem 0; padding: 0; text-align: center; background: #f8f9fa; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;";
          imageContainer.innerHTML = `<img src="${originalQuestionData.questionImage}" alt="Question Image" style="max-width: 100%; height: auto; max-height: 300px; object-fit: contain; display: block; margin: 0 auto; border-radius: 8px;"/>`;
          const questionContent = options.htmlElement.querySelector(".sv-question__content");
          if (questionContent) questionContent.insertBefore(imageContainer, questionContent.firstChild);
          else options.htmlElement.insertBefore(imageContainer, options.htmlElement.firstChild);
        }
      }, 50);

      const handleMouseEnter = (e: any) => {
        e.stopPropagation();
        const guideContent = document.querySelector(".questionnaire-sidebar .guide-content p");
        if (guideContent) { guideContent.textContent = originalQuestionData?.lesson || options.question.lesson || "No lesson for this question."; }
      };
      const handleMouseLeave = (e: any) => {
        e.stopPropagation();
        setTimeout(() => {
          const guideContent = document.querySelector(".questionnaire-sidebar .guide-content p");
          if (guideContent) guideContent.textContent = "Hover over questions to see lesson content.";
        }, 50);
      };
      options.htmlElement.addEventListener("mouseenter", handleMouseEnter, { passive: true });
      options.htmlElement.addEventListener("mouseleave", handleMouseLeave, { passive: true });

      if (titleEl && !titleEl.querySelector(".sv-question-help-icon")) {
        const span = document.createElement("span");
        span.className = "sv-question-help-icon";
        span.style.display = "inline-block";
        span.style.verticalAlign = "middle";
        span.style.cursor = "pointer";
        span.title = "Lesson";
        span.innerHTML = `
          <svg width="18" height="18" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="margin-left:4px;vertical-align:middle;">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 3-3 3"/>
            <path d="M12 17h.01"/>
          </svg>
        `;
        span.onclick = (e) => {
          e.stopPropagation();
          const guideText = originalQuestionData?.guide || options.question.guide || "";
          setGuideModal({ open: true, content: guideText, loading: false, error: guideText ? "" : "La guida non è disponibile per questa domanda", questionName: options.question.name });
        };
        titleEl.appendChild(span);
      }
    });

    newSurvey.onComplete.add(handleSurveyComplete);
    updateProgress();
    setSurvey(newSurvey);
  }, [surveyJson, originalFormData]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 w-full">
        <MainNavigation variant="questionnaire" title="Caricamento..." />
        <div className="flex justify-center items-center h-[60vh] w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!surveyJson || !survey) {
    return (
      <div className="container mx-auto p-6 w-full">
        <MainNavigation variant="questionnaire" title="Errore" />
        <div className="text-center py-12 w-full">
          <h2 className="text-2xl font-bold mb-4">Questionario non trovato</h2>
          <button className="btn bg-[var(--color-primary)] text-white px-4 py-2 rounded" onClick={() => navigate("/dashboard")}>
            Torna alla Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto w-full max-w-full">
      <MainNavigation variant="questionnaire" title={title} />
      
      {/* 🌟 FIX 9.5: Increased width (max-w-[1400px]) for much larger form area */}
      <div className="max-w-[1400px] w-full mx-auto p-4 sm:p-6">
        
        <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm w-full">
          {layoutData?.headerImageUrl && (
            <div className="mb-6">
              <img src={layoutData.headerImageUrl} alt="Header" className="w-full h-auto max-h-48 object-cover rounded-md" />
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
          {layoutData?.pageContent ? (
            <div className="prose max-w-none mb-6 w-full" dangerouslySetInnerHTML={{ __html: layoutData.pageContent }} />
          ) : (
            description && <p className="text-gray-600 mb-6">{description}</p>
          )}
          {layoutData?.instructions && (
            <div className="bg-[var(--color-primary-50)] text-[var(--color-primary-700)] p-4 rounded-md mb-4 border border-[var(--color-primary-100)] w-full">
              <strong>Istruzioni:</strong> {layoutData.instructions}
            </div>
          )}
        </div>

        {/* 🌟 FIX 9.5: Using lg:grid-cols-4 and lg:col-span-3 to make the form area significantly larger */}
        <div className="grid lg:grid-cols-4 gap-6 w-full">
          <div className="lg:col-span-3 w-full">
            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-600">Page {currentPage + 1} of {totalPages}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-[var(--color-primary)] h-3 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
              {totalPages > 1 && (
                <div className="progress-steps flex justify-between mt-3 w-full">
                  {Array.from({ length: totalPages }, (_, index) => (
                    <div key={index} className={`progress-step flex items-center ${index <= currentPage ? "text-[var(--color-primary)]" : "text-gray-400"}`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${index < currentPage ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white" : index === currentPage ? "border-[var(--color-primary)] bg-white text-[var(--color-primary)]" : "border-gray-300 bg-white text-gray-400"}`}>
                        {index + 1}
                      </div>
                      {index < totalPages - 1 && <div className={`flex-1 h-0.5 mx-2 ${index < currentPage ? "bg-[var(--color-primary)]" : "bg-gray-300"}`}></div>}
                    </div>
                  ))}
                </div>
              )}
              {progress >= 100 && (
                <div className="mt-3 text-center"><span className="text-sm font-medium text-green-600">✓ Survey Complete!</span></div>
              )}
            </div>

            <div className="w-full">
              <Survey model={survey} />
            </div>

            <div className="flex justify-center gap-3 mt-2 mb-4 custom-survey-actions w-full">
              <button onClick={handleSaveDraft} className="px-6 py-2.5 border-2 border-[var(--color-primary)] text-[var(--color-primary)] bg-white rounded-lg hover:bg-[var(--color-primary-50)] transition-colors text-sm font-medium shadow-sm">
                Salva in Bozza
              </button>
              {isOnFinalPage ? (
                <button onClick={handleSubmitQuestionnaire} className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-colors font-medium shadow-md text-sm border-none">
                  Invia
                </button>
              ) : (
                <button onClick={() => survey && survey.nextPage()} className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-colors font-medium shadow-md text-sm border-none">
                  Successivo
                </button>
              )}
            </div>
            
            {layoutData?.footerContent && (
              <div className="mt-8 pt-8 border-t border-gray-200 w-full">
                <div className="prose max-w-none w-full" dangerouslySetInnerHTML={{ __html: layoutData.footerContent }} />
              </div>
            )}
          </div>

          <div className="lg:col-span-1 w-full">
            <div className="questionnaire-sidebar w-full">
              <h3>Informazioni Domanda</h3>
              <div className="guide-content">
                <h4>Lessons</h4>
                <p>{sidebarText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals remain unchanged... */}
      <ReactModal isOpen={guideModal.open} onRequestClose={() => setGuideModal({ ...guideModal, open: false })} ariaHideApp={false} className="fixed inset-0 flex items-center justify-center z-50 outline-none" overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40">
        <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
          <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => setGuideModal({ ...guideModal, open: false })} aria-label="Chiudi">&times;</button>
          {guideModal.loading ? (
            <div className="text-center py-8">Caricamento...</div>
          ) : guideModal.error ? (
            <div className="text-center text-red-500 py-8">{guideModal.error}</div>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-4">Lesson / Guide</h2>
              <div className="text-gray-700 whitespace-pre-line">{guideModal.content}</div>
            </div>
          )}
        </div>
      </ReactModal>

      <ReactModal isOpen={showSaveDraftModal} onRequestClose={() => setShowSaveDraftModal(false)} ariaHideApp={false} className="fixed inset-0 flex items-center justify-center z-50 outline-none" overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => setShowSaveDraftModal(false)}>&times;</button>
          <h2 className="text-xl font-bold mb-4">Salvataggio in Bozza</h2>
          <p className="text-gray-600 mb-6">Salvando in Draft non perdite le domande già risposte, puoi sospendere il questionario, riprenderlo e cambiare alcune risposte.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowSaveDraftModal(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Annulla</button>
            <button onClick={handleConfirmSaveDraft} className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-colors border-none">Conferma</button>
          </div>
        </div>
      </ReactModal>

      <ReactModal isOpen={showSubmitModal} onRequestClose={() => setShowSubmitModal(false)} ariaHideApp={false} className="fixed inset-0 flex items-center justify-center z-50 outline-none" overlayClassName="fixed inset-0 bg-black bg-opacity-40 z-40">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={() => setShowSubmitModal(false)}>&times;</button>
          <h2 className="text-xl font-bold mb-4">Invio Questionario</h2>
          <p className="text-gray-600 mb-6">ATTENZIONE: Il pulsante Invia salva definitivamente il questionario e attiva l'elaborazione del report definitivo.</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowSubmitModal(false)} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Annulla</button>
            <button onClick={handleConfirmSubmit} className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-colors font-medium border-none">Invia</button>
          </div>
        </div>
      </ReactModal>
    </div>
  );
};

export default Questionnaire;