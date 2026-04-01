
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

// Esempio di form per anteprima
const sampleForm = {
  id: 'form-1',
  title: 'Valutazione del Servizio',
  description: 'Aiutaci a migliorare il nostro servizio rispondendo a questo breve questionario.',
  fields: [
    {
      id: 'field-1',
      type: 'text',
      label: 'Nome e Cognome',
      required: true,
      placeholder: 'Inserisci il tuo nome e cognome'
    },
    {
      id: 'field-2',
      type: 'radio',
      label: 'Come valuti il nostro servizio?',
      required: true,
      options: [
        { label: 'Eccellente', value: '5' },
        { label: 'Buono', value: '4' },
        { label: 'Soddisfacente', value: '3' },
        { label: 'Mediocre', value: '2' },
        { label: 'Scarso', value: '1' }
      ]
    },
    {
      id: 'field-3',
      type: 'checkbox',
      label: 'Quali servizi hai utilizzato?',
      required: false,
      options: [
        { label: 'Consulenza', value: 'consultation' },
        { label: 'Supporto Tecnico', value: 'support' },
        { label: 'Formazione', value: 'training' },
        { label: 'Altro', value: 'other' }
      ]
    },
    {
      id: 'field-4',
      type: 'textarea',
      label: 'Hai suggerimenti per migliorare il nostro servizio?',
      required: false,
      placeholder: 'Inserisci qui i tuoi suggerimenti'
    }
  ]
};

const FormPreview = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [formValues, setFormValues] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nella versione reale, dovremmo caricare il form dal backend usando l'id
  const form = sampleForm;

  const handleChange = (fieldId, value) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simuliamo l'invio del form
    setTimeout(() => {
      console.log('Form submitted:', formValues);
      setIsSubmitting(false);
      setFormValues({});
      toast({
        title: 'Form Inviato',
        description: 'Grazie per aver compilato il form!',
      });
    }, 1000);
  };

  const renderField = (field) => {
    const requiredIndicator = field.required ? (
      <span className="text-red-500 ml-1">*</span>
    ) : null;

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2 mb-4">
            <Label htmlFor={field.id}>
              {field.label}
              {requiredIndicator}
            </Label>
            <Input
              id={field.id}
              type="text"
              placeholder={field.placeholder || ''}
              value={formValues[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
            />
          </div>
        );
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2 mb-4">
            <Label htmlFor={field.id}>
              {field.label}
              {requiredIndicator}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder || ''}
              value={formValues[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
              rows={4}
            />
          </div>
        );
      case 'radio':
        return (
          <div key={field.id} className="space-y-3 mb-4">
            <Label>
              {field.label}
              {requiredIndicator}
            </Label>
            <RadioGroup
              value={formValues[field.id] || ''}
              onValueChange={(value) => handleChange(field.id, value)}
            >
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.id}-${index}`} />
                  <Label htmlFor={`${field.id}-${index}`} className="font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      case 'checkbox':
        return (
          <div key={field.id} className="space-y-3 mb-4">
            <Label>
              {field.label}
              {requiredIndicator}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${index}`}
                    checked={formValues[`${field.id}-${option.value}`] || false}
                    onCheckedChange={(checked) => 
                      handleChange(`${field.id}-${option.value}`, checked)
                    }
                  />
                  <Label htmlFor={`${field.id}-${index}`} className="font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      case 'number':
        return (
          <div key={field.id} className="space-y-2 mb-4">
            <Label htmlFor={field.id}>
              {field.label}
              {requiredIndicator}
            </Label>
            <Input
              id={field.id}
              type="number"
              placeholder={field.placeholder || ''}
              value={formValues[field.id] || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (!form) {
    return <div>Form non trovato</div>;
  }

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{form.title}</CardTitle>
          {form.description && (
            <CardDescription>{form.description}</CardDescription>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {form.fields.map(renderField)}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Invio in corso...' : 'Invia'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default FormPreview;
