import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import {
  HelpCircle,
  BookOpen,
  Image as ImageIcon,
  Star,
  X,
} from "lucide-react";
import "survey-core/survey-core.css";
import { registerCustomProperties } from "@/lib/surveyjs-properties";

// Custom styles for guide button
const guideButtonStyles = `
  .guide-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #dbeafe;
    color: #2563eb;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-left: 8px;
    flex-shrink: 0;
  }
  
  .guide-button:hover {
    background-color: #bfdbfe;
    transform: scale(1.05);
  }
  
  .guide-button:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
  
  .guide-button svg {
    width: 16px;
    height: 16px;
  }
`;

export default function QuestionnaireSurveyJS() {
  const { id } = useParams();
  const [survey, setSurvey] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guidePopup, setGuidePopup] = useState<{
    show: boolean;
    title: string;
    content: string;
  }>({
    show: false,
    title: "",
    content: "",
  });

  // Close popup when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && guidePopup.show) {
        setGuidePopup({ show: false, title: "", content: "" });
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (guidePopup.show && e.target instanceof Element) {
        const popup = e.target.closest(".guide-popup");
        const overlay = e.target.closest(".guide-overlay");
        if (!popup && overlay) {
          setGuidePopup({ show: false, title: "", content: "" });
        }
      }
    };

    if (guidePopup.show) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [guidePopup.show]);

  // Inject custom styles once
  useEffect(() => {
    if (typeof document !== "undefined") {
      const existingStyle = document.getElementById("guide-button-styles");
      if (!existingStyle) {
        const styleElement = document.createElement("style");
        styleElement.id = "guide-button-styles";
        styleElement.textContent = guideButtonStyles;
        document.head.appendChild(styleElement);
      }
    }
  }, []);

  useEffect(() => {
    const loadForm = async () => {
      if (!id) {
        setError("Form ID is required");
        setLoading(false);
        return;
      }

      // Register custom properties first
      registerCustomProperties();

      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "https://simplyai.it/api";
        const response = await fetch(`${API_BASE_URL}/forms/${id}`);
        if (!response.ok) {
          throw new Error("Form not found");
        }

        const result = await response.json();
        console.log("API Response:", result);
        console.log(
          "Full API Response Structure:",
          JSON.stringify(result, null, 2)
        );

        if (!result.success || !result.data) {
          throw new Error("Invalid form data");
        }

        const formData = result.data;
        console.log("Form Data:", formData);
        console.log(
          "Questions Structure:",
          JSON.stringify(formData.questions, null, 2)
        );

        // Create SurveyJS survey from the stored JSON
        const surveyJson = formData.questions || {};
        const surveyInstance = new Model(surveyJson);

        // Store the original question data for accessing lesson information
        const originalQuestionsData =
          formData.questions?.pages?.[0]?.elements || [];
        const questionsMap = new Map();
        originalQuestionsData.forEach((q) => {
          questionsMap.set(q.name, q);
        });

        // ==================== FILE UPLOAD HANDLER ====================
        surveyInstance.onUploadFiles.add((sender, options) => {
          const file = options.files[0];
          
          if (!file) {
            options.callback([]);
            return;
          }

          // Check file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            alert("File size too large. Maximum size is 5MB.");
            options.callback([]);
            return;
          }

          const reader = new FileReader();
          
          reader.onload = (e) => {
            const base64Content = e.target?.result as string;
            
            // Return file data to SurveyJS
            options.callback([
              {
                name: file.name,
                type: file.type,
                content: base64Content,
                file: file
              }
            ]);
          };
          
          reader.onerror = () => {
            console.error("Error reading file");
            alert("Error reading file. Please try again.");
            options.callback([]);
          };
          
          reader.readAsDataURL(file);
        });

        // ==================== FORM SUBMIT HANDLER ====================
        surveyInstance.onComplete.add(async (sender, options) => {
          console.log("Survey completed! Raw data:", sender.data);
          
          try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://simplyai.it/api";
            
            const answers = sender.data;
            const processedAnswers: any = {};
            const filePaths: any[] = [];
            const mediaMetadata: any[] = [];

            // Process each answer to handle file uploads
            Object.keys(answers).forEach((questionName) => {
              const answer = answers[questionName];
              
              // Check if answer contains file data (SurveyJS file upload format)
              if (answer && Array.isArray(answer) && answer.length > 0 && answer[0].content) {
                // File upload detected
                const fileData = answer[0];
                
                // Store file metadata separately
                filePaths.push({
                  questionName: questionName,
                  fileName: fileData.name,
                  fileType: fileData.type,
                  fileSize: fileData.file?.size || 0
                });
                
                mediaMetadata.push({
                  questionName: questionName,
                  mimeType: fileData.type,
                  size: fileData.file?.size || 0,
                  uploadDate: new Date().toISOString()
                });
                
                // Store only file reference in answers, not full base64 (too large for JSON)
                processedAnswers[questionName] = {
                  fileName: fileData.name,
                  fileType: fileData.type,
                  hasFile: true
                };
              } else {
                // Normal answer (text, radio, checkbox, etc.)
                processedAnswers[questionName] = answer;
              }
            });

            console.log("Processed answers:", processedAnswers);
            console.log("File paths:", filePaths);
            console.log("Media metadata:", mediaMetadata);

            // API call to save response to database
            const response = await fetch(`${API_BASE_URL}/forms/response`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                formId: id,
                userId: null, // Ya auth se user ID lo
                answers: processedAnswers,
                filePaths: filePaths.length > 0 ? filePaths : null,
                mediaMetadata: mediaMetadata.length > 0 ? mediaMetadata : null,
                metadata: {
                  submittedAt: new Date().toISOString(),
                  userAgent: navigator.userAgent,
                  url: window.location.href
                }
              }),
            });

            const result = await response.json();
            console.log("Save response result:", result);

            if (result.success) {
              // Success message
              alert("✅ Form submitted successfully! Your response has been saved.");
              
              // Optional: Redirect to thank you page
              // window.location.href = '/thank-you';
            } else {
              throw new Error(result.message || "Failed to save response");
            }

          } catch (error) {
            console.error("❌ Error saving response:", error);
            alert("❌ Error saving form: " + (error instanceof Error ? error.message : "Unknown error"));
          }
        });

        // Custom rendering for questions with custom properties
        surveyInstance.onAfterRenderQuestion.add((sender, options) => {
          const question = options.question;
          const questionElement = options.htmlElement;

          if (!questionElement) return;

          // Get lesson data from the original question data
          const originalQuestionData = questionsMap.get(question.name);
          const lessonText = originalQuestionData?.lesson || null;
          const guideText = originalQuestionData?.guide || null;

          // Try multiple ways to get the question image
          let questionImageUrl = null;

          // Method 1: From original question data
          if (originalQuestionData?.questionImage) {
            questionImageUrl = originalQuestionData.questionImage;
            console.log(
              "Found questionImage in originalQuestionData:",
              questionImageUrl
            );
          }

          // Method 2: From SurveyJS question object direct property
          if (!questionImageUrl && question.questionImage) {
            questionImageUrl = question.questionImage;
            console.log(
              "Found questionImage in question object:",
              questionImageUrl
            );
          }

          // Method 3: Try getPropertyValue method
          if (
            !questionImageUrl &&
            typeof question.getPropertyValue === "function"
          ) {
            questionImageUrl = question.getPropertyValue("questionImage");
            console.log(
              "Found questionImage via getPropertyValue:",
              questionImageUrl
            );
          }

          // Method 4: Try accessing via question JSON
          if (!questionImageUrl && question.toJSON) {
            const questionJson = question.toJSON();
            questionImageUrl = questionJson.questionImage;
            console.log(
              "Found questionImage in question JSON:",
              questionImageUrl
            );
          }

          // Method 5: Check for imageLink property (backward compatibility)
          if (!questionImageUrl && originalQuestionData?.imageLink) {
            questionImageUrl = originalQuestionData.imageLink;
            console.log(
              "Found imageLink in originalQuestionData:",
              questionImageUrl
            );
          }

          console.log("Question Name:", question.name);
          console.log("Original Question Data:", originalQuestionData);
          console.log("Final Question Image URL:", questionImageUrl);
          console.log("Question object keys:", Object.keys(question));
          console.log("Question properties:", {
            questionImage: question.questionImage,
            imageLink: question.imageLink,
            image: question.image,
          });
          const customPropsContainer = document.createElement("div");
          customPropsContainer.className =
            "custom-props-container mt-4 p-4 bg-gray-50 rounded-lg";

          let hasCustomProps = false;

          // Add guide button next to question title if guide is present
          if (guideText) {
            // Find the question title element and add the guide button
            const titleElement = questionElement.querySelector(
              ".sv-question__title"
            );
            if (titleElement) {
              // Create guide button
              const guideButton = document.createElement("button");
              guideButton.className = "guide-button";
              guideButton.setAttribute(
                "aria-label",
                `Show guide for ${
                  question.title || question.name || "question"
                }`
              );
              guideButton.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              `;

              // Add click event to show guide popup
              guideButton.addEventListener("click", () => {
                setGuidePopup({
                  show: true,
                  title: question.title || question.name || "Question",
                  content: guideText,
                });
              });

              // Insert the button after the title
              titleElement.appendChild(guideButton);
            }
          }

          // Add lesson if present (using test data for demonstration)
          if (lessonText) {
            hasCustomProps = true;
            const lessonDiv = document.createElement("div");
            lessonDiv.className = "lesson-container mb-3";
            lessonDiv.innerHTML = `
              <div class="flex items-center gap-2 text-yellow-600 mb-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                <span class="font-medium text-sm">Lesson</span>
              </div>
              <p class="text-sm text-gray-700">${lessonText}</p>
            `;
            customPropsContainer.appendChild(lessonDiv);
          }

          // Add question image if present
          if (questionImageUrl) {
            hasCustomProps = true;
            const imageDiv = document.createElement("div");
            imageDiv.className = "question-image-container mb-3";
            imageDiv.innerHTML = `
              <div class="flex items-center gap-2 text-blue-600 mb-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span class="font-medium text-sm">Question Image</span>
              </div>
              <img src="${questionImageUrl}" alt="Question Image" class="max-w-full h-auto rounded-lg shadow-sm border border-gray-200" style="max-height: 400px;" />
            `;
            customPropsContainer.appendChild(imageDiv);
          }

          // Add image if present
          if (question.image) {
            hasCustomProps = true;
            const imageDiv = document.createElement("div");
            imageDiv.className = "question-image-container mb-3";
            imageDiv.innerHTML = `
              <div class="flex items-center gap-2 text-green-600 mb-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span class="font-medium text-sm">Question Image</span>
              </div>
              <img src="${question.image}" alt="Question" class="max-w-full h-auto rounded-lg shadow-sm" />
            `;
            customPropsContainer.appendChild(imageDiv);
          }

          // Add score information for choice questions
          if (question.choices && question.choices.length > 0) {
            const hasScores = question.choices.some(
              (choice) =>
                choice.score !== undefined &&
                choice.score !== null &&
                choice.score > 0
            );
            const showScores = question.showScores !== false; // Default to true unless explicitly set to false

            if (hasScores && showScores) {
              hasCustomProps = true;
              const scoresDiv = document.createElement("div");
              scoresDiv.className = "scores-container mb-3";

              // Calculate total possible score
              const totalScore = question.choices.reduce((sum, choice) => {
                return sum + (choice.score || 0);
              }, 0);

              scoresDiv.innerHTML = `
                <div class="flex items-center gap-2 text-purple-600 mb-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span class="font-medium text-sm">Answer Scores (Total: ${totalScore} points)</span>
                </div>
                <div class="text-xs text-gray-600 space-y-1">
                  ${question.choices
                    .map((choice) =>
                      choice.score !== undefined &&
                      choice.score !== null &&
                      choice.score > 0
                        ? `<div class="flex justify-between">
                          <span>${choice.text}</span>
                          <span class="font-medium text-purple-600">${choice.score} points</span>
                        </div>`
                        : ""
                    )
                    .filter((text) => text)
                    .join("")}
                </div>
              `;
              customPropsContainer.appendChild(scoresDiv);
            }
          }

          // Only add the container if there are custom properties
          if (hasCustomProps) {
            questionElement.appendChild(customPropsContainer);
          }

          // Add hover functionality for lesson display in sidebar
          if (lessonText) {
            const handleMouseEnter = (e: any) => {
              e.stopPropagation(); // Prevent event bubbling
              const sidebar = document.getElementById("lesson-sidebar");
              if (sidebar) {
                sidebar.innerHTML = `
                  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 class="font-medium text-yellow-800 mb-2">${
                      question.title || question.name || "Question"
                    }</h4>
                    <p class="text-yellow-700">${lessonText}</p>
                  </div>
                `;
              }
            };

            const handleMouseLeave = (e: any) => {
              e.stopPropagation(); // Prevent event bubbling
              // Use a small delay to prevent rapid flickering and potential conflicts
              setTimeout(() => {
                const sidebar = document.getElementById("lesson-sidebar");
                if (sidebar) {
                  sidebar.innerHTML =
                    '<p class="text-gray-500 italic">Hover over questions to see lesson information here.</p>';
                }
              }, 100);
            };

            questionElement.addEventListener("mouseenter", handleMouseEnter, {
              passive: true,
            });
            questionElement.addEventListener("mouseleave", handleMouseLeave, {
              passive: true,
            });
          }
        });

        setSurvey(surveyInstance);
      } catch (err: any) {
        console.error("Error loading form:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading form...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-lg">Error: {error}</div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">No survey data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Survey Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <Survey model={survey} />
            </div>
          </div>

          {/* Sidebar for Lesson Display */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-yellow-600" />
                Lesson Information
              </h3>
              <div id="lesson-sidebar" className="text-sm text-gray-600">
                <p className="text-gray-500 italic">
                  Hover over questions to see lesson information here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Popup */}
      {guidePopup.show && (
        <div
          className="guide-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-title"
        >
          <div className="guide-popup bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3
                id="guide-title"
                className="text-lg font-semibold text-gray-900 flex items-center gap-2"
              >
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Guide: {guidePopup.title}
              </h3>
              <button
                onClick={() =>
                  setGuidePopup({ show: false, title: "", content: "" })
                }
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed">
                {guidePopup.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}