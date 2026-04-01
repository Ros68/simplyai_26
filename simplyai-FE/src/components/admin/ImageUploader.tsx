import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Image, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { saveImage } from "@/services/imageSave";

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void;
  label?: string;
  buttonText?: string;
  accept?: string;
}

const ImageUploader = ({
  onImageUpload,
  label = "Carica immagine",
  buttonText = "Carica immagine dal computer",
  accept = "image/*",
}: ImageUploaderProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await saveImage(formData);

      if (res && res.url) {
        onImageUpload(res.url); // e.g. "/uploads/1694093131234.jpg"
        toast({
          title: "Immagine caricata",
          description: "L'immagine è stata caricata con successo",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Errore",
        description:
          "Si è verificato un errore durante il caricamento dell'immagine",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full"
        disabled={uploading}
        onClick={() =>
          document
            .getElementById(
              `image-upload-${label.replace(/\s+/g, "-").toLowerCase()}`
            )
            ?.click()
        }
      >
        {uploading ? (
          "Caricamento..."
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>
      <input
        id={`image-upload-${label.replace(/\s+/g, "-").toLowerCase()}`}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUploader;
