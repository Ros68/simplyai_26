
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckSquare, Clock, RotateCcw } from 'lucide-react';

interface QuestionnaireProgressionSettingsProps {
  isPeriodic: boolean;
  isVerification: boolean;
  isProgression: boolean;
  periodicity: number;
  repetitions: number;
  onUpdate: (field: string, value: any) => void;
}

export const QuestionnaireProgressionSettings = ({
  isPeriodic,
  isVerification,
  isProgression,
  periodicity,
  repetitions,
  onUpdate
}: QuestionnaireProgressionSettingsProps) => {
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium flex items-center">
          {isPeriodic && <RotateCcw className="h-4 w-4 mr-2 text-blue-500" />}
          {isVerification && <Clock className="h-4 w-4 mr-2 text-amber-500" />}
          {isProgression && <CheckSquare className="h-4 w-4 mr-2 text-purple-500" />}
          Impostazioni avanzate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(isPeriodic || isVerification) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodicity">Periodicità (giorni)</Label>
              <Input
                id="periodicity"
                type="number"
                min={1}
                value={periodicity}
                onChange={(e) => onUpdate('periodicity', parseInt(e.target.value) || 90)}
              />
            </div>
            
            {isPeriodic && (
              <div>
                <Label htmlFor="repetitions">Numero ripetizioni</Label>
                <Input
                  id="repetitions"
                  type="number"
                  min={1}
                  value={repetitions}
                  onChange={(e) => onUpdate('repetitions', parseInt(e.target.value) || 4)}
                />
              </div>
            )}
          </div>
        )}
        
        {isProgression && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Il percorso di apprendimento progressivo permette all'utente di progredire attraverso una sequenza di questionari, ciascuno disponibile solo dopo il completamento del precedente.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-md p-3 text-sm text-purple-800">
              Nell'elenco dei questionari puoi specificare la sequenza per ciascun questionario. Il numero di sequenza determina l'ordine in cui i questionari saranno presentati all'utente.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
