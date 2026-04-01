import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Image,
  Layout,
  Save,
  Heading1,
  Heading2,
  Heading3,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageUploader from "./ImageUploader";

interface PageEditorToolbarProps {
  onInsertHeading: (level: number) => void;
  onInsertParagraph: () => void;
  onInsertLayout: (columns: number) => void;
  onInsertImage: (imageUrl: string) => void;
  onSave: () => void;
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onAlign?: (alignment: string) => void;
  onNewSection: () => void;
  onPreview?: () => void;
  onFontSize?: (size: string) => void;
  onList?: (type: 'bullet' | 'ordered') => void;
  editorRef?: React.RefObject<any>;
}

const PageEditorToolbar = ({
  onInsertHeading,
  onInsertParagraph,
  onInsertLayout,
  onInsertImage,
  onSave,
  onBold,
  onItalic,
  onUnderline,
  onAlign,
  onNewSection,
  onPreview,
  onFontSize,
  onList,
  editorRef,
}: PageEditorToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editorRef?.current) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        onInsertImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="border rounded-md p-3 bg-gray-50 shadow-sm sticky top-0 z-10">
      <div className="flex flex-col gap-3">
        {/* Row 1: Text Formatting - COMPLETE */}
        <div className="flex flex-wrap gap-1 items-center border-b pb-2">
          {/* Font Size Dropdown */}
          <Select onValueChange={(value) => onFontSize?.(value)}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="false">Normal</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="huge">Huge</SelectItem>
            </SelectContent>
          </Select>

          {/* Text Style Buttons */}
          <div className="flex gap-1 border-l pl-2 ml-2">
            <Button variant="ghost" size="sm" onClick={onBold} title="Bold (Ctrl+B)">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onItalic} title="Italic (Ctrl+I)">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onUnderline} title="Underline (Ctrl+U)">
              <Underline className="h-4 w-4" />
            </Button>
          </div>

          {/* Alignment Buttons */}
          <div className="flex gap-1 border-l pl-2 ml-2">
            <Button variant="ghost" size="sm" onClick={() => onAlign?.('left')} title="Align Left">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAlign?.('center')} title="Align Center">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAlign?.('right')} title="Align Right">
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAlign?.('justify')} title="Justify">
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          {/* Heading Buttons */}
          <div className="flex gap-1 border-l pl-2 ml-2">
            <Button variant="ghost" size="sm" onClick={() => onInsertHeading(1)} title="Heading 1">
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onInsertHeading(2)} title="Heading 2">
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onInsertHeading(3)} title="Heading 3">
              <Heading3 className="h-4 w-4" />
            </Button>
          </div>

          {/* List Buttons */}
          <div className="flex gap-1 border-l pl-2 ml-2">
            <Button variant="ghost" size="sm" onClick={() => onList?.('bullet')} title="Bullet List">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onList?.('ordered')} title="Numbered List">
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Row 2: Layout & Media */}
        <div className="flex flex-wrap gap-1 items-center border-b pb-2">
          <Button variant="outline" size="sm" onClick={onNewSection}>
            <Layout className="mr-2 h-3 w-3" />
            New Section
          </Button>

          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => onInsertLayout(2)}>
              2 Columns
            </Button>
            <Button variant="outline" size="sm" onClick={() => onInsertLayout(3)}>
              3 Columns
            </Button>
          </div>

          <div className="flex gap-1 border-l pl-2 ml-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Image className="mr-2 h-3 w-3" />
                  Upload Image
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Image</DialogTitle>
                </DialogHeader>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="grid gap-4">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Choose File
                  </Button>
                  <ImageUploader onImageUpload={onInsertImage} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Row 3: Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={onSave}>
              <Save className="mr-2 h-4 w-4" />
              Salva Modifiche
            </Button>
            {onPreview && (
              <Button variant="outline" size="sm" onClick={onPreview}>
                <Eye className="mr-2 h-4 w-4" />
                Anteprima
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageEditorToolbar;