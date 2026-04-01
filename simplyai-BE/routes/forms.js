import express from "express";
import { pool } from "../db.js";
import { authenticateToken } from "./auth.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// POST create/update form
router.post("/", async (req, res) => {
  let { id, title, description, surveyJSON, logo, status, createdBy } = req.body;

  // Normalize the id value
  if (!id || id === "" || id === "new" || id === "0") {
    id = null;
  }

  console.log("Received form data:", { id, title, description, logo, status, createdBy });

  try {
    // Validate required fields
    if (!title || !surveyJSON) {
      console.log("Validation failed: missing title or surveyJSON");
      return res.status(400).json({
        success: false,
        message: "Title and survey JSON are required",
      });
    }

    // Validate surveyJSON structure
    if (!surveyJSON.pages || !Array.isArray(surveyJSON.pages)) {
      return res.status(400).json({
        success: false,
        message: "Survey JSON must contain pages array",
      });
    }

    // Process and validate all questions
    const validatedPages = surveyJSON.pages.map((page, pageIndex) => {
      if (!page.elements || !Array.isArray(page.elements)) {
        return page;
      }

      const validatedElements = page.elements.map((element, elementIndex) => {
        // Ensure element has required fields
        if (!element.name) {
          element.name = `question_${pageIndex}_${elementIndex}_${Date.now()}`;
        }
        
        // Process question images - ensure they're stored properly
        if (element.questionImage && element.questionImage.startsWith('data:')) {
          // Base64 image - check size
          const base64Size = element.questionImage.length * 0.75; // Approximate bytes
          if (base64Size > 5 * 1024 * 1024) { // 5MB limit
            console.warn(`Question ${element.name} has large base64 image, may cause performance issues`);
          }
        }

        // Process choices with images
        if (element.choices && Array.isArray(element.choices)) {
          element.choices = element.choices.map((choice, choiceIndex) => {
            if (!choice.value) {
              choice.value = `choice_${choiceIndex}_${Date.now()}`;
            }
            // Ensure score is numeric
            if (choice.score !== undefined) {
              choice.score = Number(choice.score) || 0;
            }
            return choice;
          });
        }

        // Ensure custom properties are preserved
        const customProps = ['questionImage', 'guide', 'lesson', 'showScores', 'score'];
        customProps.forEach(prop => {
          if (element[prop] !== undefined) {
            console.log(`Preserving custom property ${prop} for question ${element.name}`);
          }
        });

        return element;
      });

      return { ...page, elements: validatedElements };
    });

    const validatedSurveyJSON = { ...surveyJSON, pages: validatedPages };

    if (id) {
      // Update existing form
      console.log("Updating existing form with ID:", id);
      const [result] = await pool.query(
        `UPDATE questionnaire_config 
         SET title = ?, 
             description = ?, 
             questions = ?, 
             logo = ?, 
             status = ?, 
             updated_at = NOW()
         WHERE id = ?`,
        [
          title,
          description || null,
          JSON.stringify(validatedSurveyJSON),
          logo || null,
          status || "draft",
          id,
        ]
      );

      console.log("Update result:", result);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Form not found for update",
          id,
        });
      }

      res.json({
        success: true,
        message: "Form updated successfully",
        id: id,
      });
    } else {
      // Create new form with UUID
      const newId = uuidv4();
      console.log("Creating new form with UUID:", newId);

      const [result] = await pool.query(
        `INSERT INTO questionnaire_config 
         (id, title, description, questions, logo, status, created_by, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          newId,
          title,
          description || null,
          JSON.stringify(validatedSurveyJSON),
          logo || null,
          status || "draft",
          createdBy || null,
        ]
      );

      console.log("Form created successfully with ID:", newId);

      res.status(201).json({
        success: true,
        message: "Form created successfully",
        id: newId,
      });
    }
  } catch (err) {
    console.error("Error saving form:", err);
    res.status(500).json({
      success: false,
      message: "Error saving form: " + err.message,
    });
  }
});

// ✅ NEW ENDPOINT - Save form page layout
router.post("/:id/layout", async (req, res) => {
  const { id } = req.params;
  const { pageContent, footerContent, headerImageUrl, instructions, title, description } = req.body;

  try {
    // Check if form exists
    const [formRows] = await pool.query(
      "SELECT id FROM questionnaire_config WHERE id = ?",
      [id]
    );

    if (formRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Check if layout already exists
    const [existingRows] = await pool.query(
      "SELECT id FROM questionnaire_page_layouts WHERE questionnaire_id = ?",
      [id]
    );

    if (existingRows.length > 0) {
      // Update existing layout
      await pool.query(
        `UPDATE questionnaire_page_layouts 
         SET title = ?,
             description = ?,
             instructions = ?,
             header_image_url = ?,
             page_content = ?,
             footer_content = ?,
             updated_at = NOW()
         WHERE questionnaire_id = ?`,
        [
          title || null,
          description || null,
          instructions || null,
          headerImageUrl || null,
          pageContent || null,
          footerContent || null,
          id,
        ]
      );
    } else {
      // Create new layout
      const layoutId = uuidv4();
      await pool.query(
        `INSERT INTO questionnaire_page_layouts 
         (id, questionnaire_id, title, description, instructions, header_image_url, page_content, footer_content, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          layoutId,
          id,
          title || null,
          description || null,
          instructions || null,
          headerImageUrl || null,
          pageContent || null,
          footerContent || null,
        ]
      );
    }

    res.json({
      success: true,
      message: "Page layout saved successfully",
    });

  } catch (err) {
    console.error("Error saving page layout:", err);
    res.status(500).json({
      success: false,
      message: "Error saving page layout: " + err.message,
    });
  }
});

// ✅ NEW ENDPOINT - Get form page layout
router.get("/:id/layout", async (req, res) => {
  const { id } = req.params;

  try {
    // Check if form exists
    const [formRows] = await pool.query(
      "SELECT id, title, description FROM questionnaire_config WHERE id = ?",
      [id]
    );

    if (formRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    const form = formRows[0];

    // Get layout
    const [layoutRows] = await pool.query(
      "SELECT * FROM questionnaire_page_layouts WHERE questionnaire_id = ?",
      [id]
    );

    if (layoutRows.length === 0) {
      // Return default layout
      return res.json({
        success: true,
        data: {
          title: form.title || '',
          description: form.description || '',
          instructions: '',
          headerImageUrl: '',
          pageContent: '<h1>Questionario</h1><p>Benvenuto al questionario. Di seguito troverai una serie di domande a cui rispondere.</p>',
          footerContent: '<p class="text-center text-sm text-gray-500 mt-8">Grazie per aver compilato il questionario. Le tue risposte sono importanti per noi.</p>'
        },
      });
    }

    const layout = layoutRows[0];

    res.json({
      success: true,
      data: {
        title: layout.title || form.title || '',
        description: layout.description || form.description || '',
        instructions: layout.instructions || '',
        headerImageUrl: layout.header_image_url || '',
        pageContent: layout.page_content || '',
        footerContent: layout.footer_content || '',
      },
    });

  } catch (err) {
    console.error("Error fetching page layout:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching page layout: " + err.message,
    });
  }
});

// POST save user questionnaire response - CORRECT VERSION
router.post("/response", async (req, res) => {
  const { formId, userId, answers, metadata, files } = req.body;

  try {
    // Validate required fields
    if (!formId || !answers) {
      return res.status(400).json({
        success: false,
        message: "formId and answers are required",
      });
    }

    const responseId = uuidv4();
    
    // Extract file information from answers
    const filePaths = [];
    const mediaMetadata = [];
    
    // Process answers to extract file data
    const processedAnswers = {};
    Object.keys(answers).forEach(questionName => {
      const answer = answers[questionName];
      
      // If answer contains file data
      if (answer && typeof answer === 'object' && answer.fileData) {
        // Store file info separately
        filePaths.push({
          questionName: questionName,
          fileName: answer.fileName,
          fileType: answer.fileType,
          fileSize: answer.fileSize
        });
        
        mediaMetadata.push({
          questionName: questionName,
          mimeType: answer.fileType,
          size: answer.fileSize,
          uploadDate: new Date().toISOString()
        });
        
        // Store only file reference in answers, not base64 data
        processedAnswers[questionName] = {
          fileName: answer.fileName,
          fileType: answer.fileType,
          hasFile: true
        };
      } else {
        processedAnswers[questionName] = answer;
      }
    });

    // Save response to database - CORRECT COLUMN NAMES
    const [result] = await pool.query(
      `INSERT INTO questionnaire_responses 
       (id, questionnaire_id, user_id, answers, file_paths, media_metadata, status, completed_at, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, 'completed', NOW(), NOW(), NOW())`,
      [
        responseId,
        formId,  // ✅ questionnaire_id column
        userId || null,
        JSON.stringify(processedAnswers),
        filePaths.length > 0 ? JSON.stringify(filePaths) : null,
        mediaMetadata.length > 0 ? JSON.stringify(mediaMetadata) : null,
      ]
    );

    // Generate prompt for ChatGPT
    const promptData = await generateChatGPTPrompt(formId, processedAnswers);

    res.status(201).json({
      success: true,
      message: "Response saved successfully",
      id: responseId,
      promptData: promptData,
    });

  } catch (err) {
    console.error("Error saving response:", err);
    res.status(500).json({
      success: false,
      message: "Error saving response: " + err.message,
    });
  }
});

// Helper function to generate ChatGPT prompt from responses
async function generateChatGPTPrompt(formId, answers) {
  try {
    // Get form details
    const [forms] = await pool.query(
      "SELECT title, description, questions FROM questionnaire_config WHERE id = ?",
      [formId]
    );

    if (forms.length === 0) return null;

    const form = forms[0];
    const questions = typeof form.questions === 'object' ? form.questions : JSON.parse(form.questions);

    // Build prompt
    let prompt = `Questionnaire: ${form.title}\n\n`;
    prompt += `Description: ${form.description || 'N/A'}\n\n`;
    prompt += "User Responses:\n\n";

    answers.forEach(answer => {
      const question = findQuestionByName(questions, answer.questionName);
      if (question) {
        prompt += `Q: ${question.title}\n`;
        prompt += `A: ${formatAnswer(answer, question)}\n\n`;
      }
    });

    return {
      prompt: prompt,
      formTitle: form.title,
      responseCount: answers.length,
    };
  } catch (err) {
    console.error("Error generating prompt:", err);
    return null;
  }
}

// Helper to find question by name in survey JSON
function findQuestionByName(surveyJSON, questionName) {
  if (!surveyJSON.pages) return null;
  
  for (const page of surveyJSON.pages) {
    if (page.elements) {
      for (const element of page.elements) {
        if (element.name === questionName) {
          return element;
        }
      }
    }
  }
  return null;
}

// Helper to format answer based on question type
function formatAnswer(answer, question) {
  if (!answer.value) return "No answer";
  
  switch (question.type) {
    case 'checkbox':
      if (Array.isArray(answer.value)) {
        return answer.value.map(v => {
          const choice = question.choices?.find(c => c.value === v);
          return choice ? (choice.text || choice.value) : v;
        }).join(', ');
      }
      return answer.value;
    case 'radiogroup':
    case 'dropdown':
      const choice = question.choices?.find(c => c.value === answer.value);
      return choice ? (choice.text || choice.value) : answer.value;
    case 'file':
      if (Array.isArray(answer.value)) {
        return `[${answer.value.length} file(s) uploaded]`;
      }
      return "[File uploaded]";
    default:
      return answer.value.toString();
  }
}

// GET all forms with optional status filter
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    let query = "SELECT * FROM questionnaire_config";
    let params = [];

    if (status) {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC";

    console.log("Executing query:", query, "with params:", params);
    const [rows] = await pool.query(query, params);
    console.log("Query result rows:", rows.length);

    // Parse the JSON questions for each form
    const forms = rows.map((row) => {
      try {
        let questions = null;
        if (row.questions) {
          if (typeof row.questions === "object") {
            questions = row.questions;
          } else {
            questions = JSON.parse(row.questions);
          }
        }

        return {
          ...row,
          questions: questions,
        };
      } catch (parseError) {
        console.error("Error parsing questions for form", row.id, ":", parseError);
        return {
          ...row,
          questions: null,
        };
      }
    });

    res.json({
      success: true,
      data: forms,
    });
  } catch (err) {
    console.error("Error fetching forms:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching forms: " + err.message,
    });
  }
});

// Get single form by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM questionnaire_config WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    const form = rows[0];

    // Handle questions parsing
    try {
      if (form.questions) {
        if (typeof form.questions === "object") {
          form.questions = form.questions;
        } else {
          form.questions = JSON.parse(form.questions);
        }
      } else {
        form.questions = null;
      }
    } catch (parseError) {
      console.error("Error parsing questions for form", form.id, ":", parseError);
      form.questions = null;
    }

    res.json({
      success: true,
      data: form,
    });
  } catch (err) {
    console.error("Error fetching form:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching form: " + err.message,
    });
  }
});

// Get user questionnaire responses
router.get("/response/:responseId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM questionnaire_responses WHERE id = ?",
      [req.params.responseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Response not found",
      });
    }

    const response = rows[0];
    
    // Parse JSON fields
    try {
      response.answers = typeof response.answers === 'object' ? response.answers : JSON.parse(response.answers);
      response.metadata = response.metadata ? (typeof response.metadata === 'object' ? response.metadata : JSON.parse(response.metadata)) : null;
    } catch (e) {
      console.error("Error parsing response JSON:", e);
    }

    res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    console.error("Error fetching response:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching response: " + err.message,
    });
  }
});

// Delete form by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  console.log("Attempting to delete form with ID:", id);

  try {
    const [checkRows] = await pool.query(
      "SELECT id, title FROM questionnaire_config WHERE id = ?",
      [id]
    );

    if (checkRows.length === 0) {
      console.log("Form not found for deletion:", id);
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    const formTitle = checkRows[0].title;
    console.log("Found form to delete:", formTitle);

    const [result] = await pool.query(
      "DELETE FROM questionnaire_config WHERE id = ?",
      [id]
    );

    console.log("Delete result:", result);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Form not found or already deleted",
      });
    }

    console.log("✅ Form deleted successfully:", formTitle);

    res.json({
      success: true,
      message: "Form deleted successfully",
      data: { id, title: formTitle },
    });
  } catch (err) {
    console.error("❌ Error deleting form:", err);
    res.status(500).json({
      success: false,
      message: "Server error while deleting form",
      error: err.message,
    });
  }
});

export default router;