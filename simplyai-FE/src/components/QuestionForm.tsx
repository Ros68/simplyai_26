
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, ArrowRight, Save, Send, HelpCircle } from 'lucide-react';

type AnswerOption = {
  id: string;
  text: string;
  value: number;
};

type Question = {
  id: string;
  text: string;
  type: 'single' | 'multiple' | 'scale' | 'text';
  required: boolean;
  options?: AnswerOption[];
  guide?: string;
  minScale?: number;
  maxScale?: number;
  minLabel?: string;
  maxLabel?: string;
};

type QuestionFormProps = {
  questions: Question[];
  onComplete: (answers: Record<string, any>) => void;
  onSaveDraft: (answers: Record<string, any>) => void;
};

const QuestionForm = ({ questions, onComplete, onSaveDraft }: QuestionFormProps) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [hoverTooltip, setHoverTooltip] = useState<string | null>(null);
  
  // For this demo, we'll show 2 questions per page
  const questionsPerPage = 2;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const currentQuestions = questions.slice(
    currentPage * questionsPerPage, 
    (currentPage + 1) * questionsPerPage
  );
  
  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Auto-save answers
    const updatedAnswers = { ...answers, [questionId]: value };
    localStorage.setItem('draft_answers', JSON.stringify(updatedAnswers));
  };
  
  const handleNextPage = () => {
    // Validate required questions
    const unansweredRequiredQuestions = currentQuestions.filter(q => 
      q.required && (answers[q.id] === undefined || answers[q.id] === '')
    );
    
    if (unansweredRequiredQuestions.length > 0) {
      toast({
        title: "Domande obbligatorie",
        description: "Per favore, rispondi a tutte le domande obbligatorie prima di continuare.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleSaveDraft = () => {
    onSaveDraft(answers);
    toast({
      title: "Bozza salvata",
      description: "Puoi continuare a compilare il questionario in un secondo momento.",
    });
  };
  
  const handleComplete = () => {
    // Validate required questions
    const unansweredRequiredQuestions = currentQuestions.filter(q => 
      q.required && (answers[q.id] === undefined || answers[q.id] === '')
    );
    
    if (unansweredRequiredQuestions.length > 0) {
      toast({
        title: "Domande obbligatorie",
        description: "Per favore, rispondi a tutte le domande obbligatorie prima di continuare.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentPage === totalPages - 1) {
      // Check if all required questions throughout the form have been answered
      const allUnansweredRequired = questions.filter(q => 
        q.required && (answers[q.id] === undefined || answers[q.id] === '')
      );
      
      if (allUnansweredRequired.length > 0) {
        toast({
          title: "Questionario incompleto",
          description: `Ci sono ${allUnansweredRequired.length} domande obbligatorie non risposte.`,
          variant: "destructive",
        });
        return;
      }
      
      // All validations passed, complete the form
      onComplete(answers);
    } else {
      // Not on the last page yet
      handleNextPage();
    }
  };
  
  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'single':
        return (
          <div className="space-y-3">
            {question.options?.map(option => (
              <div 
                key={option.id}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                  answers[question.id] === option.id 
                    ? 'border-simoly-purple bg-simoly-accent-purple' 
                    : 'border-simoly-gray-light hover:border-simoly-purple/30'
                }`}
                onClick={() => handleAnswer(question.id, option.id)}
              >
                {option.text}
              </div>
            ))}
          </div>
        );
        
      case 'multiple':
        return (
          <div className="space-y-3">
            {question.options?.map(option => {
              const isSelected = (answers[question.id] || []).includes(option.id);
              return (
                <div 
                  key={option.id}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-simoly-purple bg-simoly-accent-purple' 
                      : 'border-simoly-gray-light hover:border-simoly-purple/30'
                  }`}
                  onClick={() => {
                    const currentSelections = answers[question.id] || [];
                    const newSelections = isSelected
                      ? currentSelections.filter((id: string) => id !== option.id)
                      : [...currentSelections, option.id];
                    handleAnswer(question.id, newSelections);
                  }}
                >
                  {option.text}
                </div>
              );
            })}
          </div>
        );
        
      case 'scale':
        return (
          <div className="py-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm">{question.minLabel || "Minimo"}</span>
              <span className="text-sm">{question.maxLabel || "Massimo"}</span>
            </div>
            <div className="flex justify-between space-x-4">
              {Array.from({ length: (question.maxScale || 5) - (question.minScale || 1) + 1 }).map((_, idx) => {
                const value = (question.minScale || 1) + idx;
                return (
                  <div key={idx} className="flex-1">
                    <div 
                      className={`h-12 flex items-center justify-center rounded-lg border-2 cursor-pointer transition-colors ${
                        answers[question.id] === value
                          ? 'border-simoly-purple bg-simoly-accent-purple' 
                          : 'border-simoly-gray-light hover:border-simoly-purple/30'
                      }`}
                      onClick={() => handleAnswer(question.id, value)}
                    >
                      {value}
                    </div>
                    <p className="text-xs text-center mt-1">
                      {idx === 0 && (question.minLabel || '')}
                      {idx === ((question.maxScale || 5) - (question.minScale || 1)) && (question.maxLabel || '')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
        
      case 'text':
        return (
          <textarea
            className="w-full h-32 p-4 border-2 border-simoly-gray-light rounded-xl focus:border-simoly-purple focus:ring-simoly-purple"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswer(question.id, e.target.value)}
            placeholder="Scrivi la tua risposta qui..."
          ></textarea>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-simoly-gray-dark">
            Pagina {currentPage + 1} di {totalPages}
          </p>
          <p className="text-sm text-simoly-gray-dark">
            {Math.min((currentPage + 1) * questionsPerPage, questions.length)} di {questions.length} domande
          </p>
        </div>
        <div className="h-2 bg-simoly-gray-light rounded-full overflow-hidden">
          <div 
            className="h-full bg-simoly-purple transition-all duration-300"
            style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-8">
        {currentQuestions.map((question, idx) => (
          <Card key={question.id} className="border-2 border-simoly-gray-light rounded-3xl relative overflow-hidden">
            {question.guide && (
              <div className="absolute right-4 top-4 z-10">
                <div 
                  className="w-8 h-8 bg-simoly-accent-purple text-simoly-purple flex items-center justify-center rounded-full cursor-help"
                  onMouseEnter={() => setHoverTooltip(question.id)}
                  onMouseLeave={() => setHoverTooltip(null)}
                >
                  <HelpCircle size={16} />
                </div>
                {hoverTooltip === question.id && (
                  <div className="tooltip-container">
                    <h4 className="font-medium mb-1">Guida</h4>
                    <p className="text-sm text-simoly-gray-dark">{question.guide}</p>
                  </div>
                )}
              </div>
            )}
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-1 pr-10">
                  {question.text}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
              </div>
              {renderQuestion(question)}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-between mt-10">
        <div>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
          </Button>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={handleSaveDraft}
          >
            <Save className="mr-2 h-4 w-4" /> Salva bozza
          </Button>
          
          <Button
            className="rounded-full bg-simoly-purple hover:bg-simoly-purple-dark"
            onClick={handleComplete}
          >
            {currentPage === totalPages - 1 ? (
              <>
                <Send className="mr-2 h-4 w-4" /> Invio definitivo
              </>
            ) : (
              <>
                Avanti <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;
