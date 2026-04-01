
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Save, Send } from 'lucide-react';

interface QuestionSaveConfirmationProps {
  mode: 'draft' | 'submit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const QuestionSaveConfirmation: React.FC<QuestionSaveConfirmationProps> = ({
  mode,
  open,
  onOpenChange,
  onConfirm
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === 'draft' ? 'Salva in bozza' : 'Invia questionario'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {mode === 'draft' ? (
            <p className="text-sm text-gray-700 leading-relaxed">
              Salvando in bozza salva tutte le risposte già completate, quindi è possibile sospendere il questionario e riprenderlo, modificando alcune di loro.
            </p>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold">ATTENZIONE:</span> Il pulsante Invia salva definitivamente il questionario e consente l'elaborazione del report finale. Conferma solo se sei certo che tutte le risposte siano corrette, poiché non sarà possibile ripetere l'operazione. Altrimenti salva in draft per sospendere il questionario, riprenderlo e modificare alcune risposte.
            </p>
          )}
        </div>
        
        <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:space-x-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Annulla
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            variant={mode === 'draft' ? 'outline' : 'default'}
            className="w-full sm:w-auto bg-[var(--color-primary)] hover:bg-[var(--color-primary-700)] text-white"
          >
            {mode === 'draft' ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Conferma salvataggio in bozza
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Conferma l'invio del questionario
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionSaveConfirmation;
