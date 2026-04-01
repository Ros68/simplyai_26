import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  BookOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";

// Complete Question Type Registry for validation and documentation
export const QUESTION_TYPE_REGISTRY = {
  text: { name: "text", label: "Text Input", description: "Single line text input" },
  checkbox: { name: "checkbox", label: "Multiple Choice (Checkbox)", description: "Multiple selection with checkboxes" },
  radiogroup: { name: "radiogroup", label: "Single Choice (Radio)", description: "Single selection with radio buttons" },
  dropdown: { name: "dropdown", label: "Dropdown", description: "Single selection from dropdown menu" },
  comment: { name: "comment", label: "Paragraph", description: "Multi-line text area" },
  rating: { name: "rating", label: "Rating Scale", description: "Star or number rating scale" },
  ranking: { name: "ranking", label: "Ranking", description: "Drag to rank items in order" },
  imagepicker: { name: "imagepicker", label: "Image Selection", description: "Select from images" },
  boolean: { name: "boolean", label: "Yes/No", description: "True/false or yes/no question" },
  file: { name: "file", label: "File Upload", description: "Upload files" },
  matrix: { name: "matrix", label: "Matrix (Single Choice)", description: "Grid with single choice per row" },
  matrixdropdown: { name: "matrixdropdown", label: "Matrix (Dropdown)", description: "Grid with dropdown choices per cell" },
  multipletext: { name: "multipletext", label: "Multiple Text Fields", description: "Multiple text inputs in one question" },
  signaturepad: { name: "signaturepad", label: "Signature", description: "Draw signature" },
  html: { name: "html", label: "HTML Content", description: "Static HTML content block" },
  image: { name: "image", label: "Image Display", description: "Display an image" }
};

interface FormImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

interface ParsedQuestion {
  number?: number;
  page?: number;
  title: string;
  type: string;
  choices?: any[]; // 🌟 FIX: Array of objects accepted for imageLink support
  description?: string;
  lesson?: string;
  guide?: string;
  required?: boolean;
  imagePath?: string;
  conditionLogic?: string;
}

export default function FormImportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: FormImportDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States
  const [importType, setImportType] = useState<"file" | "text" | "json">("file");
  const [fileFormat, setFileFormat] = useState<"txt" | "csv" | "json">("txt");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [jsonContent, setJsonContent] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const resetForm = () => {
    setSelectedFile(null);
    setTextContent("");
    setJsonContent("");
    setFormTitle("");
    setFormDescription("");
    setParsedQuestions([]);
    setValidationErrors([]);
    setPreviewMode(false);
    setImportType("file");
    setFileFormat("txt");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (fileFormat === "json") {
        parseJSONFile(file);
      } else {
        parseTextFile(file);
      }
    }
  };

  const parseTextFile = async (file: File) => {
    try {
      const text = await file.text();
      const questions = fileFormat === "csv" ? parseCSV(text) : parseTXT(text);
      
      setParsedQuestions(questions);

      if (!formTitle) {
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setFormTitle(fileName);
      }
    } catch (error) {
      console.error("File parsing error:", error);
      toast({
        title: "Error parsing file",
        description: "Could not read the selected file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const parseJSONFile = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      const errors = validateSurveyJSON(json);
      setValidationErrors(errors);

      if (errors.length === 0) {
        setJsonContent(text);
        setFormTitle(json.title || file.name.replace(/\.[^/.]+$/, ""));
        setFormDescription(json.description || "");
        setParsedQuestions(convertJSONToParsedQuestions(json));
      } else {
        toast({
          title: "JSON validation failed",
          description: `Found ${errors.length} errors. Please fix JSON.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "The file contains invalid JSON syntax.",
        variant: "destructive",
      });
    }
  };

  const validateSurveyJSON = (json: any): string[] => {
    const errors: string[] = [];
    if (!json.title) errors.push("Missing required field: title");
    if (!json.pages || !Array.isArray(json.pages)) {
      errors.push("Missing or invalid field: pages (must be an array)");
      return errors;
    }
    return errors;
  };

  const convertJSONToParsedQuestions = (json: any): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = [];
    json.pages.forEach((page: any) => {
      const pageNum = parseInt(page.name?.replace("page_", "")) || 1;
      page.elements.forEach((element: any) => {
        const q: ParsedQuestion = {
          number: parseInt(element.name?.replace("question_", "")) || questions.length + 1,
          page: pageNum,
          title: element.title,
          type: element.type,
          description: element.description,
          lesson: element.lesson,
          guide: element.guide,
          required: element.isRequired,
          imagePath: element.questionImage,
          conditionLogic: element.visibleIf,
        };
        if (element.choices) {
          q.choices = element.choices.map((c: any) => {
            if (typeof c === "string") return c;
            const scoreStr = c.score !== undefined ? ` (score: ${c.score})` : "";
            return `${c.text || c.value}${scoreStr}`;
          });
        }
        questions.push(q);
      });
    });
    return questions;
  };

  // 🌟 FIX: Refactored parseTXT to handle imageLink seamlessly
  const parseTXT = (content: string): ParsedQuestion[] => {
    const lines = content.split("\n").map((line) => line.trim()).filter((line) => line);
    const questions: ParsedQuestion[] = [];
    let currentQuestion: Partial<ParsedQuestion> = {};
    let inOptionsSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("Number of the Question:")) {
        if (currentQuestion.title) questions.push(currentQuestion as ParsedQuestion);
        currentQuestion = { number: parseInt(line.replace("Number of the Question:", "").trim()) || 1, type: "text", required: false };
        inOptionsSection = false;
      } else if (line.startsWith("Page:")) {
        currentQuestion.page = parseInt(line.replace("Page:", "").trim()) || 1;
      } else if (line.startsWith("Type of question:")) {
        const qType = line.replace("Type of question:", "").trim().toLowerCase();
        currentQuestion.type = QUESTION_TYPE_REGISTRY[qType as keyof typeof QUESTION_TYPE_REGISTRY] ? qType : "text";
      } else if (line.startsWith("Title:")) {
        currentQuestion.title = line.replace("Title:", "").trim();
      } else if (line.startsWith("Description:")) {
        const desc = line.replace("Description:", "").trim();
        if (desc) {
          currentQuestion.description = desc;
          if (!currentQuestion.title) currentQuestion.title = desc;
        }
      } else if (line.startsWith("Image path:")) {
        const imagePath = line.replace("Image path:", "").trim();
        if (imagePath) currentQuestion.imagePath = imagePath;
      } else if (line.startsWith("Options/ answers:")) {
        inOptionsSection = true;
        currentQuestion.choices = [];
      } else if (line.startsWith("Guide:")) {
        currentQuestion.guide = line.replace("Guide:", "").trim();
        inOptionsSection = false;
      } else if (line.startsWith("Lesson:")) {
        currentQuestion.lesson = line.replace("Lesson:", "").trim();
        inOptionsSection = false;
      } else if (line.startsWith("Condition logic:")) {
        currentQuestion.conditionLogic = line.replace("Condition logic:", "").trim();
        inOptionsSection = false;
      } else if (inOptionsSection && /^[a-z]\)/.test(line)) {
        if (!currentQuestion.choices) currentQuestion.choices = [];
        
        let processingLine = line.trim();
        let imageLink = undefined;
        let score = undefined;

        // Extract Image Link
        const imageSplit = processingLine.split(/\|\s*imageLink:/i);
        if (imageSplit.length > 1) {
          imageLink = imageSplit[1].trim();
          processingLine = imageSplit[0].trim();
        }

        // Extract Score
        const scoreMatch = processingLine.match(/\(score:\s*(\d+)\)$/i);
        if (scoreMatch) {
          score = parseInt(scoreMatch[1]);
          processingLine = processingLine.replace(/\(score:\s*\d+\)$/i, '').trim();
        }

        // Extract Text
        const choiceText = processingLine.replace(/^[a-z]\)\s*/i, '').trim();

        currentQuestion.choices.push({
          text: choiceText,
          score: score,
          imageLink: imageLink
        });
      } else if (/^\d+\./.test(line) || line.startsWith("Q:")) {
        if (currentQuestion.title) questions.push(currentQuestion as ParsedQuestion);
        currentQuestion = { title: line.replace(/^\d+\.\s*|^Q:\s*/, ""), type: "text", required: false };
        inOptionsSection = false;
      } else if (line.startsWith("D:")) {
        currentQuestion.description = line.substring(2).trim();
      } else if (line.startsWith("L:")) {
        currentQuestion.lesson = line.substring(2).trim();
      } else if (line.startsWith("G:")) {
        currentQuestion.guide = line.substring(2).trim();
      } else if (line.startsWith("T:")) {
        const qType = line.substring(2).trim().toLowerCase();
        currentQuestion.type = QUESTION_TYPE_REGISTRY[qType as keyof typeof QUESTION_TYPE_REGISTRY] ? qType : "text";
      } else if (line.startsWith("R:")) {
        currentQuestion.required = line.substring(2).trim().toLowerCase() === "yes";
      } else if ((line.startsWith("-") || line.startsWith("*")) && !inOptionsSection) {
        if (!currentQuestion.choices) currentQuestion.choices = [];
        currentQuestion.choices.push(line.substring(1).trim());
      }
    }

    if (currentQuestion.title || currentQuestion.description) {
      if (!currentQuestion.title && currentQuestion.description) currentQuestion.title = currentQuestion.description;
      if (currentQuestion.title) questions.push(currentQuestion as ParsedQuestion);
    }
    return questions;
  };

  const parseCSV = (content: string): ParsedQuestion[] => {
    const lines = content.split("\n").map((line) => line.trim()).filter((line) => line);
    const questions: ParsedQuestion[] = [];
    if (lines.length < 2) return questions;

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const dataLines = lines.slice(1);

    for (const line of dataLines) {
      const columns: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          columns.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      columns.push(current.trim());
      if (columns.length < 2) continue;

      const question: ParsedQuestion = { title: "", type: "text", required: false };

      headers.forEach((header, index) => {
        const value = columns[index] ? columns[index].replace(/^"|"$/g, "") : "";
        switch (header) {
          case "number": question.number = parseInt(value) || undefined; break;
          case "page": question.page = parseInt(value) || undefined; break;
          case "title": question.title = value; break;
          case "type": question.type = QUESTION_TYPE_REGISTRY[value as keyof typeof QUESTION_TYPE_REGISTRY] ? value : "text"; break;
          case "choices": if (value) question.choices = value.split("|").map((c) => c.trim()); break;
          case "description": question.description = value; break;
          case "lesson": question.lesson = value; break;
          case "guide": question.guide = value; break;
          case "required": question.required = value.toLowerCase() === "yes"; break;
          case "imagepath": case "image_path": case "image": question.imagePath = value; break;
          case "conditionlogic": case "condition_logic": case "visibleif": question.conditionLogic = value; break;
        }
      });

      if (question.title) questions.push(question);
    }
    return questions;
  };

  const handleTextContentChange = (val: string) => {
    if (importType === "json") {
      setJsonContent(val);
      try {
        const parsed = JSON.parse(val);
        setParsedQuestions(convertJSONToParsedQuestions(parsed));
      } catch (e) {
        setParsedQuestions([]);
      }
      return;
    }

    setTextContent(val);
    if (val.trim()) {
      const questions = fileFormat === "csv" ? parseCSV(val) : parseTXT(val);
      setParsedQuestions(questions);
    } else {
      setParsedQuestions([]);
    }
  };

  const processImagesInJSON = async (json: any): Promise<any> => {
    return JSON.parse(JSON.stringify(json));
  };

  // 🌟 FIX: Map options into SurveyJS required format securely
  const convertToSurveyJS = (questions: ParsedQuestion[]) => {
    const pageGroups: { [key: number]: ParsedQuestion[] } = {};
    questions.forEach((q) => {
      const pageNum = q.page || 1;
      if (!pageGroups[pageNum]) pageGroups[pageNum] = [];
      pageGroups[pageNum].push(q);
    });

    const pages = Object.keys(pageGroups)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((pageNum) => {
        const elements = pageGroups[parseInt(pageNum)].map((q, index) => {
          const element: any = {
            name: q.number ? `question_${q.number}` : `question_${index + 1}`,
            title: q.title,
            type: q.type,
            isRequired: q.required || false,
          };

          if (q.description) element.description = q.description;
          if (q.lesson) element.lesson = q.lesson;
          if (q.guide) element.guide = q.guide;
          if (q.imagePath) element.questionImage = q.imagePath;
          if (q.conditionLogic) element.visibleIf = q.conditionLogic;

          if (q.choices && q.choices.length > 0) {
            element.choices = q.choices.map((choice: any, choiceIndex: number) => {
              if (typeof choice === 'object' && choice !== null) {
                return { value: `choice_${choiceIndex + 1}`, text: choice.text, score: choice.score, imageLink: choice.imageLink };
              }
              if (typeof choice === 'string') {
                const scoreMatch = choice.match(/^(.+?)\s*\(score:\s*(\d+)\)$/);
                if (scoreMatch) {
                  return { value: `choice_${choiceIndex + 1}`, text: scoreMatch[1].trim(), score: parseInt(scoreMatch[2]) };
                } else {
                  return { value: `choice_${choiceIndex + 1}`, text: choice };
                }
              }
              return choice;
            });
          }
          return element;
        });

        return { name: `page_${pageNum}`, title: `Page ${pageNum}`, elements: elements };
      });

    return { pages: pages.length > 0 ? pages : [{ name: "page1", title: "Page 1", elements: [] }] };
  };

  const handleImport = async () => {
    if (!formTitle.trim()) {
      toast({ title: "Form title required", description: "Please enter a title for the form.", variant: "destructive" });
      return;
    }

    let surveyJSON: any;
    
    if (importType === "json" && jsonContent) {
      try {
        surveyJSON = JSON.parse(jsonContent);
        surveyJSON = await processImagesInJSON(surveyJSON);
      } catch (e) {
        toast({ title: "Invalid JSON", description: "Please check your JSON syntax.", variant: "destructive" });
        return;
      }
    } else {
      if (parsedQuestions.length === 0) {
        toast({ title: "No questions found", description: "Please provide questions to import.", variant: "destructive" });
        return;
      }
      surveyJSON = convertToSurveyJS(parsedQuestions);
    }

    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || "https://simplyai.it/api";
      
      const response = await fetch(`${API_URL}/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          surveyJSON: surveyJSON,
          status: "published",
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast({ title: "Import successful", description: `Form "${formTitle}" has been imported successfully.` });
        onImportSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        throw new Error(result.message || "Import failed");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An error occurred during import.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Questionnaire
          </DialogTitle>
          <DialogDescription>
            Import questions from a text file, CSV file, or JSON data. Supported formats: TXT, CSV, and JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Type Selection */}
          <div className="space-y-4">
            <Label>Import Method</Label>
            <div className="flex gap-4">
              <Button
                variant={importType === "file" ? "default" : "outline"}
                onClick={() => setImportType("file")}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Upload File
              </Button>
              <Button
                variant={importType === "text" ? "default" : "outline"}
                onClick={() => setImportType("text")}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Paste Text
              </Button>
              <Button
                  variant={importType === "json" ? "default" : "outline"}
                  onClick={() => {
                    setImportType("json");
                    setFileFormat("json");
                  }}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  JSON
                </Button>
            </div>
          </div>

          {/* File Format Selection */}
          <div className="space-y-2">
            <Label>File Format</Label>
            <Select
              value={fileFormat}
              onValueChange={(value: "txt" | "csv" | "json") => {
                setFileFormat(value);
                if(value === 'json') setImportType('json');
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="txt">Text File (.txt)</SelectItem>
                <SelectItem value="csv">CSV File (.csv)</SelectItem>
                <SelectItem value="json">JSON File (.json)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          {importType === "file" && (
            <div className="space-y-2">
              <Label>Select File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept={fileFormat === "csv" ? ".csv" : fileFormat === "json" ? ".json" : ".txt"}
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  {selectedFile.name} selected
                </div>
              )}
            </div>
          )}

          {/* Text Input */}
          {(importType === "text" || importType === "json") && (
            <div className="space-y-2">
              <Label>{importType === 'json' ? "Paste your JSON" : "Paste your questions"}</Label>
              <Textarea
                placeholder={
                  importType === "json" 
                  ? '{"title": "My Form", "pages": []}' 
                  : fileFormat === "csv"
                  ? "title,type,choices...\nQuestion 1,text,"
                  : "1. What is your name?\nT: text\nR: yes"
                }
                value={importType === "json" ? jsonContent : textContent}
                onChange={(e) => handleTextContentChange(e.target.value)}
                rows={10}
              />
            </div>
          )}

          {/* Form Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Form Title *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Enter form title"
              />
            </div>
            <div className="space-y-2">
              <Label>Form Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Enter form description (optional)"
                rows={3}
              />
            </div>
          </div>

          {/* Preview */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Preview ({parsedQuestions.length} questions)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? "Hide Preview" : "Show Preview"}
                </Button>
              </div>

              {previewMode && (
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-3">
                  {parsedQuestions.map((question, index) => (
                    <div key={index} className="border-b pb-3 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {question.number
                            ? `${question.number}. `
                            : `${index + 1}. `}
                          {question.title}
                        </div>
                        <div className="flex gap-2 text-xs">
                          {question.page && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Page {question.page}
                            </span>
                          )}
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            {question.type}
                          </span>
                          {question.required && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                        </div>
                      </div>

                      {question.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Description:</span>{" "}
                          {question.description}
                        </div>
                      )}

                      {question.imagePath && (
                        <div className="text-sm text-purple-600 mt-1">
                          <span className="font-medium">Image:</span>{" "}
                          {question.imagePath}
                        </div>
                      )}

                      {/* 🌟 FIX: Safe rendering to prevent Object crash */}
                      {question.choices && question.choices.length > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">Choices:</span>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            {question.choices.map((choice: any, i) => (
                              <li key={i}>
                                {typeof choice === 'object' && choice !== null ? (
                                  <>
                                    {choice.text} 
                                    {choice.score ? ` (score: ${choice.score})` : ""} 
                                    {choice.imageLink ? <span className="text-blue-500 ml-1">[Image: {choice.imageLink}]</span> : ""}
                                  </>
                                ) : (
                                  String(choice)
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {question.lesson && (
                        <div className="text-sm text-yellow-600 mt-1">
                          <span className="font-medium">Lesson:</span>{" "}
                          {question.lesson}
                        </div>
                      )}

                      {question.guide && (
                        <div className="text-sm text-blue-600 mt-1">
                          <span className="font-medium">Guide:</span>{" "}
                          {question.guide}
                        </div>
                      )}

                      {question.conditionLogic && (
                        <div className="text-sm text-green-600 mt-1">
                          <span className="font-medium">Condition:</span>{" "}
                          {question.conditionLogic}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Format Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Format Instructions:</div>
                {fileFormat === "txt" ? (
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>New Format:</strong>
                    </div>
                    <div>• Number of the Question: [number]</div>
                    <div>• Page: [page number]</div>
                    <div>
                      • Type of question: [text, radiogroup, checkbox, imagepicker, etc.]
                    </div>
                    <div>• Description: [question description]</div>
                    <div>• Image path: [/uploads/image.jpg or empty]</div>
                    <div>
                      • Options/ answers: [followed by a) option (score: 1) | imageLink: /path.jpg]
                    </div>
                    <div>• Guide: [guide text]</div>
                    <div>• Lesson: [lesson text]</div>
                    <div>• Condition logic: [if Q6 &gt;= 4 then show Q7]</div>
                    <div className="pt-1 text-xs text-gray-500">
                      <strong>Legacy format also supported:</strong> Questions
                      start with numbers (1., 2.) or Q:, D: for description, L:
                      for lesson, G: for guide, T: for type, R: yes/no for
                      required, choices start with - or *
                    </div>
                  </div>
                ) : fileFormat === "csv" ? (
                  <div className="text-sm space-y-1">
                    <div>
                      <strong>New CSV Format:</strong>
                    </div>
                    <div>
                      • Columns: number, page, title, type, choices,
                      description, lesson, guide, required, imagePath,
                      conditionLogic
                    </div>
                    <div>• Separate multiple choices with | (pipe)</div>
                    <div>• Include scores in choices: "Option (score: 1)"</div>
                    <div>• Use quotes for text containing commas</div>
                    <div className="pt-1 text-xs text-gray-500">
                      <strong>Legacy format also supported:</strong> title,
                      type, choices, description, lesson, guide, required
                    </div>
                  </div>
                ) : (
                  <div className="text-sm space-y-1">
                     <div>
                      <strong>JSON Format:</strong> Native SurveyJS JSON structure.
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <div className="font-medium">Download Templates:</div>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          "/templates/questionnaire-template.txt",
                          "_blank"
                        )
                      }
                    >
                      Download TXT Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          "/templates/questionnaire-template.csv",
                          "_blank"
                        )
                      }
                    >
                      Download CSV Template
                    </Button>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              loading || parsedQuestions.length === 0 || !formTitle.trim()
            }
          >
            {loading ? "Importing..." : "Import Form"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}