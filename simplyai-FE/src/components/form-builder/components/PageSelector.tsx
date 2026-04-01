
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { FormPage } from '@/types/form-builder';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface PageSelectorProps {
  pages: FormPage[];
  selectedPageIndex: number;
  onPageSelect: (index: number) => void;
  onAddPage: () => void;
  onDeletePage?: (index: number) => void;
}

const PageSelector: React.FC<PageSelectorProps> = ({
  pages,
  selectedPageIndex,
  onPageSelect,
  onAddPage,
  onDeletePage,
}) => {
  return (
    <div className="flex mb-4 space-x-2 overflow-x-auto pb-2">
      {pages.map((page, index) => (
        <div key={page.id} className="flex items-center">
          <Button
            variant={selectedPageIndex === index ? "default" : "outline"}
            onClick={() => onPageSelect(index)}
            className="whitespace-nowrap"
          >
            {page.title || `Pagina ${index + 1}`}
          </Button>
          
          {pages.length > 1 && onDeletePage && (
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={() => onDeletePage(index)}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      ))}
      <Button 
        variant="ghost" 
        onClick={onAddPage}
        className="whitespace-nowrap"
      >
        <Plus className="h-4 w-4 mr-1" /> Nuova pagina
      </Button>
    </div>
  );
};

export default PageSelector;
