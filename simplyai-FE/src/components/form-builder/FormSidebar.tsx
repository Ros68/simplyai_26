
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as Icons from 'lucide-react';
import { FormFieldType } from '@/types/form-builder';

interface FormSidebarProps {
  onAddField: (type: string) => void;
}

const FormSidebar: React.FC<FormSidebarProps> = ({ onAddField }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [draggedItem, setDraggedItem] = React.useState<string | null>(null);
  
  // Predefined field types based on requirements
  const predefinedFieldTypes: FormFieldType[] = [
    // Campi di testo
    { id: '1', type: 'text', name: 'Testo breve', icon: 'TextIcon', isActive: true },
    { id: '2', type: 'textarea', name: 'Testo lungo', icon: 'AlignLeft', isActive: true },
    { id: '3', type: 'richtext', name: 'Editor di testo', icon: 'Type', isActive: true },
    
    // Campi di scelta
    { id: '4', type: 'radio', name: 'Scelta singola (Radio)', icon: 'Circle', isActive: true },
    { id: '5', type: 'checkbox', name: 'Caselle di controllo', icon: 'CheckSquare', isActive: true },
    { id: '6', type: 'select', name: 'Menu a tendina', icon: 'List', isActive: true },
    { id: '7', type: 'multi-select', name: 'Menu multi-selezione', icon: 'ListFilter', isActive: true },
    { id: '8', type: 'boolean', name: 'Sì/No (Boolean)', icon: 'ToggleLeft', isActive: true },
    { id: '9', type: 'rating', name: 'Valutazione a stelle', icon: 'Star', isActive: true },
    { id: '10', type: 'range', name: 'Intervallo di valori', icon: 'ArrowLeftRight', isActive: true },
    { id: '11', type: 'image-picker', name: 'Selezione immagine', icon: 'Image', isActive: true },
    { id: '12', type: 'color', name: 'Colore', icon: 'Palette', isActive: true },
    
    // Campi numerici e date
    { id: '13', type: 'number', name: 'Numero', icon: 'Hash', isActive: true },
    { id: '14', type: 'currency', name: 'Valore in €', icon: 'Euro', isActive: true },
    { id: '15', type: 'date', name: 'Data', icon: 'Calendar', isActive: true },
    { id: '16', type: 'time', name: 'Ora', icon: 'Clock', isActive: true },
    { id: '17', type: 'datetime', name: 'Data e Ora', icon: 'CalendarClock', isActive: true },
    
    // Campi avanzati
    { id: '18', type: 'file-upload', name: 'Caricamento file', icon: 'File', isActive: true },
    { id: '19', type: 'signature', name: 'Firma', icon: 'Edit', isActive: true },
    { id: '20', type: 'matrix', name: 'Tabella (Matrice)', icon: 'Table', isActive: true },
    { id: '21', type: 'address', name: 'Indirizzo', icon: 'MapPin', isActive: true },
    
    // Campi per contatti
    { id: '22', type: 'email', name: 'Email', icon: 'Mail', isActive: true },
    { id: '23', type: 'tel', name: 'Telefono', icon: 'Phone', isActive: true },
    { id: '24', type: 'url', name: 'URL', icon: 'Link', isActive: true },
    { id: '25', type: 'password', name: 'Password', icon: 'Lock', isActive: true },
    { id: '26', type: 'name', name: 'Nome completo', icon: 'User', isActive: true }
  ];
  
  // Filtra i tipi di campo in base al termine di ricerca
  const filteredFieldTypes = predefinedFieldTypes.filter(fieldType => 
    fieldType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fieldType.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Raggruppa i tipi di campo per categorie
  const categories = {
    text: ['text', 'textarea', 'richtext'],
    choice: ['radio', 'checkbox', 'select', 'multi-select', 'boolean', 'rating', 'range', 'image-picker', 'color'],
    numeric: ['number', 'currency'],
    datetime: ['date', 'time', 'datetime'],
    advanced: ['file-upload', 'signature', 'matrix', 'address'],
    contact: ['email', 'tel', 'url', 'password', 'name']
  };

  const getCategoryFieldTypes = (categoryTypes: string[]) => 
    filteredFieldTypes.filter(fieldType => categoryTypes.includes(fieldType.type));

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, fieldType: string) => {
    e.dataTransfer.setData('fieldType', fieldType);
    setDraggedItem(fieldType);
    
    // Aggiunge un effetto visivo durante il drag
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('opacity-50', 'ring-2', 'ring-primary');
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedItem(null);
    // Ripristina l'aspetto normale dopo il drag
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('opacity-50', 'ring-2', 'ring-primary');
    }
  };

  // Funzione comune per renderizzare l'elenco di tipi di campo
  const renderFieldTypeList = (fieldTypes: FormFieldType[]) => (
    <div className="grid gap-2">
      {fieldTypes.map((fieldType) => {
        const IconComponent = (Icons as any)[fieldType.icon] || Icons.Square;
        
        return (
          <div
            key={fieldType.id}
            className={`flex items-center p-2 rounded-md border border-border hover:border-primary cursor-move bg-card transition-all ${draggedItem === fieldType.type ? 'opacity-50 ring-2 ring-primary' : 'hover:shadow'}`}
            draggable
            onDragStart={(e) => handleDragStart(e, fieldType.type)}
            onDragEnd={handleDragEnd}
            onClick={() => onAddField(fieldType.type)}
          >
            <IconComponent className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium">{fieldType.name}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="border-dashed border-2 h-full">
      <CardHeader>
        <CardTitle>Tipi di Domanda</CardTitle>
        <Input 
          placeholder="Cerca tipi di domanda..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-2"
        />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-7 mb-4">
            <TabsTrigger value="all">Tutti</TabsTrigger>
            <TabsTrigger value="text">Testo</TabsTrigger>
            <TabsTrigger value="choice">Scelte</TabsTrigger>
            <TabsTrigger value="numeric">Numeri</TabsTrigger>
            <TabsTrigger value="datetime">Date/Ore</TabsTrigger>
            <TabsTrigger value="advanced">Avanzati</TabsTrigger>
            <TabsTrigger value="contact">Contatti</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <TabsContent value="all" className="m-0">
              {renderFieldTypeList(filteredFieldTypes)}
            </TabsContent>
            
            <TabsContent value="text" className="m-0">
              {renderFieldTypeList(getCategoryFieldTypes(categories.text))}
            </TabsContent>
            
            <TabsContent value="choice" className="m-0">
              {renderFieldTypeList(getCategoryFieldTypes(categories.choice))}
            </TabsContent>
            
            <TabsContent value="numeric" className="m-0">
              {renderFieldTypeList(getCategoryFieldTypes(categories.numeric))}
            </TabsContent>
            
            <TabsContent value="datetime" className="m-0">
              {renderFieldTypeList(getCategoryFieldTypes(categories.datetime))}
            </TabsContent>
            
            <TabsContent value="advanced" className="m-0">
              {renderFieldTypeList(getCategoryFieldTypes(categories.advanced))}
            </TabsContent>

            <TabsContent value="contact" className="m-0">
              {renderFieldTypeList(getCategoryFieldTypes(categories.contact))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FormSidebar;
