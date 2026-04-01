
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { FormField } from '@/types/form-builder';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash, Plus, ArrowDown, ArrowUp } from 'lucide-react';
import ConditionalLogicEditor from './ConditionalLogicEditor';

interface FieldConfigPanelProps {
  field: FormField;
  onChange: (field: FormField) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const FieldConfigPanel: React.FC<FieldConfigPanelProps> = ({ 
  field, 
  onChange, 
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}) => {
  const handleAddOption = () => {
    if (!field.options) return;
    
    const options = [...field.options];
    const newOption = {
      label: `Opzione ${options.length + 1}`,
      value: `option${options.length + 1}`,
      score: 0
    };
    
    options.push(newOption);
    onChange({ ...field, options });
  };
  
  const handleChangeOption = (index: number, key: string, value: any) => {
    if (!field.options) return;
    
    const options = [...field.options];
    options[index] = { ...options[index], [key]: value };
    
    // If we're updating the label, also update the value unless it's been manually changed
    if (key === 'label') {
      const defaultValue = value.toLowerCase().replace(/\s+/g, '_');
      if (options[index].value === `option${index + 1}` || !options[index].value) {
        options[index].value = defaultValue;
      }
    }
    
    onChange({ ...field, options });
  };
  
  const handleRemoveOption = (index: number) => {
    if (!field.options) return;
    
    const options = field.options.filter((_, i) => i !== index);
    onChange({ ...field, options });
  };

  const renderOptionsEditor = () => {
    if (!field.options) return null;
    
    return (
      <div className="space-y-4 mt-4">
        <Label>Opzioni</Label>
        {field.options.map((option, index) => (
          <div key={index} className="flex items-start space-x-2">
            <div className="flex-1">
              <Input
                value={option.label}
                onChange={(e) => handleChangeOption(index, 'label', e.target.value)}
                placeholder={`Opzione ${index + 1}`}
                className="mb-1"
              />
              <div className="flex gap-2">
                <Input
                  value={option.value}
                  onChange={(e) => handleChangeOption(index, 'value', e.target.value)}
                  placeholder="valore"
                  className="text-xs"
                />
                <Input
                  type="number"
                  value={option.score}
                  onChange={(e) => handleChangeOption(index, 'score', Number(e.target.value))}
                  placeholder="0"
                  className="w-20 text-xs"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveOption(index)}
              className="mt-2"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddOption}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Opzione
        </Button>
      </div>
    );
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{field.type === 'text' ? 'Campo di Testo' : field.type === 'radio' ? 'Scelta Singola' : field.type === 'checkbox' ? 'Scelta Multipla' : 'Campo'}</CardTitle>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onMoveUp}
              disabled={isFirst}
              className="h-8 w-8 p-0"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onMoveDown}
              disabled={isLast}
              className="h-8 w-8 p-0"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              className="h-8 w-8 p-0"
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`field-label-${field.id}`}>Testo Domanda</Label>
          <Input
            id={`field-label-${field.id}`}
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
            placeholder="Testo della domanda"
          />
        </div>
        
        <div>
          <Label htmlFor={`field-guide-${field.id}`}>Guida</Label>
          <Textarea
            id={`field-guide-${field.id}`}
            value={field.guide || ''}
            onChange={(e) => onChange({ ...field, guide: e.target.value })}
            placeholder="Testo di guida per questa domanda"
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Questo testo verrà mostrato come aiuto quando l'utente compila il questionario.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id={`field-required-${field.id}`}
            checked={field.required}
            onCheckedChange={(checked) => onChange({ ...field, required: checked })}
          />
          <Label htmlFor={`field-required-${field.id}`}>Campo obbligatorio</Label>
        </div>
        
        {field.type === 'text' && (
          <div>
            <Label htmlFor={`field-placeholder-${field.id}`}>Placeholder</Label>
            <Input
              id={`field-placeholder-${field.id}`}
              value={field.placeholder || ''}
              onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
              placeholder="Inserisci un placeholder"
            />
          </div>
        )}
        
        {['radio', 'checkbox', 'select', 'multi-select'].includes(field.type) && renderOptionsEditor()}
        
        <ConditionalLogicEditor
          field={field}
          onChange={onChange}
        />
      </CardContent>
    </Card>
  );
};

export default FieldConfigPanel;
