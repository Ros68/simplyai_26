import express from "express";
import { pool } from "../db.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const router = express.Router();

router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

const ensureReportTemplatesTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report_templates (
        id VARCHAR(36) PRIMARY KEY,
        plan_id VARCHAR(36),
        title VARCHAR(255),
        description TEXT,
        content LONGTEXT,
        is_default BOOLEAN DEFAULT false,
        font_family VARCHAR(100),
        font_size VARCHAR(20),
        column_layout VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  } catch (e) { console.error("Table check error:", e); }
};

router.get("/report-template/:id", async (req, res) => {
  try {
    await ensureReportTemplatesTable();
    const [rows] = await pool.query('SELECT * FROM report_templates WHERE id = ?', [req.params.id]);
    if (rows.length > 0) res.json({ success: true, template: rows[0] });
    else res.status(404).json({ success: false, message: "Template not found" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/report-template", async (req, res) => {
  try {
    await ensureReportTemplatesTable();
    const { plan_id, title, content, description, is_default, font_family, font_size, column_layout } = req.body;
    const id = uuidv4();
    if (is_default) {
      await pool.query('UPDATE report_templates SET is_default = false WHERE plan_id = ?', [plan_id]);
    }
    await pool.query(
      `INSERT INTO report_templates (id, plan_id, title, content, description, is_default, font_family, font_size, column_layout) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, plan_id, title, content, description || '', is_default || false, font_family, font_size, column_layout]
    );
    res.json({ success: true, template: { id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/report-template/:id", async (req, res) => {
  try {
    await ensureReportTemplatesTable();
    const { title, content, description, is_default, font_family, font_size, column_layout, plan_id } = req.body;
    if (is_default) {
      await pool.query('UPDATE report_templates SET is_default = false WHERE plan_id = ?', [plan_id]);
    }
    await pool.query(
      `UPDATE report_templates SET title=?, content=?, description=?, is_default=?, font_family=?, font_size=?, column_layout=? WHERE id=?`,
      [title, content, description, is_default, font_family, font_size, column_layout, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/plan/:planId", async (req, res) => {
  try {
    const { planId } = req.params;
    const [promptTemplateRows] = await pool.query(
      `SELECT * FROM prompt_templates WHERE plan_id = ? ORDER BY sequence_index ASC`,
      [planId]
    );
    res.json({ success: true, data: promptTemplateRows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch prompt templates" });
  }
});

router.get("/plan/:planId/questionnaire/:questionnaireId", async (req, res) => {
  try {
    const { planId, questionnaireId } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM prompt_templates WHERE plan_id = ? AND questionnaire_id = ? ORDER BY sequence_index ASC`,
      [planId, questionnaireId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch prompt templates" });
  }
});

router.get("/template/:questionnaireId", async (req, res) => {
  try {
    const { questionnaireId } = req.params;
    const [rows] = await pool.query(
      `SELECT report_template FROM prompt_templates WHERE questionnaire_id = ?`,
      [questionnaireId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Report template not found" });
    res.json({ success: true, reportTemplate: rows[0].report_template });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🌟 POST Fix: Better mapping for incoming keys
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const id = data.id || uuidv4();
    try { await pool.query("ALTER TABLE prompt_templates ADD COLUMN reference_questionnaires JSON"); } catch (e) {}

    // Support both sets of keys
    const content = data.content || data.prompt_principale || "";
    const report_template = data.reportTemplate || data.report_template || data.template_structure || "";
    const sections_data = data.sections || data.sections_data || {};

    const query = `
      INSERT INTO prompt_templates 
      (id, plan_id, questionnaire_id, title, content, system_prompt, variables, sequence_index, sections_data, report_template, reference_questionnaires, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      id, data.plan_id, data.questionnaire_id, data.title, content,
      data.system_prompt || "", JSON.stringify(data.variables || []),
      data.sequence_index || 0, JSON.stringify(sections_data),
      report_template,
      JSON.stringify(data.reference_questionnaires || {})
    ];

    await pool.query(query, values);
    res.status(201).json({ success: true, data: { ...data, id, ai_response: null }, message: "Created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`SELECT * FROM prompt_templates WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Prompt template not found" });
    const template = rows[0];
    if (typeof template.variables === "string") template.variables = JSON.parse(template.variables);
    if (typeof template.sections_data === "string") template.sections_data = JSON.parse(template.sections_data);
    if (typeof template.reference_questionnaires === "string") template.reference_questionnaires = JSON.parse(template.reference_questionnaires);
    if (template.sections_data) template.sections = template.sections_data;
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch prompt template" });
  }
});

// 🌟 PUT Fix: Better mapping for incoming keys
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    try { await pool.query("ALTER TABLE prompt_templates ADD COLUMN reference_questionnaires JSON"); } catch (e) {}

    const content = data.content || data.prompt_principale || "";
    const report_template = data.reportTemplate || data.report_template || data.template_structure || "";
    const sections_data = data.sections || data.sections_data || {};

    const query = `
      UPDATE prompt_templates 
      SET plan_id=?, questionnaire_id=?, title=?, content=?, system_prompt=?, variables=?, 
          sequence_index=?, sections_data=?, report_template=?, reference_questionnaires=?, updated_at=NOW()
      WHERE id=?
    `;

    const values = [
      data.plan_id, data.questionnaire_id, data.title, content,
      data.system_prompt || "", JSON.stringify(data.variables || []),
      data.sequence_index || 0, JSON.stringify(sections_data),
      report_template,
      JSON.stringify(data.reference_questionnaires || {}),
      id
    ];

    const [result] = await pool.query(query, values);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: { ...data, id, ai_response: null } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM prompt_templates WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

export default router;