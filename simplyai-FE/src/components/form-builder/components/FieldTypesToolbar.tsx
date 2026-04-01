
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, ListChecks, Hash, Check, List } from 'lucide-react';

interface FieldType {
  type: string;
  label: string;
  icon: React.ReactNode;
}

const fieldTypes: FieldType[] = [
  { type: 'text', label: 'Testo Breve', icon: <FileText className="h-4 w-4" /> },
  { type: 'textarea', label: 'Testo Lungo', icon: <List className="h-4 w-4" /> },
  { type: 'radio', label: 'Scelta Singola', icon: <Check className="h-4 w-4" /> },
  { type: 'checkbox', label: 'Scelta Multipla', icon: <ListChecks className="h-4 w-4" /> },
  { type: 'number', label: 'Numero', icon: <Hash className="h-4 w-4" /> },
];

interface FieldTypesToolbarProps {
  onAddField: (type: string) => void;
}

const FieldTypesToolbar: React.FC<FieldTypesToolbarProps> = ({ onAddField }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipi di Campo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {fieldTypes.map((field) => (
          <Button
            key={field.type}
            variant="outline"
            className="w-full justify-start"
            onClick={() => onAddField(field.type)}
          >
            {field.icon}
            <span className="ml-2">{field.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default FieldTypesToolbar;
