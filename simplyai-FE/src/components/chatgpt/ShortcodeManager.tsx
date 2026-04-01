
import React, { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash } from 'lucide-react';

export interface ShortcodeItem {
  id: string;
  title: string;
  shortcode: string;
  content?: string;
  chartType?: 'bar' | 'line' | 'pie' | 'radar';
  tableType?: 'simple' | 'comparison' | 'progress';
}

interface ShortcodeManagerProps {
  type: 'text' | 'chart' | 'table';
  items: ShortcodeItem[];
  onItemsChange: (items: ShortcodeItem[]) => void;
}

const ShortcodeManager: React.FC<ShortcodeManagerProps> = ({ type, items, onItemsChange }) => {
  const uniqueId = useId();
  
  const addItem = () => {
    const newId = `${uniqueId}-${Date.now()}`;
    const newShortcode = `[${type}_${type === 'text' ? 'section' : type}_${items.length + 1}]`;
    const newItem: ShortcodeItem = {
      id: newId,
      title: `Nuovo ${type === 'text' ? 'Sezione' : type === 'chart' ? 'Grafico' : 'Tabella'} ${items.length + 1}`,
      shortcode: newShortcode,
      content: type === 'text' ? 'Contenuto della sezione' : undefined,
      chartType: type === 'chart' ? 'bar' : undefined,
      tableType: type === 'table' ? 'simple' : undefined,
    };
    
    onItemsChange([...items, newItem]);
  };
  
  const updateItem = (index: number, field: keyof ShortcodeItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Aggiorna lo shortcode se il titolo cambia
    if (field === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^\w-]+/g, '')
        .substring(0, 15);
      
      updatedItems[index].shortcode = `[${type}_${slug}_${index + 1}]`;
    }
    
    onItemsChange(updatedItems);
  };
  
  const removeItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    onItemsChange(updatedItems);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {type === 'text' ? 'Sezioni di Testo' : type === 'chart' ? 'Grafici' : 'Tabelle'}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi {type === 'text' ? 'Sezione' : type === 'chart' ? 'Grafico' : 'Tabella'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="p-4 border rounded-md">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`${item.id}-title`}>Titolo</Label>
                  <Input
                    id={`${item.id}-title`}
                    value={item.title}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`${item.id}-shortcode`}>Shortcode</Label>
                  <Input
                    id={`${item.id}-shortcode`}
                    value={item.shortcode}
                    readOnly
                    className="font-mono bg-muted"
                  />
                </div>
              </div>
              
              {type === 'text' && (
                <div>
                  <Label htmlFor={`${item.id}-content`}>Contenuto</Label>
                  <Textarea
                    id={`${item.id}-content`}
                    value={item.content}
                    onChange={(e) => updateItem(index, 'content', e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Questo contenuto sarà sostituito dalla generazione AI ma può essere utile come placeholder.
                  </p>
                </div>
              )}
              
              {type === 'chart' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${item.id}-chart-type`}>Tipo di Grafico</Label>
                    <Select
                      value={item.chartType}
                      onValueChange={(value) => updateItem(index, 'chartType', value)}
                    >
                      <SelectTrigger id={`${item.id}-chart-type`}>
                        <SelectValue placeholder="Seleziona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bar">Barre</SelectItem>
                        <SelectItem value="line">Linea</SelectItem>
                        <SelectItem value="pie">Torta</SelectItem>
                        <SelectItem value="radar">Radar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {type === 'table' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${item.id}-table-type`}>Tipo di Tabella</Label>
                    <Select
                      value={item.tableType}
                      onValueChange={(value) => updateItem(index, 'tableType', value)}
                    >
                      <SelectTrigger id={`${item.id}-table-type`}>
                        <SelectValue placeholder="Seleziona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Semplice</SelectItem>
                        <SelectItem value="comparison">Confronto</SelectItem>
                        <SelectItem value="progress">Progressione</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive self-end"
                onClick={() => removeItem(index)}
              >
                <Trash className="h-4 w-4 mr-2" />
                Rimuovi
              </Button>
            </div>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="text-center p-4 border border-dashed rounded-md">
            <p className="text-muted-foreground">
              Nessun {type === 'text' ? 'sezione di testo' : type === 'chart' ? 'grafico' : 'tabella'} configurato.
              Clicca sul pulsante "Aggiungi" per iniziare.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShortcodeManager;
