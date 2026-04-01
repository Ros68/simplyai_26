import express from "express";
const router = express.Router();
import { pool } from "../db.js";
import axios from "axios";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";

// 🌟 FIX: Import Email Service
import { sendReportAvailableEmail } from "../services/emailService.js";

// For ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads/pdfs");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to generate PDF with better formatting
const generatePDF = async (data, reportId) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("📄 Starting PDF generation for report:", reportId);

      const { title, sections } = data;

      // Validate we have sections
      if (!sections || !Array.isArray(sections) || sections.length === 0) {
        throw new Error("No sections provided for PDF generation");
      }

      console.log(`📄 Generating PDF with ${sections.length} sections`);

      // Create PDF document with better settings
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        bufferPages: true,
        autoFirstPage: true,
      });

      // Setup file path
      const fileName = `report_${reportId}_${Date.now()}.pdf`;
      const uploadsDir = path.join(process.cwd(), "uploads", "pdfs");
      const filePath = path.join(uploadsDir, fileName);

      // Ensure directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log("📁 Created uploads directory:", uploadsDir);
      }

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // ✅ PDF HEADER with better styling
      doc
        .fontSize(26)
        .font("Helvetica-Bold")
        .fillColor("#1a1a1a")
        .text(title, {
          align: "center",
        })
        .moveDown(0.5);

      // Decorative line
      doc
        .strokeColor("#3498db")
        .lineWidth(2)
        .moveTo(100, doc.y)
        .lineTo(doc.page.width - 100, doc.y)
        .stroke()
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text(
          `Generated on: ${new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`,
          {
            align: "center",
          }
        )
        .moveDown(3);

      // ✅ RENDER EACH SECTION with improved formatting
      sections.forEach((section, index) => {
        console.log(
          `📄 Rendering section ${index + 1}/${sections.length}: ${
            section.title
          } (${section.section_type})`
        );

        if (doc.y > doc.page.height - 10 && index > 0) {
          doc.addPage();
        }

        const sectionNumber = index + 1;
        const currentY = doc.y;

        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .fillColor("#2c3e50")
          .text(
            `${sectionNumber}. ${section.title || `Section ${sectionNumber}`}`,
            50,
            currentY,
            {
              continued: false,
              align: "left",
            }
          )
          .moveDown(0.8);

        doc.fillColor("#000000");

        try {
          switch (section.section_type) {
            case "text":
              renderTextSection(doc, section);
              break;
            case "chart":
            case "graph":
              renderChartSection(doc, section);
              break;
            case "table":
              renderTableSection(doc, section);
              break;
            default:
              doc
                .fontSize(10)
                .font("Helvetica-Oblique")
                .fillColor("#999999")
                .text(`[Section type "${section.section_type}" not recognized]`)
                .fillColor("#000000")
                .moveDown();
          }
        } catch (renderError) {
          console.error(
            `❌ Error rendering section ${index + 1}:`,
            renderError
          );
          doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor("#e74c3c")
            .text(`[Error rendering this section: ${renderError.message}]`)
            .fillColor("#000000");
        }

        doc.moveDown(2);
      });

      const range = doc.bufferedPageRange();
      const pageCount = range.count;

      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        const footerY = doc.page.height - 60;
        doc
          .strokeColor("#cccccc")
          .lineWidth(0.5)
          .moveTo(50, footerY)
          .lineTo(doc.page.width - 50, footerY)
          .stroke();

        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor("#888888")
          .text(`Page ${i + 1} of ${pageCount}`, 50, footerY + 10, {
            align: "center",
            width: doc.page.width - 100,
          });
      }

      doc.end();

      writeStream.on("finish", () => {
        const pdfUrl = `/uploads/pdfs/${fileName}`;
        resolve({ pdfUrl, filePath });
      });

      writeStream.on("error", (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

function renderTextSection(doc, section) {
  const content = section.content || "No content available";
  const paragraphs = content.split("\n").filter((p) => p.trim().length > 0);

  paragraphs.forEach((paragraph, idx) => {
    if (doc.y > doc.page.height - 100) doc.addPage();
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#333333")
      .text(paragraph.trim(), {
        align: "justify",
        lineGap: 5,
        paragraphGap: 8,
      });
    if (idx < paragraphs.length - 1) doc.moveDown(0.5);
  });
}

function renderChartSection(doc, section) {
  const chartType = (section.type || "bar").toLowerCase();
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#3498db")
    .text(`📊 Chart Type: ${chartType.toUpperCase()}`, { continued: false })
    .fillColor("#000000")
    .moveDown(0.8);

  if (section.data && section.data.labels && section.data.values) {
    const labels = section.data.labels;
    const values = section.data.values;
    doc.fontSize(10).font("Helvetica-Bold").text("Data Points:").font("Helvetica").moveDown(0.5);

    const maxValue = Math.max(...values);
    const barWidth = 300;

    labels.forEach((label, idx) => {
      const value = values[idx] || 0;
      const barLength = maxValue > 0 ? (value / maxValue) * barWidth : 0;

      if (doc.y > doc.page.height - 100) doc.addPage();
      doc.fontSize(10).font("Helvetica").text(`${label}:`, 70, doc.y, { width: 150, continued: false });

      const barY = doc.y - 12;
      doc.rect(230, barY, barLength, 15).fillAndStroke("#3498db", "#2980b9");
      doc.fontSize(10).fillColor("#000000").text(value.toLocaleString(), 230 + barLength + 10, barY + 2, { width: 100 });
      doc.moveDown(0.3);
    });
  } else {
    doc.fontSize(10).fillColor("#e74c3c").text("⚠ No chart data available").fillColor("#000000");
  }
}

function renderTableSection(doc, section) {
  if (!section.headers || !section.rows || section.rows.length === 0) {
    doc.fontSize(10).font("Helvetica").fillColor("#e74c3c").text("⚠ No table data available").fillColor("#000000");
    return;
  }

  const headers = section.headers;
  const rows = section.rows;
  const tableWidth = doc.page.width - 100;
  const colWidth = tableWidth / headers.length;
  const startX = 50;
  const rowHeight = 30;
  const headerHeight = 35;
  let currentY = doc.y;

  const estimatedTableHeight = headerHeight + rows.length * rowHeight;
  if (currentY + estimatedTableHeight > doc.page.height - 100) {
    doc.addPage();
    currentY = doc.y; 
  }

  doc.fontSize(10).font("Helvetica-Bold");

  headers.forEach((header, idx) => {
    const x = startX + idx * colWidth;
    doc.rect(x, currentY, colWidth, headerHeight).fillAndStroke("#34495e", "#2c3e50");
    doc.fillColor("#ffffff").text(String(header).toUpperCase(), x + 8, currentY + (headerHeight - 10) / 2, {
      width: colWidth - 16, align: "center", ellipsis: true,
    });
  });

  currentY += headerHeight;
  doc.fillColor("#000000");
  doc.font("Helvetica").fontSize(9);

  rows.forEach((row, rowIdx) => {
    if (currentY > doc.page.height - 100) {
      doc.addPage();
      currentY = doc.y;

      doc.fontSize(10).font("Helvetica-Bold");
      headers.forEach((header, idx) => {
        const x = startX + idx * colWidth;
        doc.rect(x, currentY, colWidth, headerHeight).fillAndStroke("#34495e", "#2c3e50").fillColor("#ffffff").text(String(header).toUpperCase(), x + 8, currentY + (headerHeight - 10) / 2, { width: colWidth - 16, align: "center", ellipsis: true });
      });
      currentY += headerHeight;
      doc.fillColor("#000000").font("Helvetica").fontSize(9);
    }

    const fillColor = rowIdx % 2 === 0 ? "#ffffff" : "#f8f9fa";
    row.forEach((cell, cellIdx) => {
      const x = startX + cellIdx * colWidth;
      doc.rect(x, currentY, colWidth, rowHeight).fillAndStroke(fillColor, "#dee2e6");
      doc.fillColor("#000000").text(String(cell || "-"), x + 8, currentY + (rowHeight - 10) / 2, { width: colWidth - 16, align: "left", ellipsis: true });
    });
    currentY += rowHeight;
  });
  doc.y = currentY + 10;
}

const getQuestionsAndAnswers = async (referenceData, userId) => {
  try {
    if (!referenceData) return [];
    const parsedData = typeof referenceData === "string" ? JSON.parse(referenceData) : referenceData;
    if (!parsedData || Object.keys(parsedData).length === 0) return [];

    const questionnaireIds = new Set();
    const questionnaireShortcodes = {};

    Object.values(parsedData).forEach((questionnaires) => {
      if (Array.isArray(questionnaires)) {
        questionnaires.forEach((ref) => {
          if (ref.questionnaireId) {
            questionnaireIds.add(ref.questionnaireId);
            if (!questionnaireShortcodes[ref.questionnaireId]) questionnaireShortcodes[ref.questionnaireId] = [];
            questionnaireShortcodes[ref.questionnaireId].push({ shortcode: ref.shortcode, sectionType: ref.sectionType });
          }
        });
      }
    });

    if (questionnaireIds.size === 0) return [];

    const questionnaireIdsArray = Array.from(questionnaireIds);
    const placeholders = questionnaireIdsArray.map(() => "?").join(",");

    const [results] = await pool.query(
      `SELECT qc.id as questionnaire_id, qc.title as questionnaire_title, qc.questions, qr.answers as answers
       FROM questionnaire_config qc
       LEFT JOIN questionnaire_responses qr ON qc.id = qr.questionnaire_id AND qr.user_id = ?
       WHERE qc.id IN (${placeholders}) ORDER BY qc.id`,
      [userId, ...questionnaireIdsArray]
    );

    return results.map((row) => ({
      questionnaire_id: row.questionnaire_id,
      questionnaire_title: row.questionnaire_title,
      questions: typeof row.questions === "string" ? JSON.parse(row.questions) : row.questions,
      answers: row.answers ? (typeof row.answers === "string" ? JSON.parse(row.answers) : row.answers) : null,
      shortcodes: questionnaireShortcodes[row.questionnaire_id] || [],
    }));
  } catch (error) {
    console.error("Error in getQuestionsAndAnswers:", error);
    return [];
  }
};

router.post("/generate", async (req, res) => {
  try {
    const { questionnaireId, planId, responses, userId, title } = req.body;

    if (!questionnaireId || !planId) return res.status(400).json({ success: false, message: "Questionnaire ID and Plan ID are required" });
    if (!userId) return res.status(400).json({ success: false, message: "User ID is required" });

    const [responseRows] = await pool.query(
      `SELECT id FROM questionnaire_responses WHERE questionnaire_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [questionnaireId, userId]
    );

    let questionnaireResponseId = responseRows.length > 0 ? responseRows[0].id : null;

    const [promptRows] = await pool.query(
      `SELECT id, system_prompt, content AS general_prompt, sections_data, report_template AS template_structure, reference_questionnaires
       FROM prompt_templates WHERE questionnaire_id = ? AND plan_id = ?`,
      [questionnaireId, planId]
    );

    if (promptRows.length === 0) return res.status(404).json({ success: false, message: "No prompt data found" });

    const { id: templateId, system_prompt, general_prompt, sections_data, reference_questionnaires } = promptRows[0];

    let parsedSectionsData = {};
    try { parsedSectionsData = typeof sections_data === "string" ? JSON.parse(sections_data) : sections_data; } catch (e) {}

    const questionsAndAnswersData = await getQuestionsAndAnswers(reference_questionnaires, userId);
    let sectionRequirements = "";

    if (parsedSectionsData.text && Array.isArray(parsedSectionsData.text)) {
      sectionRequirements += "\nTEXT SECTIONS:\n";
      parsedSectionsData.text.forEach((s) => sectionRequirements += `- ID: "${s.id}", Title: "${s.title}", Shortcode: "${s.shortcode}"\n`);
    }
    if (parsedSectionsData.charts && Array.isArray(parsedSectionsData.charts)) {
      sectionRequirements += "\nCHART SECTIONS:\n";
      parsedSectionsData.charts.forEach((s) => sectionRequirements += `- ID: "${s.id}", Title: "${s.title}", Shortcode: "${s.shortcode}", Type: "${s.type}"\n`);
    }
    if (parsedSectionsData.tables && Array.isArray(parsedSectionsData.tables)) {
      sectionRequirements += "\nTABLE SECTIONS:\n";
      parsedSectionsData.tables.forEach((s) => sectionRequirements += `- ID: "${s.id}", Title: "${s.title}", Shortcode: "${s.shortcode}", Type: "${s.type}"\n`);
    }

    const finalPrompt = `You are an expert report generation AI assistant. Create a professional, comprehensive report in JSON format.
CONTEXT AND INSTRUCTIONS:
${system_prompt || "Generate a professional analysis report."}
${general_prompt ? `\nAdditional Guidelines: ${general_prompt}` : ""}

USER INPUT DATA:
${JSON.stringify(responses, null, 2)}
REQUIRED SECTIONS TO GENERATE:
${sectionRequirements}

OUTPUT FORMAT REQUIREMENTS:
- Return ONLY a valid JSON object
- NO markdown code blocks
EXACT JSON STRUCTURE:
{
  "sections": [
    {
      "section_type": "text", "id": "1", "shortcode": "intro", "title": "Introduction", "content": "Detailed text..."
    }
  ]
}
Generate the complete professional report now:`;

    const aiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You MUST respond with ONLY valid JSON." },
          { role: "user", content: finalPrompt },
        ],
        temperature: 0.7,
        max_tokens: 6000,
        response_format: { type: "json_object" },
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" } }
    );

    let aiContent = aiResponse.data.choices[0].message.content.trim();
    aiContent = aiContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    let parsedAIContent = JSON.parse(aiContent);

    const [reportTemplateRows] = await pool.query(
      `SELECT id FROM report_templates WHERE user_id = ? AND plan_id = ?`,
      [userId, planId]
    );

    const reportTemplateId = reportTemplateRows.length > 0 ? reportTemplateRows[0].id : null;
    const newReportId = uuidv4();

    await pool.query(
      `INSERT INTO reports (id, user_id, questionnaire_response_id, questionnaire_id, title, content, pdf_url, template_id, ai_response, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [newReportId, userId, questionnaireResponseId, questionnaireId, title || "Generated Report", JSON.stringify(responses || []), null, reportTemplateId, JSON.stringify(parsedAIContent)]
    );

    let pdfUrl = null;
    try {
      const pdfResult = await generatePDF({ title: title || "Generated Report", sections: parsedAIContent.sections, responses: responses, userId: userId, reportId: newReportId }, newReportId);
      pdfUrl = pdfResult.pdfUrl;
      await pool.query(`UPDATE reports SET pdf_url = ? WHERE id = ?`, [pdfUrl, newReportId]);
    } catch (e) {}

    // 🌟 FIX: TRIGGER REPORT EMAIL HERE!
    try {
      const [settings] = await pool.query("SELECT send_email_in_report FROM app_settings ORDER BY id DESC LIMIT 1");
      let sendReportEmail = false;
      
      if (settings.length > 0) {
        const val = settings[0].send_email_in_report;
        sendReportEmail = Buffer.isBuffer(val) ? val[0] === 1 : Boolean(val);
      }

      if (sendReportEmail) {
        const [userRows] = await pool.query("SELECT email, first_name FROM profiles WHERE id = ?", [userId]);
        if (userRows.length > 0) {
          await sendReportAvailableEmail(userRows[0].email, userRows[0].first_name || "Utente", title || "Report", newReportId);
          console.log(`✅ Report email successfully sent to ${userRows[0].email}`);
        }
      } else {
        console.log("🚫 Report email blocked by Admin Settings (OFF)");
      }
    } catch (emailErr) {
      console.error("❌ Error sending report email:", emailErr);
    }

    res.json({
      success: true,
      reportId: newReportId,
      pdfUrl: pdfUrl,
      templateId: templateId,
      questionnaireResponseId: questionnaireResponseId,
      sectionsGenerated: parsedAIContent.sections.length,
      sections: parsedAIContent.sections.map((s) => ({ type: s.section_type, id: s.id, shortcode: s.shortcode, title: s.title })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});

router.get("/pdf/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;
    const [rows] = await pool.query("SELECT pdf_url, title FROM reports WHERE id = ?", [reportId]);
    if (rows.length === 0 || !rows[0].pdf_url) return res.status(404).json({ success: false, message: "PDF not found" });

    const pdfPath = path.join(__dirname, "..", rows[0].pdf_url);
    if (!fs.existsSync(pdfPath)) return res.status(404).json({ success: false, message: "PDF file not found on server" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${rows[0].title || "report"}.pdf"`);
    fs.createReadStream(pdfPath).pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving PDF" });
  }
});

router.post("/regenerate-pdf/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;
    const [rows] = await pool.query("SELECT title, ai_response, content FROM reports WHERE id = ?", [reportId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Report not found" });

    const report = rows[0];
    const pdfResult = await generatePDF({
      title: report.title,
      aiContent: report.ai_response,
      responses: typeof report.content === "string" ? JSON.parse(report.content) : report.content,
    }, reportId);

    await pool.query("UPDATE reports SET pdf_url = ? WHERE id = ?", [pdfResult.pdfUrl, reportId]);
    res.json({ success: true, pdfUrl: pdfResult.pdfUrl, message: "PDF regenerated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error regenerating PDF", error: error.message });
  }
});

export default router;