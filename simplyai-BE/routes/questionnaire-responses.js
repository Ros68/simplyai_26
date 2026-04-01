/**
 * questionnaire-responses.js
 * 
 * Handles saving questionnaire responses (draft + completed).
 * Mount this in your main router as:
 *   app.use('/api/questionnaires', questionnaireResponsesRouter);
 * 
 * Endpoints added:
 *   POST /api/questionnaires/:id/responses   — save response (draft or completed)
 *   GET  /api/questionnaires/:id             — fetch questionnaire questions by ID
 */

import express from "express";
import { pool } from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// ── GET /questionnaires/:id ─────────────────────────────────────────────────
// Returns the questionnaire with its questions so the frontend can render them
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT id, title, description, questions, status, plan_id, created_at
       FROM questionnaires
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Questionnaire not found" });
    }

    const questionnaire = rows[0];

    // Parse questions if stored as JSON string
    if (typeof questionnaire.questions === "string") {
      try {
        questionnaire.questions = JSON.parse(questionnaire.questions);
      } catch {
        questionnaire.questions = [];
      }
    }

    res.json({ success: true, questionnaire });
  } catch (error) {
    console.error("Error fetching questionnaire:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ── POST /questionnaires/:id/responses ─────────────────────────────────────
// Save a questionnaire response (status: 'draft' or 'completed')
router.post("/:id/responses", async (req, res) => {
  try {
    const { id: questionnaire_id } = req.params;
    const { user_id, answers, status = "completed" } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: "user_id is required" });
    }

    const responseId = uuidv4();
    const answersJson = typeof answers === "string" ? answers : JSON.stringify(answers || {});
    const now = new Date();

    // Upsert: if a draft exists for this user+questionnaire, update it; else insert
    const [existing] = await pool.query(
      `SELECT id FROM questionnaire_responses 
       WHERE user_id = ? AND questionnaire_id = ? AND status = 'draft'
       ORDER BY created_at DESC LIMIT 1`,
      [user_id, questionnaire_id]
    );

    let savedId;

    if (existing.length > 0 && status === "draft") {
      // Update existing draft
      savedId = existing[0].id;
      await pool.query(
        `UPDATE questionnaire_responses 
         SET answers = ?, updated_at = ? 
         WHERE id = ?`,
        [answersJson, now, savedId]
      );
    } else {
      // Insert new response
      savedId = responseId;
      await pool.query(
        `INSERT INTO questionnaire_responses 
           (id, user_id, questionnaire_id, answers, status, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          savedId,
          user_id,
          questionnaire_id,
          answersJson,
          status,
          status === "completed" ? now : null,
          now,
          now,
        ]
      );
    }

    res.json({
      success: true,
      responseId: savedId,
      message: status === "completed" ? "Questionnaire completed successfully" : "Draft saved successfully",
    });
  } catch (error) {
    console.error("Error saving questionnaire response:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;