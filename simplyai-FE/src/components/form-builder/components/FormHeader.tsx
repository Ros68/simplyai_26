
import React, { useState } from 'react';
import { FormData } from '@/types/form-builder';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileUp } from 'lucide-react';

interface FormHeaderProps {
  formData: FormData;
  onFormDataChange: (data: FormData) => void;
  onImportForm?: (text: string) => void;
}

const FormHeader: React.FC<FormHeaderProps> = ({ formData, onFormDataChange, onImportForm }) => {
  const [importText, setImportText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({
      ...formData,
      title: e.target.value
    });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onFormDataChange({
      ...formData,
      description: e.target.value
    });
  };

  const handleImport = () => {
    if (onImportForm && importText) {
      onImportForm(importText);
      setImportText('');
      setDialogOpen(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-4 flex-1">
            <div>
              <Label htmlFor="form-title" className="text-base">Titolo del Form</Label>
              <Input 
                id="form-title"
                className="text-xl font-bold mt-1"
                value={formData.title} 
                onChange={handleTitleChange}
                placeholder="Inserisci il titolo del form"
              />
            </div>
            
            <div>
              <Label htmlFor="form-description" className="text-base">Descrizione</Label>
              <Textarea 
                id="form-description"
                className="mt-1"
                value={formData.description || ''} 
                onChange={handleDescriptionChange}
                placeholder="Inserisci una descrizione opzionale"
              />
            </div>
          </div>

          {onImportForm && (
            <div className="ml-4 self-start">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileUp className="h-4 w-4" />
                    Importa Form
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importa Form da Testo</DialogTitle>
                    <DialogDescription>
                      Incolla il testo formattato secondo il formato specificato. 
                      <br/>
                      Esempio: <code>Q1|type=text|question=Descrizione|options=[]|condition=null|score=null</code>
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea 
                    className="min-h-[200px]" 
                    placeholder="Incolla qui il testo del form..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
                    <Button onClick={handleImport}>Importa</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormHeader;
