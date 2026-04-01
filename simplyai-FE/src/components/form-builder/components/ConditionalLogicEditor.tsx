
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ConditionalRule, FormField } from '@/types/form-builder';
import { Plus, Trash2 } from 'lucide-react';

interface ConditionalLogicEditorProps {
  field: FormField;
  allFields: FormField[];
  onUpdate: (field: FormField) => void;
}

const conditionOptions = [
  { value: 'equals', label: 'È uguale a' },
  { value: 'not_equals', label: 'Non è uguale a' },
  { value: 'contains', label: 'Contiene' },
  { value: 'not_contains', label: 'Non contiene' },
  { value: 'greater', label: 'È maggiore di' },
  { value: 'less', label: 'È minore di' }
];

const ConditionalLogicEditor: React.FC<ConditionalLogicEditorProps> = ({ field, allFields, onUpdate }) => {
  // Filtriamo i campi disponibili escludendo il campo corrente e quelli che seguono
  const availableFields = allFields.filter(f => 
    f.id !== field.id && 
    (f.pageIndex < field.pageIndex || (f.pageIndex === field.pageIndex && f.order < field.order))
  );

  const conditionalLogic = field.conditionalLogic || { enabled: false, rules: [], operator: 'and' };

  const handleToggleEnabled = () => {
    onUpdate({
      ...field,
      conditionalLogic: {
        ...conditionalLogic,
        enabled: !conditionalLogic.enabled
      }
    });
  };

  const handleOperatorChange = (value: string) => {
    onUpdate({
      ...field,
      conditionalLogic: {
        ...conditionalLogic,
        operator: value as 'and' | 'or'
      }
    });
  };

  const addRule = () => {
    // Aggiungiamo una regola solo se ci sono campi disponibili
    if (availableFields.length > 0) {
      const defaultRule: ConditionalRule = {
        sourceFieldId: availableFields[0].id,
        condition: 'equals',
        value: '',
      };
      
      onUpdate({
        ...field,
        conditionalLogic: {
          ...conditionalLogic,
          rules: [...conditionalLogic.rules, defaultRule]
        }
      });
    }
  };

  const updateRule = (index: number, updatedRule: ConditionalRule) => {
    const updatedRules = [...conditionalLogic.rules];
    updatedRules[index] = updatedRule;
    
    onUpdate({
      ...field,
      conditionalLogic: {
        ...conditionalLogic,
        rules: updatedRules
      }
    });
  };

  const removeRule = (index: number) => {
    const updatedRules = conditionalLogic.rules.filter((_, i) => i !== index);
    
    onUpdate({
      ...field,
      conditionalLogic: {
        ...conditionalLogic,
        rules: updatedRules
      }
    });
  };

  const getFieldNameById = (id: string) => {
    const field = allFields.find(f => f.id === id);
    return field ? field.label : 'Campo sconosciuto';
  };

  if (availableFields.length === 0 && !conditionalLogic.enabled) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Logica Condizionale</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Non ci sono campi precedenti da utilizzare per la logica condizionale.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Logica Condizionale</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch 
              id="conditional-logic-enabled" 
              checked={conditionalLogic.enabled}
              onCheckedChange={handleToggleEnabled}
            />
            <Label htmlFor="conditional-logic-enabled">
              {conditionalLogic.enabled ? 'Attiva' : 'Disattiva'}
            </Label>
          </div>
        </div>
      </CardHeader>
      
      {conditionalLogic.enabled && (
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="logic-operator">Operatore</Label>
              <Select
                value={conditionalLogic.operator}
                onValueChange={handleOperatorChange}
              >
                <SelectTrigger id="logic-operator">
                  <SelectValue placeholder="Seleziona operatore" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="and">TUTTE le condizioni devono essere vere (AND)</SelectItem>
                  <SelectItem value="or">ALMENO UNA condizione deve essere vera (OR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condizioni</Label>
              
              {conditionalLogic.rules.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nessuna condizione aggiunta. Aggiungi una condizione per iniziare.
                </p>
              ) : (
                conditionalLogic.rules.map((rule, index) => (
                  <div key={index} className="flex items-center space-x-2 border p-2 rounded-md">
                    <div className="grid grid-cols-12 gap-2 flex-grow">
                      <div className="col-span-4">
                        <Select
                          value={rule.sourceFieldId}
                          onValueChange={(value) => updateRule(index, { ...rule, sourceFieldId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Campo" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map((field) => (
                              <SelectItem key={field.id} value={field.id}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="col-span-3">
                        <Select
                          value={rule.condition}
                          onValueChange={(value) => updateRule(index, { 
                            ...rule, 
                            condition: value as 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater' | 'less' 
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Condizione" />
                          </SelectTrigger>
                          <SelectContent>
                            {conditionOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="col-span-4">
                        <Input
                          value={rule.value.toString()}
                          onChange={(e) => updateRule(index, { ...rule, value: e.target.value })}
                          placeholder="Valore"
                        />
                      </div>
                      
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRule(index)}
                          className="p-0 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addRule}
                disabled={availableFields.length === 0}
                className="w-full mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Condizione
              </Button>
            </div>
            
            {conditionalLogic.rules.length > 0 && (
              <div className="border-t pt-2 mt-4">
                <p className="text-sm">
                  <span className="font-medium">Anteprima:</span> Questa domanda sarà mostrata solo se {conditionalLogic.operator === 'and' ? 'TUTTE' : 'ALMENO UNA'} delle seguenti condizioni {conditionalLogic.operator === 'and' ? 'sono' : 'è'} vera:
                </p>
                <ul className="list-disc list-inside mt-1 text-sm text-muted-foreground">
                  {conditionalLogic.rules.map((rule, index) => (
                    <li key={index}>
                      <span className="font-medium">{getFieldNameById(rule.sourceFieldId)}</span> {' '}
                      {conditionOptions.find(o => o.value === rule.condition)?.label} {' '}
                      <span className="italic">"{rule.value}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default ConditionalLogicEditor;
