
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoveVertical, Trash2, Plus } from 'lucide-react';
import { FormField } from '@/types/form-builder';
import FormPreview from './FormPreview';

interface FieldListProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onFieldSelect: (fieldId: string) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldsReorder: (fields: FormField[]) => void;
  onAddField: () => void;
  onSave: () => void;
}

const FieldList: React.FC<FieldListProps> = ({
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldDelete,
  onFieldsReorder,
  onAddField,
  onSave,
}) => {
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedFields = items.map((field, index) => ({
      ...field,
      order: index
    }));

    onFieldsReorder(reorderedFields);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="fields">
        {(provided, snapshot) => (
          <Card 
            className={`p-4 ${snapshot.isDraggingOver ? 'bg-gray-50 border-primary' : ''}`}
            {...provided.droppableProps} 
            ref={provided.innerRef}
          >
            <CardHeader className="px-0 pt-0">
              <CardTitle>Domande nella pagina</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-2">
              {fields.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-md">
                  <p className="text-muted-foreground">
                    Trascina qui i tipi di domanda o fai clic sul pulsante "Aggiungi Domanda" 
                    per aggiungere una nuova domanda
                  </p>
                </div>
              )}
              
              {fields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`mb-2 border rounded-md p-3 ${selectedFieldId === field.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'} ${snapshot.isDragging ? 'shadow-lg bg-white' : ''}`}
                      onClick={() => onFieldSelect(field.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{field.label}</div>
                        <div className="flex items-center">
                          <div {...provided.dragHandleProps} className="cursor-move mr-2">
                            <MoveVertical className="h-4 w-4 text-gray-500" />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFieldDelete(field.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="pointer-events-none opacity-70">
                        <FormPreview fields={[field]} />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              <Button 
                variant="outline" 
                className="w-full mt-4 border-dashed"
                onClick={onAddField}
              >
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Domanda
              </Button>
            </CardContent>
            <CardFooter className="px-0 pt-4">
              <Button onClick={onSave} className="w-full">
                Salva Form
              </Button>
            </CardFooter>
          </Card>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default FieldList;
