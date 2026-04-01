
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormPage } from '@/types/form-builder';

interface PageEditorProps {
  page: FormPage;
  onPageUpdate: (updatedPage: FormPage) => void;
}

const PageEditor: React.FC<PageEditorProps> = ({ page, onPageUpdate }) => {
  const handleChange = (field: keyof FormPage, value: any) => {
    onPageUpdate({
      ...page,
      [field]: value
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Dettagli Pagina</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="page-title">Titolo Pagina</Label>
          <Input
            id="page-title"
            value={page.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Inserisci il titolo della pagina"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="page-description">Descrizione Pagina</Label>
          <Textarea
            id="page-description"
            value={page.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Inserisci una descrizione per la pagina"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image-position">Posizione Immagine</Label>
          <Select
            value={page.imagePosition || 'top'}
            onValueChange={(value) => handleChange('imagePosition', value)}
          >
            <SelectTrigger id="image-position">
              <SelectValue placeholder="Seleziona la posizione dell'immagine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">In alto</SelectItem>
              <SelectItem value="bottom">In basso</SelectItem>
              <SelectItem value="left">A sinistra</SelectItem>
              <SelectItem value="right">A destra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="page-image">URL Immagine</Label>
          <Input
            id="page-image"
            type="url"
            value={page.imageUrl || ''}
            onChange={(e) => handleChange('imageUrl', e.target.value)}
            placeholder="Inserisci l'URL dell'immagine"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PageEditor;
