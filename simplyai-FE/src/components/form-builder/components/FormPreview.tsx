
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FormField } from '@/types/form-builder';

interface FormPreviewProps {
  fields: FormField[];
}

const FormPreview: React.FC<FormPreviewProps> = ({ fields }) => {
  const renderField = (field: FormField) => {
    const requiredIndicator = field.required ? (
      <span className="text-red-500 ml-1">*</span>
    ) : null;

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2 mb-4">
            <Label htmlFor={`preview-${field.id}`}>
              {field.label}
              {requiredIndicator}
            </Label>
            <Input 
              id={`preview-${field.id}`} 
              type="text" 
              placeholder={field.placeholder || ''} 
            />
          </div>
        );
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2 mb-4">
            <Label htmlFor={`preview-${field.id}`}>
              {field.label}
              {requiredIndicator}
            </Label>
            <Textarea 
              id={`preview-${field.id}`} 
              placeholder={field.placeholder || ''} 
              rows={3}
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
            <RadioGroup>
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
                  <Checkbox id={`${field.id}-${index}`} />
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
            <Label htmlFor={`preview-${field.id}`}>
              {field.label}
              {requiredIndicator}
            </Label>
            <Input 
              id={`preview-${field.id}`} 
              type="number" 
              placeholder={field.placeholder || ''} 
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {fields.map((field) => renderField(field))}
    </div>
  );
};

export default FormPreview;
