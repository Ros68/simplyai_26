import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Save } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import QuestionSaveConfirmation from '../questionSaveConfirmation';
import { HelpCircle } from 'lucide-react';
import { fetchQuestionnaireCompletions, transformCompletionHistory } from '@/services/questionnaireService';
import { API_BASE_URL } from '@/config/api';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'choice' | 'multiple' | 'imagepicker';
  options?: Array<string | { label?: string; text?: string; value: string; score?: number; imageLink?: string }>;
  guide?: string;
  questionImage?: string;  // URL or base64 image shown above the question
}

interface QuestionnaireAccess {
  id: string;
  title: string;
  description?: string;
  isAvailable: boolean;
  nextAvailableDate?: string;
  completionCount: number;
  lastCompletedDate?: string;
  accessReason?: string;
  waitingPeriodDays?: number;
}

interface PlanOptions {
  reminderCount: number;
  maxRepetitions: number;
  reminderMessage: string;
  minWaitingPeriod: number;
  reminderFrequency: string;
  verificationAfter: boolean;
  emailNotifications: boolean;
  reminderDaysBefore: number;
  verificationPeriod: number;
  singleQuestionnaire: boolean;
  multipleQuestionnaires: boolean;
  periodicQuestionnaires: boolean;
  progressQuestionnaires: boolean;
}

// Default safe plan — used when no subscription is found so questionnaire still works
const DEFAULT_PLAN: PlanOptions = {
  reminderCount: 1,
  maxRepetitions: 1,
  reminderMessage: "È il momento di completare il tuo questionario!",
  minWaitingPeriod: 7,
  reminderFrequency: "once",
  verificationAfter: false,
  emailNotifications: false,
  reminderDaysBefore: 7,
  verificationPeriod: 30,
  singleQuestionnaire: true,
  multipleQuestionnaires: false,
  periodicQuestionnaires: false,
  progressQuestionnaires: false,
};

const QuestionnaireView = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id: questionnaireId } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionnaireTitle, setQuestionnaireTitle] = useState('Questionario di Valutazione');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [guidePopoverOpen, setGuidePopoverOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<PlanOptions>(DEFAULT_PLAN);
  const [questionnaireAccess, setQuestionnaireAccess] = useState<QuestionnaireAccess[]>([]);

  // ── Load questionnaire + plan on mount ──────────────────────────────────
  useEffect(() => {
    const loadAll = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        await Promise.all([
          loadQuestionnaire(),
          loadUserPlan(),
        ]);
      } catch (error) {
        console.error('Errore caricamento:', error);
        toast({ variant: 'destructive', title: 'Errore', description: 'Non è stato possibile caricare il questionario' });
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, [user]);

  // ── Load questionnaire questions from REST API ────────────────────────
  const loadQuestionnaire = async () => {
    if (!questionnaireId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/questionnaires/${questionnaireId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && (data.questionnaire || data.data)) {
        const q = data.questionnaire || data.data;
        setQuestionnaireTitle(q.title || 'Questionario');

        // Parse questions — could be SurveyJS JSON {pages:[{elements:[...]}]} or plain array
        let rawQuestions: any[] = [];
        let parsed = q.questions;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch { parsed = []; }
        }

        // SurveyJS format: { pages: [{ elements: [...] }] }
        if (parsed && parsed.pages && Array.isArray(parsed.pages)) {
          parsed.pages.forEach((page: any) => {
            if (page.elements && Array.isArray(page.elements)) {
              rawQuestions = rawQuestions.concat(page.elements);
            }
          });
        } else if (Array.isArray(parsed)) {
          rawQuestions = parsed;
        }

        // Map SurveyJS elements to our Question interface
        const qs: Question[] = rawQuestions.map((el: any) => {
          const type = el.type === 'checkbox' ? 'multiple'
            : el.type === 'imagepicker' ? 'imagepicker'
            : (el.type === 'radiogroup' || el.type === 'dropdown') ? 'choice'
            : el.type === 'text' || el.type === 'comment' ? 'text'
            : 'text';

          return {
            id: el.name || el.id || `q_${Math.random()}`,
            text: el.title || el.name || '',
            type,
            options: el.choices?.map((c: any) =>
              typeof c === 'string' ? c : c
            ),
            guide: el.guide || el.description || '',
            questionImage: el.questionImage || '',
          };
        });

        setQuestions(qs);
      } else {
        // Fallback to demo questions if API returns nothing
        setQuestions(getDemoQuestions());
      }
    } catch (err) {
      console.warn('Questionnaire fetch failed, using demo questions:', err);
      setQuestions(getDemoQuestions());
    }
  };

  // ── Load user plan from MySQL REST API (NOT Supabase) ─────────────────
  const loadUserPlan = async () => {
    if (!user?.id) return;
    try {
      const authToken = token || localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
      const res = await fetch(`${API_BASE_URL}/subscriptions/user/${user.id}`, {
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        console.warn('No subscription found, using default plan');
        setUserPlan(DEFAULT_PLAN);
        return;
      }

      const data = await res.json();
      if (data.success && data.data?.plan) {
        const plan = data.data.plan;
        // plan.options or plan.option field contains PlanOptions
        let planOptions: PlanOptions = DEFAULT_PLAN;
        const raw = plan.options || plan.option;
        if (raw) {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          planOptions = { ...DEFAULT_PLAN, ...parsed };
        } else {
          // Map plan_type to boolean flags
          const pt = plan.plan_type || '';
          planOptions = {
            ...DEFAULT_PLAN,
            singleQuestionnaire: pt === 'single',
            multipleQuestionnaires: pt === 'multiple',
            periodicQuestionnaires: pt === 'periodic',
            progressQuestionnaires: pt === 'progress',
            verificationAfter: pt === 'verification',
          };
        }
        setUserPlan(planOptions);
      } else {
        setUserPlan(DEFAULT_PLAN);
      }
    } catch (err) {
      console.warn('Plan load error, using default:', err);
      setUserPlan(DEFAULT_PLAN);
    }
  };

  // ── Demo questions fallback ───────────────────────────────────────────
  const getDemoQuestions = (): Question[] => [
    {
      id: '1',
      text: 'Qual è il livello di maturità digitale della tua azienda?',
      type: 'choice',
      options: ['Base', 'Intermedio', 'Avanzato'],
      guide: 'La maturità digitale fa riferimento al livello di adozione e integrazione delle tecnologie digitali nei processi aziendali.',
    },
    {
      id: '2',
      text: 'Quali tecnologie digitali utilizzi già nella tua azienda?',
      type: 'multiple',
      options: ['CRM', 'ERP', 'E-commerce', 'Social media', 'Analisi dati', 'Cloud computing'],
      guide: 'Considera tutti i sistemi e le tecnologie attualmente in uso, anche se non utilizzate in tutti i reparti.',
    },
    {
      id: '3',
      text: 'Quali sono le principali sfide digitali che affronti?',
      type: 'text',
      guide: "Pensa alle difficoltà che la tua azienda incontra nell'adozione o nell'utilizzo di tecnologie digitali.",
    },
    {
      id: '4',
      text: 'Quanto investi annualmente in tecnologie digitali?',
      type: 'choice',
      options: ['Meno di 5.000€', 'Tra 5.000€ e 20.000€', 'Tra 20.000€ e 50.000€', 'Più di 50.000€'],
      guide: 'Considera tutti gli investimenti in hardware, software, servizi digitali e formazione del personale.',
    },
    {
      id: '5',
      text: 'Quali sono i tuoi obiettivi principali per la trasformazione digitale nei prossimi 12 mesi?',
      type: 'text',
      guide: 'I principali obiettivi che la tua azienda intende raggiungere attraverso la trasformazione digitale.',
    },
  ];

  // ── Answer handler ────────────────────────────────────────────────────
  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  // ── Save draft ─────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      const authToken = token || localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';
      await fetch(`${API_BASE_URL}/questionnaires/${questionnaireId || 'draft'}/responses`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          answers,
          status: 'draft',
          questionnaire_id: questionnaireId,
        }),
      });
      toast({ title: 'Bozza salvata', description: 'Il tuo questionario è stato salvato come bozza' });
      navigate('/dashboard');
    } catch (error) {
      console.error('Errore salvataggio bozza:', error);
      toast({ variant: 'destructive', title: 'Errore', description: 'Non è stato possibile salvare la bozza' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Submit questionnaire → save to DB → generate report ───────────────
  const handleSubmit = async () => {
    if (!user) return;
    try {
      setIsSubmitting(true);
      const authToken = token || localStorage.getItem('auth_token') || localStorage.getItem('authToken') || '';

      // 1. Save completed questionnaire response
      const saveRes = await fetch(`${API_BASE_URL}/questionnaires/${questionnaireId}/responses`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          answers,
          status: 'completed',
          questionnaire_id: questionnaireId,
        }),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.message || `Save failed: ${saveRes.status}`);
      }

      const saveData = await saveRes.json();
      const responseId = saveData.responseId || saveData.id;

      // 2. Generate AI report
      toast({ title: 'Questionario completato', description: 'Generazione del report in corso...' });

      const reportRes = await fetch(`${API_BASE_URL}/ai/generate-report`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          questionnaire_id: questionnaireId,
          response_id: responseId,
          answers,
        }),
      });

      if (!reportRes.ok) {
        // Report generation failed but questionnaire was saved — still navigate
        console.warn('Report generation failed, navigating to dashboard');
        toast({ title: 'Questionario inviato', description: 'Il report sarà disponibile a breve' });
        navigate('/dashboard?tab=reports');
        return;
      }

      const reportData = await reportRes.json();
      const reportId = reportData.reportId || reportData.id || reportData.report?.id;

      toast({ title: 'Report generato!', description: 'Il tuo report personalizzato è pronto' });

      if (reportId) {
        navigate(`/report/${reportId}`);
      } else {
        navigate('/dashboard?tab=reports');
      }
    } catch (error: any) {
      console.error("Errore nell'invio:", error);
      toast({ variant: 'destructive', title: 'Errore', description: error.message || 'Non è stato possibile inviare le risposte' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading / empty states ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <p className="text-lg">Nessun questionario disponibile al momento.</p>
            <p className="text-sm text-gray-500 mt-2">Controlla più tardi o contatta l'assistenza.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQ = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {/* ── Main questionnaire card ─── */}
      <div className="md:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>{questionnaireTitle}</CardTitle>
            <CardDescription>
              Rispondi alle domande per ricevere il tuo report personalizzato
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Domanda {currentQuestion + 1} di {questions.length}</span>
                <span className="text-sm text-gray-500">{Math.round((currentQuestion + 1) / questions.length * 100)}% completato</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                  style={{ width: `${(currentQuestion + 1) / questions.length * 100}%` }}
                />
              </div>
            </div>

            {/* Question + help button */}
            <div className="mb-8">
              {/* Question image (shown above question text) */}
              {currentQ.questionImage && (
                <div className="mb-4">
                  <img
                    src={currentQ.questionImage}
                    alt="Immagine domanda"
                    className="max-w-full max-h-64 rounded-lg border object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <h3 className="text-xl font-medium">{currentQ.text}</h3>
                {currentQ.guide && (
                  <Popover open={guidePopoverOpen} onOpenChange={setGuidePopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex-shrink-0 flex items-center justify-center rounded-full border border-blue-300 bg-white text-[var(--color-primary)] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        style={{ width: 28, height: 28 }}
                        title="Aiuto"
                      >
                        <HelpCircle className="h-5 w-5" color="#7c3aed" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs">
                      <div className="font-semibold mb-1">Guida</div>
                      <div className="text-sm text-blue-800">{currentQ.guide}</div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* Answer inputs */}
              <div className="mt-4">
                {currentQ.type === 'text' && (
                  <textarea
                    className="w-full p-3 border rounded-lg min-h-32"
                    placeholder="Scrivi la tua risposta qui..."
                    value={answers[currentQ.id] || ''}
                    onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                  />
                )}

                {currentQ.type === 'choice' && currentQ.options && (
                  <div className="space-y-2">
                    {currentQ.options.map((option, idx) => {
                      const val = typeof option === 'string' ? option : (option.value || '');
                      const label = typeof option === 'string' ? option : (option.text || option.label || option.value || '');
                      return (
                        <div
                          key={idx}
                          className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-50)]"
                          onClick={() => handleAnswer(currentQ.id, val)}
                        >
                          <input
                            type="radio"
                            id={`option-${idx}`}
                            name={`question-${currentQ.id}`}
                            checked={answers[currentQ.id] === val}
                            onChange={() => handleAnswer(currentQ.id, val)}
                            className="text-[var(--color-primary)]"
                          />
                          <label htmlFor={`option-${idx}`} className="text-gray-700 w-full cursor-pointer ml-3">{label}</label>
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQ.type === 'multiple' && currentQ.options && (
                  <div className="space-y-2">
                    {currentQ.options.map((option, idx) => {
                      const val = typeof option === 'string' ? option : (option.value || '');
                      const label = typeof option === 'string' ? option : (option.text || option.label || option.value || '');
                      const selectedOptions: string[] = answers[currentQ.id] || [];
                      const isChecked = selectedOptions.includes(val);
                      const toggle = () => {
                        handleAnswer(
                          currentQ.id,
                          isChecked
                            ? selectedOptions.filter((item) => item !== val)
                            : [...selectedOptions, val]
                        );
                      };
                      return (
                        <div
                          key={idx}
                          className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-50)]"
                          onClick={toggle}
                        >
                          <input
                            type="checkbox"
                            id={`option-multi-${idx}`}
                            className="mr-3 text-[var(--color-primary)]"
                            checked={isChecked}
                            onChange={toggle}
                          />
                          <label htmlFor={`option-multi-${idx}`} className="text-gray-700 w-full cursor-pointer">{label}</label>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* imagepicker — show image grid */}
                {currentQ.type === 'imagepicker' && currentQ.options && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {currentQ.options.map((option, idx) => {
                      const val = typeof option === 'string' ? option : (option.value || '');
                      const label = typeof option === 'string' ? option : (option.text || option.label || option.value || '');
                      const imgSrc = typeof option === 'object' ? option.imageLink || '' : '';
                      const selectedOptions: string[] = Array.isArray(answers[currentQ.id])
                        ? answers[currentQ.id]
                        : answers[currentQ.id] ? [answers[currentQ.id]] : [];
                      const isSelected = selectedOptions.includes(val);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleAnswer(currentQ.id, val)}
                          className={`cursor-pointer rounded-xl border-2 p-2 transition-all ${
                            isSelected ? 'border-[var(--color-primary)] bg-[var(--color-primary-50)]' : 'border-gray-200 hover:border-[var(--color-primary-300)]'
                          }`}
                        >
                          {imgSrc && (
                            <img
                              src={imgSrc}
                              alt={label}
                              className="w-full h-32 object-cover rounded-lg mb-2"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          )}
                          <p className="text-center text-sm text-gray-700">{label}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          {/* ── Footer: Precedente | [Salva in bozza + Successivo/Invia] | spacer ── */}
          <CardFooter className="flex items-center justify-between gap-4 border-t pt-4">
            {/* LEFT */}
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
            >
              Precedente
            </Button>

            {/* CENTER — main action buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setDraftConfirmOpen(true)}
                disabled={isSubmitting}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)] text-white border-[var(--color-primary)]"
              >
                <Save className="mr-2 h-4 w-4" />
                Salva in bozza
              </Button>

              {!isLastQuestion ? (
                <Button
                  onClick={handleNextQuestion}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)]"
                >
                  Successivo
                </Button>
              ) : (
                <Button
                  onClick={() => setSubmitConfirmOpen(true)}
                  disabled={isSubmitting}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)]"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Invio in corso...</>
                  ) : (
                    <>Invia <Send className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              )}
            </div>

            {/* RIGHT spacer — keeps center group visually centered */}
            <div className="invisible">
              <Button variant="outline" disabled>Precedente</Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* ── Right sidebar ─── */}
      <div className="md:col-span-1">
        <div className="space-y-6">
          {/* Guide panel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Informazioni Domanda</CardTitle>
            </CardHeader>
            <CardContent>
              {currentQ.guide ? (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-semibold text-sm mb-1">Guida</h4>
                  <p className="text-sm text-blue-800">{currentQ.guide}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Clicca il pulsante <span className="font-bold">?</span> per visualizzare la guida, se disponibile.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Plan info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Informazioni Piano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {userPlan.multipleQuestionnaires && (
                  <div className="bg-green-50 p-2 rounded text-green-800">
                    <strong>Piano Unlimited:</strong> Accesso illimitato a tutti i questionari
                  </div>
                )}
                {userPlan.verificationAfter && (
                  <div className="bg-blue-50 p-2 rounded text-blue-800">
                    <strong>Piano Verification:</strong> 2 accessi con periodo di verifica di {userPlan.verificationPeriod} giorni
                  </div>
                )}
                {userPlan.periodicQuestionnaires && (
                  <div className="bg-[var(--color-primary-50)] p-2 rounded text-[var(--color-primary)]">
                    <strong>Piano Periodico:</strong> Massimo {userPlan.maxRepetitions} ripetizioni con attesa di {userPlan.verificationPeriod} giorni
                  </div>
                )}
                {userPlan.progressQuestionnaires && (
                  <div className="bg-orange-50 p-2 rounded text-orange-800">
                    <strong>Piano Progressivo:</strong> Questionari sequenziali con attesa di {userPlan.minWaitingPeriod} giorni
                  </div>
                )}
                {userPlan.singleQuestionnaire && !userPlan.multipleQuestionnaires && !userPlan.verificationAfter && !userPlan.periodicQuestionnaires && !userPlan.progressQuestionnaires && (
                  <div className="bg-gray-50 p-2 rounded text-gray-700">
                    <strong>Piano Singolo:</strong> Compilazione unica del questionario
                  </div>
                )}
                {userPlan.emailNotifications && (
                  <p className="text-xs text-gray-600 mt-2">
                    📧 Notifiche email attive
                    {userPlan.reminderDaysBefore > 0 && ` (promemoria ${userPlan.reminderDaysBefore} giorni prima)`}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation dialogs */}
      <QuestionSaveConfirmation
        mode="draft"
        open={draftConfirmOpen}
        onOpenChange={setDraftConfirmOpen}
        onConfirm={handleSaveDraft}
      />
      <QuestionSaveConfirmation
        mode="submit"
        open={submitConfirmOpen}
        onOpenChange={setSubmitConfirmOpen}
        onConfirm={handleSubmit}
      />
    </div>
  );
};

export default QuestionnaireView;