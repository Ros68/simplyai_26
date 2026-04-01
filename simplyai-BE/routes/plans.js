import express from "express";
import { pool } from "../db.js";
import crypto from "crypto";

const router = express.Router();

// ============================================
// CRITICAL: ALL SPECIFIC ROUTES MUST BE BEFORE /:id ROUTES
// ============================================

// 🌟 FIX 9.3: Auto-add missing columns function
const ensureColumnsExist = async () => {
  try {
    await pool.query("ALTER TABLE subscription_plans ADD COLUMN plan_type VARCHAR(50) DEFAULT 'single'");
  } catch (e) { /* Column already exists */ }
  try {
    await pool.query("ALTER TABLE subscription_plans ADD COLUMN options JSON");
  } catch (e) { /* Column already exists */ }
};

// ========== 1. GET ALL PLANS (Admin) ==========
router.get("/admin/all", async (req, res) => {
  try {
    console.log("📥 [PLANS] Fetching all plans for admin");
    const [rows] = await pool.query(
      "SELECT * FROM subscription_plans ORDER BY sort_order ASC, created_at DESC"
    );

    const plans = rows.map((plan) => ({
      ...plan,
      features: typeof plan.features === "string" ? JSON.parse(plan.features || "[]") : plan.features,
      options: typeof plan.options === "string" ? JSON.parse(plan.options || "{}") : plan.options,
      is_popular: Boolean(plan.is_popular),
      is_free: Boolean(plan.is_free),
      active: Boolean(plan.active),
    }));

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error("❌ [PLANS] Error fetching all plans:", error);
    res.status(500).json({ success: false, message: "Failed to fetch all plans" });
  }
});

// ========== 2. USER SUBSCRIPTION (QUERY PARAM) - MUST BE BEFORE /:id ==========
router.get("/user-subscription", async (req, res) => {
  try {
    const { userId } = req.query;
    
    console.log("🔍 [PLANS] /user-subscription endpoint hit!");
    console.log("🔍 [PLANS] userId from query:", userId);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required as query parameter"
      });
    }
    
    const [rows] = await pool.query(
      `SELECT us.*, sp.name as plan_name, sp.options as plan_options 
       FROM user_subscriptions us
       JOIN subscription_plans sp ON us.plan_id = sp.id
       WHERE us.user_id = ? AND us.status = 'active'
       ORDER BY us.created_at DESC LIMIT 1`,
      [userId]
    );
    
    if (rows.length === 0) {
      console.log("⚠️ [PLANS] No subscription found for user:", userId);
      return res.status(404).json({
        success: false,
        message: "No active subscription found"
      });
    }
    
    const subscription = rows[0];
    console.log("✅ [PLANS] Found subscription:", subscription.id);
    
    let planOptions = subscription.plan_options;
    if (planOptions && typeof planOptions === 'string') {
      try { planOptions = JSON.parse(planOptions); } catch (e) { planOptions = {}; }
    }
    
    res.json({
      success: true,
      data: {
        id: subscription.id,
        user_id: subscription.user_id,
        plan_id: subscription.plan_id,
        plan_name: subscription.plan_name,
        plan_options: planOptions,
        status: subscription.status,
        started_at: subscription.started_at,
        expires_at: subscription.expires_at
      }
    });
    
  } catch (error) {
    console.error("❌ [PLANS] Error in /user-subscription:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user subscription",
      error: error.message
    });
  }
});

// ========== 3. CREATE FREE SUBSCRIPTION - MUST BE BEFORE /:id ==========
router.post("/create-free-subscription", async (req, res) => {
  try {
    const { user_id, plan_id } = req.body;
    
    console.log("🆓 [PLANS] /create-free-subscription endpoint hit!");
    console.log("🆓 [PLANS] user_id:", user_id, "plan_id:", plan_id);
    
    if (!user_id || !plan_id) {
      return res.status(400).json({
        success: false,
        message: "User ID and Plan ID are required"
      });
    }
    
    // Check existing
    const [existing] = await pool.query(
      "SELECT * FROM user_subscriptions WHERE user_id = ? AND plan_id = ? AND status = 'active'",
      [user_id, plan_id]
    );
    
    if (existing.length > 0) {
      console.log("✅ [PLANS] Subscription already exists:", existing[0].id);
      return res.json({
        success: true,
        message: "Subscription already exists",
        data: existing[0]
      });
    }
    
    // Create new
    const id = crypto.randomUUID();
    const now = new Date();
    const mysqlDateTime = now.toISOString().slice(0, 19).replace('T', ' ');
    
    const [planRows] = await pool.query(
      "SELECT name, options FROM subscription_plans WHERE id = ?",
      [plan_id]
    );
    
    const planName = planRows.length > 0 ? planRows[0].name : 'Free Plan';
    const planOptions = planRows.length > 0 ? planRows[0].options : {};
    
    await pool.query(
      `INSERT INTO user_subscriptions 
       (id, user_id, plan_id, status, started_at, expires_at, created_at, updated_at) 
       VALUES (?, ?, ?, 'active', ?, DATE_ADD(?, INTERVAL 100 YEAR), ?, ?)`,
      [id, user_id, plan_id, mysqlDateTime, mysqlDateTime, mysqlDateTime, mysqlDateTime]
    );
    
    console.log("✅ [PLANS] Free subscription created:", id);
    
    res.json({
      success: true,
      message: "Free subscription created successfully",
      data: {
        id, user_id, plan_id,
        plan_name: planName,
        plan_options: typeof planOptions === 'string' ? JSON.parse(planOptions) : planOptions,
        status: 'active',
        started_at: mysqlDateTime,
        expires_at: null
      }
    });
    
  } catch (error) {
    console.error("❌ [PLANS] Error in /create-free-subscription:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create free subscription",
      error: error.message
    });
  }
});

// ========== 4. QUESTIONNAIRES PUBLIC - MUST BE BEFORE /:id ==========
router.get("/questionnaires-public/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📋 [PLANS] /questionnaires-public endpoint hit! Plan ID:", id);

    const [planRows] = await pool.query(
      `SELECT pq.*, qc.title, qc.description, qc.status 
       FROM plan_questionnaires pq
       LEFT JOIN questionnaire_config qc ON pq.questionnaire_id = qc.id
       WHERE pq.plan_id = ? 
       ORDER BY pq.sequence_order ASC`,
      [id]
    );

    console.log(`📋 [PLANS] Found ${planRows.length} questionnaires for plan ${id}`);

    const result = planRows.map((pq, index) => ({
      questionnaire_id: pq.questionnaire_id,
      sequence_order: pq.sequence_order,
      title: pq.title || `Questionario ${index + 1}`,
      description: pq.description || `Questionario associato al piano`,
      status: pq.status || 'active',
      periodicity: pq.periodicity,
      repetitions: pq.repetitions
    }));

    res.json({
      success: true,
      data: result,
      count: result.length
    });
    
  } catch (error) {
    console.error("❌ [PLANS] Error in /questionnaires-public:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch plan questionnaires",
      error: error.message
    });
  }
});

// ========== 5. GET ALL ACTIVE PLANS ==========
router.get("/", async (req, res) => {
  try {
    console.log("📥 [PLANS] Fetching all active plans");
    const [rows] = await pool.query(
      "SELECT * FROM subscription_plans WHERE active = 1 ORDER BY sort_order ASC, created_at DESC"
    );

    const plans = rows.map((plan) => ({
      ...plan,
      features: typeof plan.features === "string" ? JSON.parse(plan.features || "[]") : plan.features,
      options: typeof plan.options === "string" ? JSON.parse(plan.options || "{}") : plan.options,
      is_popular: Boolean(plan.is_popular),
      is_free: Boolean(plan.is_free),
      active: Boolean(plan.active),
    }));

    res.json({ success: true, data: plans });
  } catch (error) {
    console.error("❌ [PLANS] Error fetching plans:", error);
    res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
});

// ========== 6. ADMIN GET SINGLE PLAN ==========
router.get("/admin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📥 [PLANS] Admin fetching plan:", id);
    
    const [rows] = await pool.query("SELECT * FROM subscription_plans WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const plan = rows[0];
    plan.features = typeof plan.features === "string" ? JSON.parse(plan.features || "[]") : plan.features;
    plan.options = typeof plan.options === "string" ? JSON.parse(plan.options || "{}") : plan.options;
    plan.is_popular = Boolean(plan.is_popular);
    plan.is_free = Boolean(plan.is_free);
    plan.active = Boolean(plan.active);

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error("❌ [PLANS] Error fetching plan for admin:", error);
    res.status(500).json({ success: false, message: "Failed to fetch plan" });
  }
});

// ========== 7. GET SINGLE PLAN (Public) ==========
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📥 [PLANS] Public fetching plan:", id);
    
    const [rows] = await pool.query(
      "SELECT * FROM subscription_plans WHERE id = ? AND active = 1", 
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const plan = rows[0];
    plan.features = typeof plan.features === "string" ? JSON.parse(plan.features || "[]") : plan.features;
    plan.options = typeof plan.options === "string" ? JSON.parse(plan.options || "{}") : plan.options;
    plan.is_popular = Boolean(plan.is_popular);
    plan.is_free = Boolean(plan.is_free);
    plan.active = Boolean(plan.active);

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error("❌ [PLANS] Error fetching plan:", error);
    res.status(500).json({ success: false, message: "Failed to fetch plan" });
  }
});

// ========== 8. CREATE PLAN ==========
router.post("/", async (req, res) => {
  try {
    await ensureColumnsExist(); // 🌟 FIX 9.3: Add columns if missing
    const { id, name, description, price, is_free, features, active, button_text, button_variant, sort_order, is_popular, created_at, updated_at, plan_type, options } = req.body;
    const interval = req.body.interval;

    console.log("📝 [PLANS] Creating new plan:", name);

    if (!id || !name) {
      return res.status(400).json({ success: false, message: "ID and name are required" });
    }

    const query = `
      INSERT INTO subscription_plans (id, name, description, price, is_free, features, active, button_text, button_variant, sort_order, \`interval\`, is_popular, created_at, updated_at, plan_type, options)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const queryParams = [
      id, name, description || "", price || 0, is_free ? 1 : 0,
      JSON.stringify(features || []), active ? 1 : 0, button_text || "",
      button_variant || "", sort_order || 0, interval || "month",
      is_popular ? 1 : 0, created_at, updated_at, plan_type || "single",
      JSON.stringify(options || {}),
    ];

    const [result] = await pool.execute(query, queryParams);
    console.log("✅ [PLANS] Plan created:", id);

    res.json({ success: true, message: "Plan created successfully" });
  } catch (error) {
    console.error("❌ [PLANS] Error creating plan:", error);
    res.status(500).json({ success: false, message: "Failed to create plan", error: error.message });
  }
});

// ========== 9. UPDATE PLAN ==========
router.put("/:id", async (req, res) => {
  try {
    await ensureColumnsExist(); // 🌟 FIX 9.3: Add columns if missing
    const { name, description, price, is_free, features, active, button_text, button_variant, sort_order, is_popular, updated_at, plan_type, options } = req.body;
    const interval = req.body.interval;
    const { id } = req.params;

    console.log("📝 [PLANS] Updating plan:", id);

    const [existingPlan] = await pool.query("SELECT * FROM subscription_plans WHERE id = ?", [id]);
    if (existingPlan.length === 0) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const mysqlDateTime = new Date(updated_at || new Date()).toISOString().slice(0, 19).replace("T", " ");

    const query = `UPDATE subscription_plans SET 
      name = ?, description = ?, price = ?, is_free = ?, features = ?, active = ?, 
      button_text = ?, button_variant = ?, sort_order = ?, \`interval\` = ?, is_popular = ?, updated_at = ?, plan_type = ?, options = ?
      WHERE id = ?`;

    const queryParams = [
      name, description || "", price || 0, is_free ? 1 : 0,
      JSON.stringify(features || []), active ? 1 : 0, button_text || "",
      button_variant || "", sort_order || 0, interval || "month",
      is_popular ? 1 : 0, mysqlDateTime, plan_type || "single",
      JSON.stringify(options || {}), id,
    ];

    await pool.execute(query, queryParams);
    console.log("✅ [PLANS] Plan updated:", id);

    res.json({ success: true, message: "Plan updated successfully" });
  } catch (error) {
    console.error("❌ [PLANS] Error updating plan:", error);
    res.status(500).json({ success: false, message: "Failed to update plan" });
  }
});

// ========== 10. DELETE PLAN ==========
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑️ [PLANS] Deleting plan:", id);

    const [result] = await pool.query("DELETE FROM subscription_plans WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    res.json({ success: true, message: "Plan deleted successfully" });
  } catch (error) {
    console.error("❌ [PLANS] Error deleting plan:", error);
    res.status(500).json({ success: false, message: "Failed to delete plan" });
  }
});

// ========== 11. CHECK PLAN HAS USERS ==========
router.get("/:id/has-users", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM user_subscriptions WHERE plan_id = ? AND status = 'active'",
      [id]
    );
    
    res.json({ success: true, hasUsers: rows[0].count > 0, count: rows[0].count });
  } catch (error) {
    console.error("❌ [PLANS] Error checking users:", error);
    res.status(500).json({ success: false, hasUsers: false });
  }
});

// ========== 12. GET PLAN QUESTIONNAIRES ==========
router.get("/:id/questionnaires", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📋 [PLANS] Fetching questionnaires for plan:", id);

    const [planRows] = await pool.query(
      `SELECT pq.*, qc.title, qc.description, qc.status 
       FROM plan_questionnaires pq
       LEFT JOIN questionnaire_config qc ON pq.questionnaire_id = qc.id
       WHERE pq.plan_id = ? 
       ORDER BY pq.sequence_order ASC`,
      [id]
    );

    const result = planRows.map((pq, index) => ({
      questionnaire_id: pq.questionnaire_id,
      sequence_order: pq.sequence_order,
      title: pq.title || `Questionario ${index + 1}`,
      description: pq.description || `Questionario associato al piano`,
      status: pq.status || 'active'
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("❌ [PLANS] Error fetching questionnaires:", error);
    res.status(500).json({ success: false, message: "Failed to fetch questionnaires" });
  }
});

// ========== 13. UPDATE PLAN QUESTIONNAIRES ==========
router.put("/:id/questionnaires", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { questionnaires } = req.body;

    console.log("📝 [PLANS] Updating questionnaires for plan:", id);

    await connection.beginTransaction();
    await connection.query("DELETE FROM plan_questionnaires WHERE plan_id = ?", [id]);

    if (questionnaires && questionnaires.length > 0) {
      for (let i = 0; i < questionnaires.length; i++) {
        const q = questionnaires[i];
        const questionnaireId = q.questionnaire_id || q.id;
        const sequenceOrder = q.sequence_order || q.sequence || i + 1;
        
        if (questionnaireId) {
          await connection.query(
            "INSERT INTO plan_questionnaires (plan_id, questionnaire_id, sequence_order) VALUES (?, ?, ?)",
            [id, questionnaireId, sequenceOrder]
          );
        }
      }
    }

    await connection.commit();
    res.json({ success: true, message: "Questionnaires updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("❌ [PLANS] Error updating questionnaires:", error);
    res.status(500).json({ success: false, message: "Failed to update questionnaires" });
  } finally {
    connection.release();
  }
});

// ========== 14. GET/SAVE PLAN SETTINGS ==========
router.get("/:id/settings", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM plan_settings WHERE plan_id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Plan settings not found" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("❌ [PLANS] Error fetching settings:", error);
    res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
});

router.post("/:id/settings", async (req, res) => {
  try {
    const { id } = req.params;
    const { is_free, can_retake, retake_period_days, retake_limit, is_sequential, is_progress_tracking, is_periodic } = req.body;

    const [existing] = await pool.query("SELECT * FROM plan_settings WHERE plan_id = ?", [id]);

    const settingsData = {
      plan_id: id, is_free: Boolean(is_free), can_retake: Boolean(can_retake),
      retake_period_days: retake_period_days || 90, retake_limit: retake_limit || 4,
      is_sequential: Boolean(is_sequential), is_progress_tracking: Boolean(is_progress_tracking),
      is_periodic: Boolean(is_periodic), updated_at: new Date(),
    };

    if (existing.length > 0) {
      await pool.query(
        `UPDATE plan_settings SET is_free = ?, can_retake = ?, retake_period_days = ?, retake_limit = ?,
         is_sequential = ?, is_progress_tracking = ?, is_periodic = ?, updated_at = ? WHERE plan_id = ?`,
        [settingsData.is_free, settingsData.can_retake, settingsData.retake_period_days, settingsData.retake_limit,
         settingsData.is_sequential, settingsData.is_progress_tracking, settingsData.is_periodic, settingsData.updated_at, id]
      );
    } else {
      settingsData.created_at = new Date();
      await pool.query(
        `INSERT INTO plan_settings (plan_id, is_free, can_retake, retake_period_days, retake_limit,
         is_sequential, is_progress_tracking, is_periodic, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [settingsData.plan_id, settingsData.is_free, settingsData.can_retake, settingsData.retake_period_days,
         settingsData.retake_limit, settingsData.is_sequential, settingsData.is_progress_tracking, settingsData.is_periodic,
         settingsData.created_at, settingsData.updated_at]
      );
    }

    res.json({ success: true, message: "Settings saved successfully", data: settingsData });
  } catch (error) {
    console.error("❌ [PLANS] Error saving settings:", error);
    res.status(500).json({ success: false, message: "Failed to save settings" });
  }
});

export default router;