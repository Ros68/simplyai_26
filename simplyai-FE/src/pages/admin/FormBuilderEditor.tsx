import React, { useRef, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { SurveyCreatorComponent, SurveyCreator } from "survey-creator-react";
import "survey-creator-core/survey-creator-core.css";
import "survey-core/survey-core.css";
import { Serializer, SurveyModel } from "survey-core";
import { registerCustomProperties } from "@/lib/surveyjs-properties";
import FormImportDialog from "@/components/admin/FormImportDialog";
import { FileUp, Download } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

// Define complete question type registry for import validation
export const QUESTION_TYPE_REGISTRY = {
  // Standard SurveyJS types
  text: {
    name: "text",
    properties: ["name", "title", "description", "isRequired", "inputType", "placeholder", "maxLength", "min", "max", "step"],
    defaultJSON: { type: "text", name: "question1", title: "Question" }
  },
  checkbox: {
    name: "checkbox",
    properties: ["name", "title", "description", "isRequired", "choices", "showSelectAll", "showNoneItem", "noneText", "colCount"],
    defaultJSON: { type: "checkbox", name: "question1", title: "Question", choices: ["Item 1", "Item 2", "Item 3"] }
  },
  radiogroup: {
    name: "radiogroup",
    properties: ["name", "title", "description", "isRequired", "choices", "showClearButton", "colCount"],
    defaultJSON: { type: "radiogroup", name: "question1", title: "Question", choices: ["Item 1", "Item 2", "Item 3"] }
  },
  dropdown: {
    name: "dropdown",
    properties: ["name", "title", "description", "isRequired", "choices", "showNoneItem", "noneText", "choicesMin", "choicesMax", "choicesStep"],
    defaultJSON: { type: "dropdown", name: "question1", title: "Question", choices: ["Item 1", "Item 2", "Item 3"] }
  },
  comment: {
    name: "comment",
    properties: ["name", "title", "description", "isRequired", "rows", "cols", "maxLength", "placeholder"],
    defaultJSON: { type: "comment", name: "question1", title: "Question" }
  },
  rating: {
    name: "rating",
    properties: ["name", "title", "description", "isRequired", "rateMin", "rateMax", "rateStep", "rateType", "minRateDescription", "maxRateDescription"],
    defaultJSON: { type: "rating", name: "question1", title: "Question", rateMin: 1, rateMax: 5 }
  },
  ranking: {
    name: "ranking",
    properties: ["name", "title", "description", "isRequired", "choices"],
    defaultJSON: { type: "ranking", name: "question1", title: "Question", choices: ["Item 1", "Item 2", "Item 3"] }
  },
  imagepicker: {
    name: "imagepicker",
    properties: ["name", "title", "description", "isRequired", "choices", "showLabel", "multiSelect", "imageFit", "imageHeight", "imageWidth"],
    defaultJSON: { type: "imagepicker", name: "question1", title: "Question", choices: [{value: "lion", imageLink: "https://example.com/lion.jpg", text: "Lion"}] }
  },
  boolean: {
    name: "boolean",
    properties: ["name", "title", "description", "isRequired", "labelTrue", "labelFalse", "valueTrue", "valueFalse"],
    defaultJSON: { type: "boolean", name: "question1", title: "Question" }
  },
  expression: {
    name: "expression",
    properties: ["name", "title", "description", "expression", "displayStyle", "format", "maximumFractionDigits"],
    defaultJSON: { type: "expression", name: "question1", title: "Question", expression: "{question2} + {question3}" }
  },
  file: {
    name: "file",
    properties: ["name", "title", "description", "isRequired", "allowMultiple", "showPreview", "acceptedTypes", "maxSize", "storeDataAsText"],
    defaultJSON: { type: "file", name: "question1", title: "Question", storeDataAsText: true }
  },
  matrix: {
    name: "matrix",
    properties: ["name", "title", "description", "isRequired", "columns", "rows", "isAllRowRequired"],
    defaultJSON: { type: "matrix", name: "question1", title: "Question", columns: ["Column 1", "Column 2"], rows: ["Row 1", "Row 2"] }
  },
  matrixdropdown: {
    name: "matrixdropdown",
    properties: ["name", "title", "description", "isRequired", "columns", "rows", "cellType", "choices"],
    defaultJSON: { type: "matrixdropdown", name: "question1", title: "Question", columns: [{name: "col1"}], rows: [{value: "row1", text: "Row 1"}] }
  },
  multipletext: {
    name: "multipletext",
    properties: ["name", "title", "description", "isRequired", "items", "itemSize", "colCount"],
    defaultJSON: { type: "multipletext", name: "question1", title: "Question", items: [{name: "text1", title: "Text 1"}] }
  },
  signaturepad: {
    name: "signaturepad",
    properties: ["name", "title", "description", "isRequired", "width", "height", "penColor", "backgroundColor"],
    defaultJSON: { type: "signaturepad", name: "question1", title: "Question" }
  },
  html: {
    name: "html",
    properties: ["name", "html"],
    defaultJSON: { type: "html", name: "question1", html: "<h3>HTML Content</h3>" }
  },
  image: {
    name: "image",
    properties: ["name", "imageLink", "contentMode", "imageFit", "imageHeight", "imageWidth", "text"],
    defaultJSON: { type: "image", name: "question1", imageLink: "https://example.com/image.jpg" }
  }
};

// Complete Import Schema Documentation
export const IMPORT_SCHEMA_DOCUMENTATION = {
  version: "1.0",
  description: "Complete schema for importing questionnaires into SimplyAI",
  rootObject: {
    title: "string (required) - Title of the questionnaire",
    description: "string (optional) - Description of the questionnaire",
    logo: "string (optional) - URL to logo image or base64 encoded image",
    status: "string (optional) - 'draft' or 'published', default: 'draft'",
    pages: "array (required) - Array of page objects"
  },
  pageObject: {
    name: "string (optional) - Unique identifier for the page",
    title: "string (optional) - Title shown at top of page",
    description: "string (optional) - Description text",
    elements: "array (required) - Array of question elements"
  },
  elementObject: {
    type: "string (required) - One of the registered question types",
    name: "string (required) - Unique identifier for the question",
    title: "string (required) - Question text shown to user",
    description: "string (optional) - Help text below question",
    isRequired: "boolean (optional) - Whether answer is required",
    visibleIf: "string (optional) - Conditional logic expression",
    enableIf: "string (optional) - Enable/disable condition",
    questionImage: "string (optional) - URL or base64 of question image",
    guide: "string (optional) - Help/guide text for this question",
    lesson: "string (optional) - Educational content/lesson text"
  },
  choiceObject: {
    value: "string (required) - Internal value",
    text: "string (optional) - Display text",
    imageLink: "string (optional) - URL to image for imagepicker",
    score: "number (optional) - Points awarded for this choice"
  },
  conditionalLogic: {
    visibleIf: "string - Expression like '{question1} = 'value1''",
    enableIf: "string - Expression like '{question1} notempty'",
    requiredIf: "string - Expression like '{question1} = 'yes''",
    setValue: "string - Expression to calculate value",
    runExpression: "string - Expression to run"
  },
  fileHandling: {
    images: {
      storage: "Base64 encoded in JSON or URL reference",
      maxSize: "5MB recommended for base64",
      formats: ["jpg", "jpeg", "png", "gif", "webp"]
    },
    uploads: {
      storage: "Base64 in JSON for small files, URL for large files",
      maxSize: "10MB for base64 storage",
      types: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "png"]
    }
  }
};

export default function FormBuilderEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const creatorRef = useRef<SurveyCreator | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Configure custom properties
  useEffect(() => {
    console.log("Setting up FormBuilderEditor with complete question support");

    // Register all custom properties
    registerCustomProperties();

    // Add 'score' property to choices - this will appear in the Choice table
    if (!Serializer.findProperty("itemvalue", "score")) {
      Serializer.addProperty("itemvalue", {
        name: "score:number",
        displayName: "Score (Points)",
        category: "general",
        visibleIndex: 3,
        minValue: 0,
        maxValue: 100,
        default: 0,
        isRequired: false,
      });
    }

    // Add 'questionImage' property to all questions
    if (!Serializer.findProperty("question", "questionImage")) {
      Serializer.addProperty("question", {
        name: "questionImage:text",
        displayName: "Question Image URL",
        category: "Custom Properties",
        visibleIndex: 100,
        isRequired: false,
      });
    }

    // Add 'guide' property to all questions
    if (!Serializer.findProperty("question", "guide")) {
      Serializer.addProperty("question", {
        name: "guide:text",
        displayName: "Guide/Help Text",
        category: "Custom Properties",
        visibleIndex: 101,
        isRequired: false,
      });
    }

    // Add 'lesson' property to all questions
    if (!Serializer.findProperty("question", "lesson")) {
      Serializer.addProperty("question", {
        name: "lesson:text",
        displayName: "Lesson Content",
        category: "Custom Properties",
        visibleIndex: 102,
        isRequired: false,
      });
    }

    // Add 'showScores' property to question level
    if (!Serializer.findProperty("question", "showScores")) {
      Serializer.addProperty("question", {
        name: "showScores:boolean",
        displayName: "Show Answer Scores",
        category: "Custom Properties",
        visibleIndex: 103,
        default: false,
      });
    }

    // Add 'description' property to all questions if not already present
    if (!Serializer.findProperty("question", "description")) {
      Serializer.addProperty("question", {
        name: "description:text",
        displayName: "Description",
        category: "General",
        visibleIndex: 2,
        isRequired: false,
      });
    }
  }, []);

  if (!creatorRef.current) {
    creatorRef.current = new SurveyCreator({
      showToolbox: true,
      showLogicTab: true,
      isAutoSave: false,
      showTranslationTab: false,
      showThemeTab: true,
      showTestSurveyTab: true,
      showJSONEditorTab: true,
      showSidebar: true,
      showOptions: true,
      allowDefaultToolboxItems: true,
      allowModifyPages: true,
      allowModifyQuestions: true,
      allowModifyChoices: true,
      allowModifySurvey: true,
      storeOthersAsComment: false,
      showFileOptions: true,
      // Enable all question types
      supportedQuestionTypes: [
        "text", "checkbox", "radiogroup", "dropdown", "comment", "rating",
        "ranking", "imagepicker", "boolean", "expression", "file", "matrix",
        "matrixdropdown", "multipletext", "signaturepad", "html", "image"
      ]
    });

    // Configure image upload for SurveyJS Creator
    creatorRef.current.uploadFiles = (files, question, callback) => {
      console.log("SurveyJS uploadFiles called with:", { files, question, callback });

      if (!files || files.length === 0) {
        console.log("No files provided to uploadFiles");
        if (callback) callback("error", []);
        return;
      }

      const file = files[0];
      console.log("Processing file:", { name: file.name, type: file.type, size: file.size });

      // Check file size (max 5MB for base64 storage)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "File troppo grande",
          description: "Il file non deve superare 5MB. Per file più grandi, carica manualmente e usa l'URL.",
          variant: "destructive"
        });
        if (callback) callback("error", []);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      fetch(`${API_BASE_URL}/upload/image`, {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          if (data.success && data.data && data.data.content) {
            const uploadedFiles = [{ name: data.data.name, content: data.data.content }];

            if (callback) {
              callback("success", uploadedFiles);
              
              // Handle different question types
              setTimeout(() => {
                if (creatorRef.current) {
                  // Check if this is a survey logo upload
                  if (!question || creatorRef.current.selectedElement === creatorRef.current.survey) {
                    creatorRef.current.survey.logo = data.data.content;
                    const currentJSON = creatorRef.current.JSON;
                    currentJSON.logo = data.data.content;
                    creatorRef.current.JSON = currentJSON;
                  }
                  // Handle imagepicker questions
                  else if (question && question.getType && question.getType() === "imagepicker") {
                    const currentChoices = question.choices ? [...question.choices] : [];
                    const lastChoice = currentChoices[currentChoices.length - 1];
                    
                    if (lastChoice && (!lastChoice.imageLink || lastChoice.imageLink === "")) {
                      lastChoice.imageLink = data.data.content;
                      lastChoice.text = data.data.name;
                      if (!lastChoice.value) lastChoice.value = `choice_${Date.now()}`;
                    } else {
                      currentChoices.push({
                        value: `choice_${Date.now()}`,
                        imageLink: data.data.content,
                        text: data.data.name,
                      });
                    }
                    question.choices = currentChoices;
                  }
                  // Handle other questions with questionImage property
                  else if (question) {
                    if (typeof question.setPropertyValue === "function") {
                      question.setPropertyValue("questionImage", data.data.content);
                    } else {
                      question.questionImage = data.data.content;
                    }
                  }
                }
              }, 200);
            }
          } else {
            throw new Error(data.message || "Upload failed");
          }
        })
        .catch((error) => {
          console.error("Upload request failed:", error);
          if (callback) callback("error", []);
          toast({
            title: "Errore upload",
            description: error.message,
            variant: "destructive"
          });
        });
    };

    // Add custom image upload to question cards
    creatorRef.current.onDesignerSurveyCreated.add((_, options) => {
      const survey = options.survey;
      survey.onAfterRenderQuestion.add((sender, options) => {
        const question = options.question;
        const questionElement = options.htmlElement;
        if (!questionElement) return;
        
        setTimeout(() => {
          addImageUploadToQuestion(question, questionElement);
        }, 100);
      });
    });
  }

  // Function to add image upload UI to question cards
  const addImageUploadToQuestion = (question: any, questionElement: HTMLElement) => {
    if (questionElement.querySelector(".question-image-upload-section")) return;

    let currentImageUrl = "";
    if (typeof question.getPropertyValue === "function") {
      currentImageUrl = question.getPropertyValue("questionImage") || "";
    } else {
      currentImageUrl = question.questionImage || "";
    }

    const imageUploadSection = document.createElement("div");
    imageUploadSection.className = "question-image-upload-section";
    imageUploadSection.setAttribute("data-question-name", question.name);
    imageUploadSection.style.cssText = `
      margin: 8px 0 12px 0;
      padding: 12px;
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `;

    const createUploadHTML = (imageUrl: string) => {
      if (imageUrl) {
        return `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #495057;">
            <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Question Image
          </div>
          <div class="image-upload-content">
            <div class="current-image" style="margin-bottom: 10px;">
              <img src="${imageUrl}" alt="Question image" style="max-width: 100%; max-height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #dee2e6; display: block;">
              <div style="font-size: 11px; color: #6c757d; margin-top: 4px;">Current question image</div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="replace-image-btn" style="padding: 6px 12px; background-color: #007bff; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background-color 0.2s;">
                Replace Image
              </button>
              <button class="remove-image-btn" style="padding: 6px 12px; background-color: #dc3545; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background-color 0.2s;">
                Remove Image
              </button>
            </div>
          </div>
        `;
      } else {
        return `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #495057;">
            <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Question Image
          </div>
          <div class="image-upload-content">
            <div class="upload-area" style="border: 2px dashed #ced4da; border-radius: 4px; padding: 16px; text-align: center; background-color: #fff; transition: border-color 0.2s;">
              <div style="color: #6c757d; font-size: 12px; margin-bottom: 8px;">
                Add an image to display with this question
              </div>
              <button class="upload-image-btn" style="padding: 8px 16px; background-color: #28a745; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; transition: background-color 0.2s;">
                <svg style="width: 12px; height: 12px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Choose Image
              </button>
            </div>
          </div>
        `;
      }
    };

    imageUploadSection.innerHTML = createUploadHTML(currentImageUrl) + 
      '<input type="file" class="image-file-input" accept="image/*" style="display: none;">';

    const setupEventListeners = () => {
      const fileInput = imageUploadSection.querySelector(".image-file-input") as HTMLInputElement;
      const uploadBtn = imageUploadSection.querySelector(".upload-image-btn");
      const replaceBtn = imageUploadSection.querySelector(".replace-image-btn");
      const removeBtn = imageUploadSection.querySelector(".remove-image-btn");
      const uploadArea = imageUploadSection.querySelector(".upload-area");

      const handleFileUpload = async (file: File) => {
        if (!file) return;

        // Validate file
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          alert("File troppo grande. Massimo 5MB.");
          return;
        }

        const contentDiv = imageUploadSection.querySelector(".image-upload-content") as HTMLElement;
        contentDiv.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <div style="color: #6c757d; font-size: 12px; margin-bottom: 8px;">Uploading image...</div>
            <div style="width: 100%; background-color: #e9ecef; border-radius: 4px; overflow: hidden;">
              <div style="width: 0%; height: 4px; background-color: #28a745; transition: width 0.3s;" class="upload-progress"></div>
            </div>
          </div>
        `;

        const progressBar = contentDiv.querySelector(".upload-progress") as HTMLElement;
        if (progressBar) setTimeout(() => progressBar.style.width = "60%", 100);

        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch(`${API_BASE_URL}/upload/image`, {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (progressBar) progressBar.style.width = "100%";

          if (data.success && data.data) {
            const imageUrl = data.data.content;
            
            if (typeof question.setPropertyValue === "function") {
              question.setPropertyValue("questionImage", imageUrl);
            } else {
              question.questionImage = imageUrl;
            }

            setTimeout(() => {
              const specificUploadSection = questionElement.querySelector(`[data-question-name="${question.name}"]`);
              if (specificUploadSection) {
                specificUploadSection.innerHTML = createUploadHTML(imageUrl) + 
                  '<input type="file" class="image-file-input" accept="image/*" style="display: none;">';
                setupEventListeners();
              }
            }, 500);
          } else {
            throw new Error(data.message || "Upload failed");
          }
        } catch (error) {
          console.error("Upload error:", error);
          const contentDiv = imageUploadSection.querySelector(".image-upload-content") as HTMLElement;
          contentDiv.innerHTML = `
            <div style="text-align: center; color: #dc3545; font-size: 12px; padding: 12px; background-color: #f8d7da; border-radius: 4px;">
              Upload failed: ${error.message}
            </div>
          `;
          setTimeout(() => {
            const specificUploadSection = questionElement.querySelector(`[data-question-name="${question.name}"]`);
            if (specificUploadSection) {
              specificUploadSection.innerHTML = createUploadHTML("") + 
                '<input type="file" class="image-file-input" accept="image/*" style="display: none;">';
              setupEventListeners();
            }
          }, 3000);
        }
      };

      const handleRemoveImage = () => {
        if (typeof question.setPropertyValue === "function") {
          question.setPropertyValue("questionImage", "");
        } else {
          question.questionImage = "";
        }

        const specificUploadSection = questionElement.querySelector(`[data-question-name="${question.name}"]`);
        if (specificUploadSection) {
          specificUploadSection.innerHTML = createUploadHTML("") + 
            '<input type="file" class="image-file-input" accept="image/*" style="display: none;">';
          setupEventListeners();
        }
      };

      if (uploadBtn) uploadBtn.addEventListener("click", () => fileInput.click());
      if (replaceBtn) replaceBtn.addEventListener("click", () => fileInput.click());
      if (removeBtn) removeBtn.addEventListener("click", handleRemoveImage);

      if (uploadArea) {
        uploadArea.addEventListener("dragover", (e) => {
          e.preventDefault();
          (e.target as HTMLElement).style.borderColor = "#28a745";
          (e.target as HTMLElement).style.backgroundColor = "#f8fff9";
        });

        uploadArea.addEventListener("dragleave", (e) => {
          e.preventDefault();
          (e.target as HTMLElement).style.borderColor = "#ced4da";
          (e.target as HTMLElement).style.backgroundColor = "#fff";
        });

        uploadArea.addEventListener("drop", (e: DragEvent) => {
          e.preventDefault();
          const files = e.dataTransfer?.files;
          if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith("image/")) handleFileUpload(file);
          }
          (e.target as HTMLElement).style.borderColor = "#ced4da";
          (e.target as HTMLElement).style.backgroundColor = "#fff";
        });
      }

      fileInput.addEventListener("change", (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) handleFileUpload(file);
      });
    };

    setupEventListeners();

    // Insert into DOM
    let inserted = false;
    const titleElement = questionElement.querySelector(".svc-string-editor__content, .svc-question__title, .sv-question__title");
    if (titleElement && titleElement.parentNode) {
      titleElement.parentNode.insertBefore(imageUploadSection, titleElement.nextSibling);
      inserted = true;
    }

    if (!inserted) {
      const contentElement = questionElement.querySelector(".svc-question__content, .sv-question__content");
      if (contentElement) {
        contentElement.insertBefore(imageUploadSection, contentElement.firstChild);
        inserted = true;
      }
    }

    if (!inserted) {
      questionElement.insertBefore(imageUploadSection, questionElement.firstChild);
    }
  };

  // Load existing form if editing
  useEffect(() => {
    const loadForm = async () => {
      if (id && id !== "new" && id !== "0" && id.trim() !== "") {
        try {
          setLoading(true);
          console.log("Loading form with ID:", id);
          const response = await fetch(`${API_BASE_URL}/forms/${id}`);
          if (!response.ok) throw new Error("Form not found");
          
          const result = await response.json();
          console.log("Form data received:", result);

          if (result.success && result.data) {
            const form = result.data;
            console.log("Setting form data:", form.questions);
            
            creatorRef.current.JSON = form.questions || {};
            creatorRef.current.survey.title = form.title || "";
            creatorRef.current.survey.description = form.description || "";
            if (form.logo) creatorRef.current.survey.logo = form.logo;
          }
        } catch (error) {
          console.error("Error loading form:", error);
          toast({
            title: "Errore",
            description: "Impossibile caricare il form: " + error.message,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      } else {
        console.log("Skipping form load for ID:", id);
        setLoading(false);
      }
    };

    loadForm();
  }, [id, toast]);

  // SAVE handler - sets status to "draft"
  const handleSave = async () => {
    const creator = creatorRef.current;
    if (!creator) {
      toast({ title: "Errore", description: "Form creator non disponibile", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);

      const surveyJSON = creator.JSON;

      // Validate required fields
      if (!creator.survey.title || creator.survey.title.trim() === "") {
        toast({ title: "Errore", description: "Il titolo del form è obbligatorio", variant: "destructive" });
        return;
      }

      if (!surveyJSON || !surveyJSON.pages || surveyJSON.pages.length === 0) {
        toast({ title: "Errore", description: "Il form deve contenere almeno una pagina con domande", variant: "destructive" });
        return;
      }

      // Validate all questions have required fields
      for (const page of surveyJSON.pages) {
        if (page.elements) {
          for (const element of page.elements) {
            if (!element.name) {
              toast({ title: "Errore", description: "Tutte le domande devono avere un nome", variant: "destructive" });
              return;
            }
            if (!element.type) {
              toast({ title: "Errore", description: "Tutte le domande devono avere un tipo", variant: "destructive" });
              return;
            }
          }
        }
      }

      const logo = creator.survey.logo || surveyJSON.logo || null;

      const formData = {
        id: id && id !== "new" && id !== "0" ? id : undefined,
        title: creator.survey.title.trim(),
        description: creator.survey.description?.trim() || "",
        surveyJSON: surveyJSON,
        logo: logo,
        status: "draft",
        createdBy: "admin",
      };

      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Successo",
          description: id && id !== "new" && id !== "0" ? "Form aggiornato con successo" : "Form salvato come bozza con successo",
        });

        if (!id || id === "new" || id === "0") {
          setTimeout(() => navigate(`/admin/form-builder/edit/${result.id}`), 500);
        }
      } else {
        throw new Error(result.message || "Errore sconosciuto durante il salvataggio");
      }
    } catch (error) {
      console.error("Error saving form:", error);
      toast({
        title: "Errore",
        description: "Errore durante il salvataggio: " + (error.message || "Errore sconosciuto"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // PUBLISH handler - sets status to "published"
  const handlePublish = async () => {
    const creator = creatorRef.current;
    if (!creator) {
      toast({ title: "Errore", description: "Form creator non disponibile", variant: "destructive" });
      return;
    }

    try {
      setPublishing(true);

      const surveyJSON = creator.JSON;

      if (!creator.survey.title || creator.survey.title.trim() === "") {
        toast({ title: "Errore", description: "Il titolo del form è obbligatorio per la pubblicazione", variant: "destructive" });
        return;
      }

      if (!surveyJSON || !surveyJSON.pages || surveyJSON.pages.length === 0) {
        toast({ title: "Errore", description: "Il form deve contenere almeno una pagina con domande per essere pubblicato", variant: "destructive" });
        return;
      }

      const logo = creator.survey.logo || surveyJSON.logo || null;

      const formData = {
        id: id && id !== "new" && id !== "0" ? id : undefined,
        title: creator.survey.title.trim(),
        description: creator.survey.description?.trim() || "",
        surveyJSON: surveyJSON,
        logo: logo,
        status: "published",
        createdBy: "admin",
      };

      const response = await fetch(`${API_BASE_URL}/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Successo",
          description: id && id !== "new" && id !== "0" ? "Form aggiornato e pubblicato con successo" : "Form creato e pubblicato con successo",
        });
        setTimeout(() => navigate("/admin/form-builder"), 1000);
      } else {
        throw new Error(result.message || "Errore sconosciuto durante la pubblicazione");
      }
    } catch (error) {
      console.error("Error publishing form:", error);
      toast({
        title: "Errore",
        description: "Errore durante la pubblicazione: " + (error.message || "Errore sconosciuto"),
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  // Export schema documentation
  const handleExportSchema = () => {
    const schemaJSON = JSON.stringify(IMPORT_SCHEMA_DOCUMENTATION, null, 2);
    const blob = new Blob([schemaJSON], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "simplyai-import-schema.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Schema esportato",
      description: "Il file di documentazione dello schema è stato scaricato.",
    });
  };

  // Import success handler
  const handleImportSuccess = () => {
    navigate("/admin/form-builder");
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>Caricamento form...</div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh" }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {id && id !== "new" && !isNaN(Number(id)) ? "Modifica Form" : "Nuovo Form"} (SurveyJS)
        </h1>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => setImportDialogOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileUp size={16} />
            Import Questions
          </Button>
          <Button
            type="button"
            onClick={handleExportSchema}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Schema Doc
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salva Form"}
          </Button>
          <Button
            type="button"
            onClick={handlePublish}
            disabled={publishing || saving}
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            {publishing ? "Pubblicando..." : "Pubblica Form"}
          </Button>
        </div>
      </div>
      <div style={{ position: "relative", height: "calc(100vh - 120px)" }}>
        <SurveyCreatorComponent creator={creatorRef.current} />
      </div>

      <FormImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportSuccess={handleImportSuccess}
        questionRegistry={QUESTION_TYPE_REGISTRY}
        schemaDoc={IMPORT_SCHEMA_DOCUMENTATION}
      />
    </div>
  );
}