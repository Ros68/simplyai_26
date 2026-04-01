/**
 * scheduler.js
 * Automatic reminder scheduler — runs every hour and checks which users
 * need questionnaire reminder notifications based on plan settings.
 *
 * How it works:
 * 1. Every hour: find all active subscriptions
 * 2. For each subscription: get plan reminders config
 * 3. For each reminder: check if user has incomplete questionnaires
 * 4. If yes and reminder timing matches: send email (+ SMS/WhatsApp placeholder)
 * 5. Log sent reminders to avoid duplicates
 */

import { pool } from "./db.js";
import { sendDeadlineReminderEmail } from "./services/emailService.js";

// ── Main scheduler function ────────────────────────────────────────────────
export const startReminderScheduler = () => {
  console.log("⏰ Reminder scheduler started — checking every hour");

  // Run immediately on startup, then every hour
  runReminderCheck();
  setInterval(runReminderCheck, 60 * 60 * 1000); // every 1 hour
};

// ── Core check logic ───────────────────────────────────────────────────────
const runReminderCheck = async () => {
  console.log("🔍 Running reminder check at:", new Date().toISOString());

  try {
    // 1. Get all active subscriptions with plan options and user info
    const [subscriptions] = await pool.query(`
      SELECT 
        us.id as subscription_id,
        us.user_id,
        us.plan_id,
        us.started_at,
        sp.name as plan_name,
        sp.options as plan_options,
        sp.\`interval\` as plan_interval,
        sp.is_free as is_free,
        p.email,
        p.first_name,
        p.last_name,
        p.phone,
        p.role
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      JOIN profiles p ON us.user_id = p.id
      WHERE us.status = 'active'
    `);

    console.log(`📋 Found ${subscriptions.length} active subscriptions`);

    for (const sub of subscriptions) {
      await processSubscriptionReminders(sub);
    }

    console.log("✅ Reminder check complete");
  } catch (error) {
    console.error("❌ Reminder check failed:", error.message);
  }
};

// ── Process reminders for a single subscription ────────────────────────────
const processSubscriptionReminders = async (sub) => {
  try {
    // Skip admin users
    if (sub.role === 'admin') return;

    // Skip free plans — no expiry date means no expiry-based reminders
    if (sub.is_free) return;

    // Parse plan options
    const planOptions =
      typeof sub.plan_options === "string"
        ? JSON.parse(sub.plan_options || "{}")
        : sub.plan_options || {};

    // Check if email notifications are enabled
    if (!planOptions.emailNotifications && !planOptions.smsNotifications && !planOptions.whatsappNotifications) {
      return; // No notifications enabled for this plan
    }

    const reminders = planOptions.reminders?.length > 0
      ? planOptions.reminders
      : planOptions.reminderMessage
        ? [{
            id: 'default',
            daysBefore: planOptions.reminderDaysBefore || 7,
            frequency: planOptions.reminderFrequency || 'once',
            message: planOptions.reminderMessage,
          }]
        : [];

    if (reminders.length === 0) return;

    // 2. Get questionnaire stats for this user/subscription
    const [questionnaireStats] = await pool.query(
      `
      SELECT 
        COUNT(pq.questionnaire_id) as total,
        COUNT(qr.id) as completed
      FROM plan_questionnaires pq
      LEFT JOIN questionnaire_responses qr 
        ON qr.questionnaire_id = pq.questionnaire_id 
        AND qr.user_id = ?
        AND qr.subscription_id = ?
        AND qr.status = 'completed'
      WHERE pq.plan_id = ?
    `,
      [sub.user_id, sub.subscription_id, sub.plan_id]
    );

    const total = parseInt(questionnaireStats[0]?.total || 0);
    const completed = parseInt(questionnaireStats[0]?.completed || 0);
    const remaining = total - completed;

    // If all questionnaires completed, no reminder needed
    if (remaining <= 0) return;

    // 3. Process each reminder
    for (const reminder of reminders) {
      await processReminder(sub, reminder, total, completed, remaining, planOptions);
    }
  } catch (error) {
    console.error(
      `❌ Error processing reminders for subscription ${sub.subscription_id}:`,
      error.message
    );
  }
};

// ── Process a single reminder ──────────────────────────────────────────────
const processReminder = async (sub, reminder, total, completed, remaining, planOptions) => {
  try {
    const now = new Date();
    const startedAt = new Date(sub.started_at);

    // Calculate expiry date based on plan interval
    const expiryDate = new Date(startedAt);
    const interval = (sub.plan_interval || 'monthly').toLowerCase();
    if (interval === 'yearly' || interval === 'annual') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      // Default: monthly
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    // Calculate reminder date: expiry - daysBefore
    const daysBefore = reminder.daysBefore || planOptions.reminderDaysBefore || 7;
    const reminderDate = new Date(expiryDate);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);

    console.log(`📅 User: ${sub.email} | Started: ${startedAt.toDateString()} | Expiry: ${expiryDate.toDateString()} | Reminder date: ${reminderDate.toDateString()} | Now: ${now.toDateString()}`);

    // Check if reminder date has passed
    if (now < reminderDate) {
      console.log(`⏳ Too early for reminder — will send on ${reminderDate.toDateString()}`);
      return;
    }

    // Check if subscription already expired
    if (now > expiryDate) {
      console.log(`⚠️ Subscription expired for ${sub.email} — skipping`);
      return;
    }
    // Check if we already sent this reminder recently (avoid duplicates)
    const alreadySent = await checkReminderAlreadySent(
      sub.user_id,
      sub.subscription_id,
      reminder.id,
      reminder.frequency
    );

    if (alreadySent) return;

    console.log(
      `📧 Sending reminder to ${sub.email} for plan ${sub.plan_name}`
    );

    // 4. Send email notification
    if (planOptions.emailNotifications) {
      await sendDeadlineReminderEmail({
        email: sub.email,
        firstName: sub.first_name,
        lastName: sub.last_name,
        fullName: `${sub.first_name || ""} ${sub.last_name || ""}`.trim(),
        planName: sub.plan_name,
        totalQuestionnaires: total,
        completedQuestionnaires: completed,
        remainingQuestionnaires: remaining,
        customMessage: reminder.message,
      });
    }

    // 5. SMS notification placeholder
    if (planOptions.smsNotifications && sub.phone) {
      console.log(`📱 SMS reminder would be sent to ${sub.phone} (not implemented yet)`);
      // TODO: Integrate Twilio or similar SMS provider
    }

    // 6. WhatsApp notification placeholder
    if (planOptions.whatsappNotifications && sub.phone) {
      console.log(`💬 WhatsApp reminder would be sent to ${sub.phone} (not implemented yet)`);
      // TODO: Integrate WhatsApp Business API
    }

    // 7. Log that reminder was sent
    await logReminderSent(sub.user_id, sub.subscription_id, reminder.id);

    console.log(`✅ Reminder sent to ${sub.email}`);
  } catch (error) {
    console.error(`❌ Error sending reminder:`, error.message);
  }
};

// ── Check if reminder was already sent ────────────────────────────────────
const checkReminderAlreadySent = async (userId, subscriptionId, reminderId, frequency) => {
  try {
    // Ensure reminder_logs table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reminder_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id VARCHAR(36) NOT NULL,
        subscription_id VARCHAR(36) NOT NULL,
        reminder_id VARCHAR(255) NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_reminder_lookup (user_id, subscription_id, reminder_id)
      )
    `);

    const [rows] = await pool.query(
      `SELECT sent_at FROM reminder_logs 
       WHERE user_id = ? AND subscription_id = ? AND reminder_id = ?
       ORDER BY sent_at DESC LIMIT 1`,
      [userId, subscriptionId, reminderId]
    );

    if (rows.length === 0) return false;

    const lastSent = new Date(rows[0].sent_at);
    const now = new Date();
    const hoursSinceSent = (now - lastSent) / (1000 * 60 * 60);

    // Based on frequency, check if enough time has passed
    switch (frequency) {
      case "daily":
        return hoursSinceSent < 24;
      case "weekly":
        return hoursSinceSent < 24 * 7;
      case "once":
      default:
        return true; // Already sent once, never send again
    }
  } catch (error) {
    console.error("❌ Error checking reminder log:", error.message);
    return false;
  }
};

// ── Log that reminder was sent ─────────────────────────────────────────────
const logReminderSent = async (userId, subscriptionId, reminderId) => {
  try {
    await pool.query(
      `INSERT INTO reminder_logs (user_id, subscription_id, reminder_id) VALUES (?, ?, ?)`,
      [userId, subscriptionId, reminderId]
    );
  } catch (error) {
    console.error("❌ Error logging reminder:", error.message);
  }
};