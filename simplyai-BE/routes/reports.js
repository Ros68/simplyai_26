import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ── Helper: try multiple table/column name combinations ──────────────────────
// This handles uncertainty about exact DB schema by trying both naming patterns
async function fetchCompletedQuestionnairesFromDB(userId) {
  // Try 1: table = questionnaire_completions (matches "save-questionnaire-completion" API)
  try {
    const [rows] = await pool.query(
      `SELECT 
         qc.id,
         qc.questionnaire_id,
         COALESCE(cfg.title, 'Questionario') AS questionnaire_title,
         qc.completed_at,
         qc.answers,
         qc.pdf_url
       FROM questionnaire_completions qc
       LEFT JOIN questionnaire_config cfg ON cfg.id = qc.questionnaire_id
       WHERE qc.user_id = ?
       ORDER BY qc.completed_at DESC`,
      [userId]
    );
    console.log("✅ Used table: questionnaire_completions, rows:", rows.length);
    return rows;
  } catch (e1) {
    console.warn("⚠️ questionnaire_completions failed:", e1.message);
  }

  // Try 2: table = questionnaire_responses with status filter
  try {
    const [rows] = await pool.query(
      `SELECT 
         qr.id,
         qr.questionnaire_id,
         COALESCE(cfg.title, 'Questionario') AS questionnaire_title,
         qr.completed_at,
         qr.answers,
         NULL AS pdf_url
       FROM questionnaire_responses qr
       LEFT JOIN questionnaire_config cfg ON cfg.id = qr.questionnaire_id
       WHERE qr.user_id = ?
         AND qr.status = 'completed'
       ORDER BY qr.completed_at DESC`,
      [userId]
    );
    console.log("✅ Used table: questionnaire_responses, rows:", rows.length);
    return rows;
  } catch (e2) {
    console.warn("⚠️ questionnaire_responses failed:", e2.message);
  }

  // Try 3: completed_at might not exist — use created_at instead
  try {
    const [rows] = await pool.query(
      `SELECT 
         qc.id,
         qc.questionnaire_id,
         COALESCE(cfg.title, 'Questionario') AS questionnaire_title,
         qc.created_at AS completed_at,
         qc.answers,
         NULL AS pdf_url
       FROM questionnaire_completions qc
       LEFT JOIN questionnaire_config cfg ON cfg.id = qc.questionnaire_id
       WHERE qc.user_id = ?
       ORDER BY qc.created_at DESC`,
      [userId]
    );
    console.log("✅ Used table: questionnaire_completions (created_at), rows:", rows.length);
    return rows;
  } catch (e3) {
    console.warn("⚠️ All attempts failed:", e3.message);
    throw new Error("Cannot find questionnaire completions table. Check DB schema.");
  }
}

// ── GET /reports/user/:userId ─────────────────────────────────────────────────
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.query(
      `SELECT id, user_id, questionnaire_id, title, content, pdf_url, created_at, template_id
       FROM reports 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    console.log("reports for user:", rows.length);
    res.json({ success: true, reports: rows });
  } catch (error) {
    console.error("Error fetching user reports:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /reports/user/:userId/completed-questionnaires ────────────────────────
router.get("/user/:userId/completed-questionnaires", async (req, res) => {
  try {
    const { userId } = req.params;

    const rows = await fetchCompletedQuestionnairesFromDB(userId);

    // Parse answers JSON string if needed
    const parsed = rows.map((row) => {
      let answers = row.answers;
      if (typeof answers === "string") {
        try { answers = JSON.parse(answers); } catch { answers = {}; }
      }
      return { ...row, answers: answers || {} };
    });

    res.json({ success: true, completedQuestionnaires: parsed });
  } catch (error) {
    console.error("Error fetching completed questionnaires:", error.message);
    // Return empty array instead of 500 — frontend shows "no completions" gracefully
    res.json({ success: true, completedQuestionnaires: [], _error: error.message });
  }
});

// ── GET /reports/:reportId ────────────────────────────────────────────────────
router.get("/:reportId", async (req, res) => {
  try {
    const { reportId } = req.params;
    const [rows] = await pool.query(
      `SELECT id, user_id, questionnaire_id, title, content, pdf_url, created_at, template_id
       FROM reports WHERE id = ?`,
      [reportId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }
    res.json({ success: true, report: rows[0] });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── GET /reports/:reportId/ai-response ───────────────────────────────────────
router.get("/:reportId/ai-response", async (req, res) => {
  try {
    const { reportId } = req.params;
    const [rows] = await pool.query(
      `SELECT ai_response FROM reports WHERE id = ?`,
      [reportId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }
    res.json({ success: true, aiResponse: rows[0].ai_response });
  } catch (error) {
    console.error("Error fetching AI response:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;