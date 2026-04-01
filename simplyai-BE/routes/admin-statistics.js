/**
 * admin-statistics.js
 * Backend routes for SuperAdmin ReportsPage statistics.
 *
 * Mount in your main server as:
 * import adminStatsRouter from './routes/admin-statistics.js';
 * app.use('/api/admin/statistics', adminStatsRouter);
 *
 * Requires tables: users, user_subscriptions, subscription_plans,
 * questionnaire_completions (or questionnaire_responses),
 * questionnaire_config
 */

import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ── Helper: parse date range from query params ──────────────────────────────
function parseDateRange(query) {
  const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = query.to ? new Date(query.to) : new Date();
  return { from, to };
}

// ── Helper: detect which completions table exists ───────────────────────────
async function getCompletionsTable() {
  try {
    await pool.query("SELECT 1 FROM questionnaire_completions LIMIT 1");
    return "questionnaire_completions";
  } catch {
    return "questionnaire_responses";
  }
}

// 🌟 FIX 1: Dashboard Overview Stats Verification
router.get("/overview", async (req, res) => {
  try {
    const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM profiles WHERE role != 'administrator'");
    const [[{ activeQuestionnaires }]] = await pool.query("SELECT COUNT(*) AS activeQuestionnaires FROM questionnaire_config WHERE status = 'published'");
    
    const table = await getCompletionsTable();
    const statusFilter = table === "questionnaire_responses" ? "WHERE status = 'completed'" : "";
    const [[{ completedQuestionnaires }]] = await pool.query(`SELECT COUNT(*) AS completedQuestionnaires FROM ${table} ${statusFilter}`);
    
    let totalReports = 0;
    try {
      const [[row]] = await pool.query("SELECT COUNT(*) AS totalReports FROM reports");
      totalReports = row.totalReports;
    } catch (e) { /* Ignore if table doesn't exist */ }

    res.json({
      success: true,
      stats: {
        totalUsers: Number(totalUsers),
        activeQuestionnaires: Number(activeQuestionnaires),
        completedQuestionnaires: Number(completedQuestionnaires),
        totalReports: Number(totalReports)
      }
    });
  } catch (error) {
    console.error("Error fetching overview stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /admin/statistics/users ─────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);

    // Total users
    const [[{ totalUsers }]] = await pool.query(
      `SELECT COUNT(*) AS totalUsers FROM profiles`
    );

    // New users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const [[{ newUsersThisMonth }]] = await pool.query(
      `SELECT COUNT(*) AS newUsersThisMonth FROM profiles WHERE created_at >= ?`,
      [startOfMonth]
    );

    // Users by role
    const [roleRows] = await pool.query(
      `SELECT COALESCE(role, 'user') AS role, COUNT(*) AS count
       FROM profiles
       GROUP BY role
       ORDER BY count DESC`
    );

    // Users by plan
    const [planRows] = await pool.query(
      `SELECT COALESCE(sp.name, 'Nessun piano') AS planName, COUNT(*) AS count
       FROM profiles u
       LEFT JOIN user_subscriptions us ON us.user_id = u.id AND us.status = 'active'
       LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
       GROUP BY sp.name
       ORDER BY count DESC`
    );

    // Registration trend (daily within range)
    const [trendRows] = await pool.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM profiles
       WHERE created_at BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [from, to]
    );

    res.json({
      success: true,
      statistics: {
        totalUsers: Number(totalUsers),
        newUsersThisMonth: Number(newUsersThisMonth),
        usersByRole: roleRows,
        usersByPlan: planRows,
        registrationTrend: trendRows,
      },
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /admin/statistics/questionnaires ────────────────────────────────────
router.get("/questionnaires", async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const table = await getCompletionsTable();
    const dateCol = table === "questionnaire_completions" ? "completed_at" : "completed_at";

    // Total completed
    const [[{ completedQuestionnaires }]] = await pool.query(
      `SELECT COUNT(*) AS completedQuestionnaires
       FROM ${table}
       WHERE ${dateCol} BETWEEN ? AND ?
         ${table === "questionnaire_responses" ? "AND status = 'completed'" : ""}`,
      [from, to]
    );

    // Total started (for completion rate)
    let totalStarted = completedQuestionnaires;
    try {
      const [[row]] = await pool.query(
        `SELECT COUNT(*) AS totalStarted FROM ${table}
         WHERE ${dateCol} BETWEEN ? AND ?`,
        [from, to]
      );
      totalStarted = Math.max(Number(row.totalStarted), 1);
    } catch {}

    const completionRate = (completedQuestionnaires / totalStarted) * 100;

    // Responses per questionnaire
    const [perQRows] = await pool.query(
      `SELECT COALESCE(qc.title, t.questionnaire_id) AS name, COUNT(*) AS count
       FROM ${table} t
       LEFT JOIN questionnaire_config qc ON qc.id = t.questionnaire_id
       WHERE t.${dateCol} BETWEEN ? AND ?
         ${table === "questionnaire_responses" ? "AND t.status = 'completed'" : ""}
       GROUP BY t.questionnaire_id, qc.title
       ORDER BY count DESC`,
      [from, to]
    );

    // Response trend
    const [trendRows] = await pool.query(
      `SELECT DATE(${dateCol}) AS date, COUNT(*) AS count
       FROM ${table}
       WHERE ${dateCol} BETWEEN ? AND ?
         ${table === "questionnaire_responses" ? "AND status = 'completed'" : ""}
       GROUP BY DATE(${dateCol})
       ORDER BY date ASC`,
      [from, to]
    );

    res.json({
      success: true,
      statistics: {
        completedQuestionnaires: Number(completedQuestionnaires),
        completionRate: parseFloat(completionRate.toFixed(1)),
        responsesPerQuestionnaire: perQRows,
        responseTrend: trendRows,
      },
    });
  } catch (error) {
    console.error("Error fetching questionnaire statistics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /admin/statistics/subscriptions ─────────────────────────────────────
router.get("/subscriptions", async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);

    // Active subscriptions
    const [[{ activeSubscriptions }]] = await pool.query(
      `SELECT COUNT(*) AS activeSubscriptions
       FROM user_subscriptions WHERE status = 'active'`
    );

    // Total subscriptions
    const [[{ totalSubscriptions }]] = await pool.query(
      `SELECT COUNT(*) AS totalSubscriptions FROM user_subscriptions`
    );

    // Monthly revenue (sum of plan prices for active subscriptions)
    let monthlyRevenue = 0;
    try {
      const [[row]] = await pool.query(
        `SELECT COALESCE(SUM(sp.price), 0) AS monthlyRevenue
         FROM user_subscriptions us
         JOIN subscription_plans sp ON sp.id = us.plan_id
         WHERE us.status = 'active'`
      );
      monthlyRevenue = parseFloat(row.monthlyRevenue) || 0;
    } catch {}

    // Subscriptions by plan
    const [planRows] = await pool.query(
      `SELECT COALESCE(sp.name, 'Unknown') AS planName,
              COUNT(*) AS count,
              CAST(COALESCE(SUM(sp.price), 0) AS DECIMAL(10,2)) AS revenue
       FROM user_subscriptions us
       LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
       WHERE us.status = 'active'
       GROUP BY sp.name
       ORDER BY count DESC`
    );

    // Subscription trend
    const [trendRows] = await pool.query(
      `SELECT DATE(started_at) AS date, COUNT(*) AS count
       FROM user_subscriptions
       WHERE started_at BETWEEN ? AND ?
       GROUP BY DATE(started_at)
       ORDER BY date ASC`,
      [from, to]
    );

    res.json({
      success: true,
      statistics: {
        activeSubscriptions: Number(activeSubscriptions),
        totalSubscriptions: Number(totalSubscriptions),
        monthlyRevenue,
        subscriptionsByPlan: planRows.map(p => ({...p, count: Number(p.count), revenue: parseFloat(p.revenue) || 0})),
        subscriptionTrend: trendRows,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription statistics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /admin/statistics/question-answers ───────────────────────────────────
router.get("/question-answers", async (req, res) => {
  try {
    const { questionId } = req.query;
    const { from, to } = parseDateRange(req.query);
    const table = await getCompletionsTable();

    if (!questionId) {
      return res.status(400).json({ success: false, message: "questionId required" });
    }

    // Get all answers for this question from the responses JSON
    const [rows] = await pool.query(
      `SELECT answers FROM ${table}
       WHERE questionnaire_id = ?
         AND (completed_at BETWEEN ? AND ?)
         ${table === "questionnaire_responses" ? "AND status = 'completed'" : ""}`,
      [questionId.split("__")[0], from, to]
    );

    // Parse answers and extract distribution
    const distribution = {};

    let totalResponses = 0;

    for (const row of rows) {
      let answers = row.answers;
      if (typeof answers === "string") {
        try { answers = JSON.parse(answers); } catch { continue; }
      }
      if (!answers) continue;

      // answers is a flat object: { questionName: answer, ... }
      const qKey = questionId.split("__")[1] || questionId;
      const answer = answers[qKey];
      if (answer === undefined || answer === null) continue;

      const strAnswer = Array.isArray(answer) ? answer.join(", ") : String(answer);
      distribution[strAnswer] = (distribution[strAnswer] || 0) + 1;
      totalResponses++;
    }

    const answerDistribution = Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);

    // Get question title
    let title = questionId;
    try {
      const [qRows] = await pool.query(
        `SELECT questions FROM questionnaire_config WHERE id = ?`,
        [questionId.split("__")[0]]
      );
      if (qRows.length > 0) {
        let questions = qRows[0].questions;
        if (typeof questions === "string") questions = JSON.parse(questions);
        // Find the specific question by name
        const qKey = questionId.split("__")[1] || questionId;
        const findQuestion = (pages) => {
          for (const page of pages || []) {
            for (const el of page.elements || []) {
              if (el.name === qKey) return el.title || el.name;
            }
          }
          return null;
        };
        title = findQuestion(questions?.pages || []) || qKey;
      }
    } catch {}

    res.json({
      success: true,
      statistics: { title, totalResponses, answerDistribution },
    });
  } catch (error) {
    console.error("Error fetching question answer stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /admin/statistics/questions ─────────────────────────────────────────
// Returns list of all questions across all questionnaires for the dropdown
router.get("/questions", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, questions FROM questionnaire_config WHERE status = 'published'`
    );

    const questions = [];
    for (const row of rows) {
      let qs = row.questions;
      if (typeof qs === "string") {
        try { qs = JSON.parse(qs); } catch { continue; }
      }
      for (const page of qs?.pages || []) {
        for (const el of page.elements || []) {
          if (el.name) {
            questions.push({
              questionId: `${row.id}__${el.name}`,
              title: `${row.title} — ${el.title || el.name}`,
            });
          }
        }
      }
    }

    res.json({ success: true, questions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /admin/statistics/demographics ──────────────────────────────────────
router.get("/demographics", async (req, res) => {
  try {
    const { field = "role" } = req.query;
    const { from, to } = parseDateRange(req.query);

    // Map field to actual column — extend as needed based on your users table
    const allowedFields = {
      role: "COALESCE(role, 'user')",
      job: "COALESCE(job_title, job, 'Non specificato')",
      age_group: `CASE 
        WHEN YEAR(CURDATE()) - YEAR(date_of_birth) < 25 THEN '< 25'
        WHEN YEAR(CURDATE()) - YEAR(date_of_birth) < 35 THEN '25-34'
        WHEN YEAR(CURDATE()) - YEAR(date_of_birth) < 45 THEN '35-44'
        WHEN YEAR(CURDATE()) - YEAR(date_of_birth) < 55 THEN '45-54'
        ELSE '55+'
      END`,
    };

    const colExpr = allowedFields[field] || "COALESCE(role, 'user')";

    let rows = [];
    try {
      [rows] = await pool.query(
        `SELECT ${colExpr} AS name, COUNT(*) AS value
         FROM profiles
         WHERE created_at BETWEEN ? AND ?
         GROUP BY name
         ORDER BY count DESC`,
        [from, to]
      );
    } catch (e) {
      // Column might not exist — return empty
      console.warn("demographics query failed:", e.message);
    }

    res.json({ success: true, demographics: rows });
  } catch (error) {
    console.error("Error fetching demographics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /admin/statistics/filters ────────────────────────────────────────────
router.get("/filters", async (req, res) => {
  try {
    const [roleRows] = await pool.query(
      `SELECT DISTINCT COALESCE(role, 'user') AS val FROM profiles ORDER BY val`
    );

    const [planRows] = await pool.query(
      `SELECT DISTINCT name AS val FROM subscription_plans WHERE status = 'active' ORDER BY val`
    );

    res.json({
      success: true,
      filters: {
        role: roleRows.map((r) => r.val),
        plan: planRows.map((r) => r.val),
      },
    });
  } catch (error) {
    console.error("Error fetching available filters:", error);
    res.json({ success: true, filters: {} }); // non-fatal
  }
});

// ── GET /admin/statistics/age-distribution ───────────────────────────────────
router.get("/age-distribution", async (req, res) => {
  try {
    let rows = [];
    try {
      [rows] = await pool.query(
        `SELECT 
          CASE 
            WHEN YEAR(CURDATE()) - YEAR(date_of_birth) < 25 THEN '< 25'
            WHEN YEAR(CURDATE()) - YEAR(date_of_birth) < 35 THEN '25-34'
            WHEN YEAR(CURDATE()) - YEAR(date_of_birth) < 45 THEN '35-44'
            WHEN YEAR(CURDATE()) - YEAR(date_of_birth) < 55 THEN '45-54'
            ELSE '55+'
          END AS age_group,
          COUNT(*) AS count
         FROM profiles
         WHERE date_of_birth IS NOT NULL
         GROUP BY age_group
         ORDER BY age_group`
      );
    } catch {
      // date_of_birth column might not exist
    }
    res.json({ success: true, ageDistribution: rows });
  } catch (error) {
    console.error("Error fetching age distribution:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /admin/statistics/retention ─────────────────────────────────────────
router.get("/retention", async (req, res) => {
  try {
    const { from, to } = parseDateRange(req.query);
    const table = await getCompletionsTable();

    // Retention: % of users who completed ≥ 1 questionnaire in each month
    const [rows] = await pool.query(
      `SELECT 
         DATE_FORMAT(completed_at, '%Y-%m') AS month,
         COUNT(DISTINCT user_id) AS activeUsers,
         (SELECT COUNT(*) FROM profiles WHERE created_at <= LAST_DAY(t.completed_at)) AS totalUsers
       FROM ${table} t
       WHERE completed_at BETWEEN ? AND ?
       GROUP BY month
       ORDER BY month ASC`,
      [from, to]
    );

    const retentionData = rows.map((r) => ({
      month: r.month,
      retention: r.totalUsers > 0
        ? parseFloat(((r.activeUsers / r.totalUsers) * 100).toFixed(1))
        : 0,
    }));

    res.json({ success: true, retentionData });
  } catch (error) {
    console.error("Error fetching retention data:", error);
    res.json({ success: true, retentionData: [] }); // non-fatal
  }
});

// ── GET /admin/statistics/completion-by-demographic ──────────────────────────
router.get("/completion-by-demographic", async (req, res) => {
  try {
    const { field = "role" } = req.query;
    const { from, to } = parseDateRange(req.query);
    const table = await getCompletionsTable();

    const allowedFields = {
      role: "COALESCE(u.role, 'user')",
      job: "COALESCE(u.job_title, u.job, 'Non specificato')",
    };
    const colExpr = allowedFields[field] || "COALESCE(u.role, 'user')";

    let rows = [];
    try {
      [rows] = await pool.query(
        `SELECT 
           ${colExpr} AS name,
           COUNT(DISTINCT t.user_id) AS completed,
           (SELECT COUNT(*) FROM profiles WHERE ${colExpr.replace(/u\./g, "")} = ${colExpr}) AS total
         FROM ${table} t
         JOIN profiles u ON u.id = t.user_id
         WHERE t.completed_at BETWEEN ? AND ?
           ${table === "questionnaire_responses" ? "AND t.status = 'completed'" : ""}
         GROUP BY name
         ORDER BY completed DESC`,
        [from, to]
      );
    } catch (e) {
      console.warn("completion-by-demographic query failed:", e.message);
    }

    res.json({ success: true, completionByDemographic: rows });
  } catch (error) {
    console.error("Error fetching completion by demographic:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;