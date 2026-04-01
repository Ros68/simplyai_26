
import React, { useState } from 'react';
import { FormField, FormData, FormPage } from '@/types/form-builder';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import FormHeader from './components/FormHeader';
import PageSelector from './components/PageSelector';
import PageEditor from './components/PageEditor';
import FieldList from './components/FieldList';
import FieldConfigPanel from './components/FieldConfigPanel';

interface FormEditorProps {
  initialData?: FormData;
  onChange?: (data: FormData) => void;
}

const FormEditor: React.FC<FormEditorProps> = ({ initialData, onChange }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialData || {
    id: `form-${Date.now()}`,
    title: 'Nuovo Form',
    description: 'Descrizione del form',
    pages: [
      {
        id: uuidv4(),
        title: 'Pagina 1',
        fields: [],
        order: 0
      }
    ],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const currentPage = formData.pages[selectedPageIndex];
  const selectedField = currentPage?.fields.find(field => field.id === selectedFieldId) || null;
  const allFields = formData.pages.flatMap(page => page.fields);

  const handleFormDataChange = (newData: FormData) => {
    setFormData(newData);
    if (onChange) {
      onChange(newData);
    }
  };

  const addField = (type: string = 'text') => {
    const newField: FormField = {
      id: `field-${uuidv4()}`,
      type,
      label: 'Nuova Domanda',
      required: false,
      placeholder: type === 'text' || type === 'textarea' || type === 'number' ? 'Inserisci qui...' : undefined,
      options: ['radio', 'checkbox', 'select', 'multi-select', 'image-picker', 'matrix'].includes(type) ? [
        { label: 'Opzione 1', value: 'option1', score: 0 },
        { label: 'Opzione 2', value: 'option2', score: 0 }
      ] : undefined,
      pageIndex: selectedPageIndex,
      order: currentPage?.fields.length || 0,
      conditionalLogic: {
        enabled: false,
        rules: [],
        operator: 'and'
      }
    };
    
    const updatedPages = [...formData.pages];
    updatedPages[selectedPageIndex] = {
      ...currentPage,
      fields: [...currentPage.fields, newField]
    };
    
    handleFormDataChange({
      ...formData,
      pages: updatedPages
    });
    
    setSelectedFieldId(newField.id);
    
    toast({
      title: "Domanda aggiunta",
      description: `Nuova domanda di tipo "${type}" aggiunta con successo.`
    });
  };

  const updateField = (updatedField: FormField) => {
    const updatedPages = [...formData.pages];
    const pageIndex = updatedField.pageIndex;
    
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      fields: updatedPages[pageIndex].fields.map(field => 
        field.id === updatedField.id ? updatedField : field
      )
    };
    
    handleFormDataChange({
      ...formData,
      pages: updatedPages
    });
  };

  const deleteField = (fieldId: string) => {
    const fieldToDelete = formData.pages.flatMap(page => page.fields).find(f => f.id === fieldId);
    
    if (!fieldToDelete) return;
    
    const pageIndex = fieldToDelete.pageIndex;
    const updatedPages = [...formData.pages];
    
    updatedPages[pageIndex] = {
      ...updatedPages[pageIndex],
      fields: updatedPages[pageIndex].fields.filter(field => field.id !== fieldId)
    };
    
    handleFormDataChange({
      ...formData,
      pages: updatedPages
    });
    
    setSelectedFieldId(null);
    
    toast({
      title: "Domanda eliminata",
      description: "La domanda è stata eliminata con successo."
    });
  };

  const addPage = () => {
    const newPage: FormPage = {
      id: uuidv4(),
      title: `Pagina ${formData.pages.length + 1}`,
      fields: [],
      order: formData.pages.length
    };
    
    handleFormDataChange({
      ...formData,
      pages: [...formData.pages, newPage]
    });
    
    setSelectedPageIndex(formData.pages.length);
    setSelectedFieldId(null);
    
    toast({
      title: "Pagina aggiunta",
      description: "Una nuova pagina è stata aggiunta al form."
    });
  };

  const deletePage = (pageIndex: number) => {
    if (formData.pages.length <= 1) {
      toast({
        title: "Impossibile eliminare",
        description: "È necessario mantenere almeno una pagina nel form.",
        variant: "destructive"
      });
      return;
    }
    
    const updatedPages = [...formData.pages];
    updatedPages.splice(pageIndex, 1);
    
    const newSelectedPageIndex = pageIndex >= updatedPages.length ? updatedPages.length - 1 : pageIndex;
    
    const adjustedPages = updatedPages.map((page, idx) => {
      return {
        ...page,
        order: idx,
        fields: page.fields.map(field => ({
          ...field,
          pageIndex: idx
        }))
      };
    });
    
    handleFormDataChange({
      ...formData,
      pages: adjustedPages
    });
    
    setSelectedPageIndex(newSelectedPageIndex);
    setSelectedFieldId(null);
    
    toast({
      title: "Pagina eliminata",
      description: "La pagina è stata eliminata con successo."
    });
  };

  const updatePage = (updatedPage: FormPage) => {
    const updatedPages = [...formData.pages];
    updatedPages[selectedPageIndex] = updatedPage;
    
    handleFormDataChange({
      ...formData,
      pages: updatedPages
    });
  };

  const handleFieldsReorder = (reorderedFields: FormField[]) => {
    const updatedPages = [...formData.pages];
    updatedPages[selectedPageIndex] = {
      ...currentPage,
      fields: reorderedFields.map((field, index) => ({
        ...field,
        order: index
      }))
    };

    handleFormDataChange({
      ...formData,
      pages: updatedPages
    });
  };

  const handleSave = () => {
    console.log('Form data saved:', formData);
    toast({
      title: "Form salvato",
      description: "Le modifiche al form sono state salvate con successo."
    });
    
    if (onChange) {
      onChange(formData);
    }
  };

  const handleImportForm = (formText: string) => {
    try {
      // Parse il formato specificato nel requisito
      const lines = formText.trim().split('---').map(l => l.trim());
      const importedFields: FormField[] = [];
      
      lines.forEach((line, lineIndex) => {
        if (!line) return;
        
        const parts = line.split('|');
        const questionId = parts[0].trim();
        
        const typeMatch = parts.find(p => p.startsWith('type='))?.split('=')[1];
        const questionMatch = parts.find(p => p.startsWith('question='))?.split('=')[1];
        const optionsMatch = parts.find(p => p.startsWith('options='))?.split('=')[1];
        const conditionMatch = parts.find(p => p.startsWith('condition='))?.split('=')[1];
        const scoreMatch = parts.find(p => p.startsWith('score='))?.split('=')[1];
        
        if (!typeMatch || !questionMatch) return;
        
        let options: FormField['options'] = [];
        
        if (optionsMatch && optionsMatch !== '[]') {
          // Estrae le opzioni dal formato [Opzione1:1|Opzione2:2]
          const optionsText = optionsMatch.replace(/^\[|\]$/g, '');
          options = optionsText.split('|').map(opt => {
            const [label, scoreStr] = opt.split(':');
            return {
              label,
              value: label.toLowerCase().replace(/\s+/g, '_'),
              score: parseInt(scoreStr) || 0
            };
          });
        }
        
        const newField: FormField = {
          id: `imported-${questionId}-${Date.now()}`,
          type: typeMatch,
          label: questionMatch,
          required: true,
          pageIndex: 0,
          order: lineIndex,
          options: ['radio', 'checkbox', 'select', 'multi-select', 'image-picker'].includes(typeMatch) ? options : undefined,
          conditionalLogic: {
            enabled: conditionMatch && conditionMatch !== 'null',
            rules: [],
            operator: 'and'
          }
        };
        
        importedFields.push(newField);
      });
      
      if (importedFields.length > 0) {
        // Crea una nuova pagina con i campi importati
        const newPage: FormPage = {
          id: uuidv4(),
          title: 'Pagina Importata',
          fields: importedFields,
          order: formData.pages.length
        };
        
        handleFormDataChange({
          ...formData,
          pages: [...formData.pages, newPage]
        });
        
        setSelectedPageIndex(formData.pages.length);
        toast({
          title: "Form importato",
          description: `Importati ${importedFields.length} campi con successo`
        });
      } else {
        toast({
          title: "Errore",
          description: "Nessun campo importato. Verifica il formato del file",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      toast({
        title: "Errore",
        description: "Impossibile importare il form. Verifica il formato del file",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8">
        <FormHeader 
          formData={formData} 
          onFormDataChange={handleFormDataChange}
          onImportForm={handleImportForm}
        />
        
        <PageSelector
          pages={formData.pages}
          selectedPageIndex={selectedPageIndex}
          onPageSelect={setSelectedPageIndex}
          onAddPage={addPage}
          onDeletePage={deletePage}
        />

        <PageEditor page={currentPage} onPageUpdate={updatePage} />

        <FieldList
          fields={currentPage.fields}
          selectedFieldId={selectedFieldId}
          onFieldSelect={setSelectedFieldId}
          onFieldDelete={deleteField}
          onFieldsReorder={handleFieldsReorder}
          onAddField={() => addField('text')}
          onSave={handleSave}
        />
      </div>
      
      <div className="col-span-12 lg:col-span-4">
        <FieldConfigPanel 
          field={selectedField} 
          allFields={allFields} 
          onUpdate={updateField} 
        />
      </div>
    </div>
  );
};

export default FormEditor;
