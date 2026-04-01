import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { API_BASE_URL } from "@/config/api";

interface LocalImageUploaderProps {
  onImageUpload: (imageUrl: string) => void;
  label?: string;
  buttonText?: string;
  accept?: string;
  uploadType: "logo" | "favicon";
}

const LocalImageUploader = ({
  onImageUpload,
  label = "Carica immagine",
  buttonText = "Carica immagine dal computer",
  accept = "image/*",
  uploadType,
}: LocalImageUploaderProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);

      // Upload to backend
      const uploadUrl = `${API_BASE_URL}/upload/${uploadType}`;
      console.log("LocalImageUploader - API_BASE_URL:", API_BASE_URL);
      console.log("LocalImageUploader - Upload URL:", uploadUrl);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Upload failed");
      }

      // Call the callback with the uploaded file URL
      onImageUpload(result.data.url);

      toast({
        title: `${uploadType === "logo" ? "Logo" : "Favicon"} caricato`,
        description: `Il ${
          uploadType === "logo" ? "logo" : "favicon"
        } è stato caricato con successo e salvato nel database`,
      });

      // Clear the input
      event.target.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Errore durante il caricamento",
        description:
          error instanceof Error
            ? error.message
            : "Si è verificato un errore durante il caricamento",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() =>
            document.getElementById(`${uploadType}-upload`)?.click()
          }
          className="flex items-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Caricamento...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {buttonText}
            </>
          )}
        </Button>

        <input
          id={`${uploadType}-upload`}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {uploading && (
        <div className="text-sm text-muted-foreground">
          Caricamento e salvataggio nel database...
        </div>
      )}
    </div>
  );
};

export default LocalImageUploader;
