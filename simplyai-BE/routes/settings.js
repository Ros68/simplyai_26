import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET /api/settings
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM app_settings ORDER BY created_at DESC LIMIT 1"
    );
    if (rows.length === 0) {
      console.log("⚠️ No app settings found in database");
      return res
        .status(404)
        .json({ success: false, message: "App settings not found" });
    }

    const row = rows[0];

    // Convert tinyint 0/1 booleans to actual JS booleans for frontend
    const boolFields = [
      'enable_registration', 'require_email_verification',
      'send_welcome_email', 'send_completion_email',
      'send_email_in_report', 'send_admin_notification',
      'enable_payments'
    ];
    boolFields.forEach(f => {
      if (row[f] !== undefined) row[f] = row[f] === 1 || row[f] === true;
    });

    console.log("📖 LOADING notification settings from database:");
    console.log("  Welcome Email:", row.send_welcome_email);
    console.log("  Completion Email:", row.send_completion_email);
    console.log("  Email in Report:", row.send_email_in_report);
    console.log("  Admin Notification:", row.send_admin_notification);

    res.json({ success: true, data: row });
  } catch (error) {
    console.error("Error fetching app settings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch app settings" });
  }
});

// get 3 main colors (+ new colors)
router.get("/colorProfiles", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT primary_color, secondary_color, accent_color, frame_bg_color, button_secondary_color FROM app_settings ORDER BY created_at DESC LIMIT 1"
    );
    if (rows.length === 0) {
      console.log("⚠️ No app settings found in database");
      return res
        .status(404)
        .json({ success: false, message: "App settings not found" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Error fetching app settings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch app settings" });
  }
});

// PUT /api/settings
router.put("/", async (req, res) => {
  try {
    const {
      site_name,
      site_description,
      contact_email,
      site_url,
      logo,
      favicon,
      primary_color,
      secondary_color,
      accent_color,
      frame_bg_color,
      button_secondary_color,
      font_family,
      font_size,
      button_style,
      enable_registration,
      require_email_verification,
      max_storage_per_user,
      // Social media links
      social_facebook,
      social_instagram,
      social_tiktok,
      social_linkedin,
      // Notification settings
      send_welcome_email,
      send_completion_email,
      send_email_in_report,
      send_admin_notification,
      // Payment settings
      enable_payments,
      currency,
      vat_percentage,
      stripe_public_key,
      stripe_secret_key,
    } = req.body;

    // Convert booleans to integers for MySQL tinyint storage
    const toInt = (val) => (val === true || val === 1 || val === '1' || val === 'true') ? 1 : 0;

    console.log("📧 NOTIFICATION SETTINGS RECEIVED:");
    console.log("  Welcome Email:", send_welcome_email, "→", toInt(send_welcome_email));
    console.log("  Completion Email:", send_completion_email, "→", toInt(send_completion_email));
    console.log("  Email in Report:", send_email_in_report, "→", toInt(send_email_in_report));
    console.log("  Admin Notification:", send_admin_notification, "→", toInt(send_admin_notification));

    console.log("💳 PAYMENT SETTINGS RECEIVED:");
    console.log("  Enable Payments:", enable_payments, "→", toInt(enable_payments));
    console.log("  Currency:", currency);
    console.log("  VAT Percentage:", vat_percentage);

    const [existing] = await pool.query("SELECT id FROM app_settings LIMIT 1");
    if (existing.length > 0) {
      console.log("✏️ UPDATING existing settings in database...");
      const result = await pool.query(
        `
        UPDATE app_settings SET 
          site_name = ?, site_description = ?, contact_email = ?, site_url = ?,
          logo = ?, favicon = ?, primary_color = ?, secondary_color = ?, accent_color = ?,
          frame_bg_color = ?, button_secondary_color = ?,
          font_family = ?, font_size = ?, button_style = ?, enable_registration = ?,
          require_email_verification = ?, max_storage_per_user = ?,
          social_facebook = ?, social_instagram = ?, social_tiktok = ?, social_linkedin = ?,
          send_welcome_email = ?, send_completion_email = ?, send_email_in_report = ?, send_admin_notification = ?,
          enable_payments = ?, currency = ?, vat_percentage = ?, stripe_public_key = ?, stripe_secret_key = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
        [
          site_name, site_description, contact_email, site_url,
          logo, favicon, primary_color, secondary_color, accent_color,
          frame_bg_color || '#f8f7ff', button_secondary_color || '#6E59A5',
          font_family, font_size, button_style,
          toInt(enable_registration), toInt(require_email_verification), max_storage_per_user,
          social_facebook || null, social_instagram || null, social_tiktok || null, social_linkedin || null,
          toInt(send_welcome_email), toInt(send_completion_email), toInt(send_email_in_report), toInt(send_admin_notification),
          toInt(enable_payments), currency, vat_percentage, stripe_public_key, stripe_secret_key,
          existing[0].id,
        ]
      );
      console.log("✅ UPDATE completed. Affected rows:", result[0].affectedRows);
    } else {
      console.log("➕ INSERTING new settings in database...");
      const result = await pool.query(
        `
        INSERT INTO app_settings (
          site_name, site_description, contact_email, site_url, logo, favicon,
          primary_color, secondary_color, accent_color, frame_bg_color, button_secondary_color,
          font_family, font_size, button_style, enable_registration, require_email_verification, max_storage_per_user,
          social_facebook, social_instagram, social_tiktok, social_linkedin,
          send_welcome_email, send_completion_email, send_email_in_report, send_admin_notification,
          enable_payments, currency, vat_percentage, stripe_public_key, stripe_secret_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          site_name, site_description, contact_email, site_url, logo, favicon,
          primary_color, secondary_color, accent_color, frame_bg_color || '#f8f7ff', button_secondary_color || '#6E59A5',
          font_family, font_size, button_style,
          toInt(enable_registration), toInt(require_email_verification), max_storage_per_user,
          social_facebook || null, social_instagram || null, social_tiktok || null, social_linkedin || null,
          toInt(send_welcome_email), toInt(send_completion_email), toInt(send_email_in_report), toInt(send_admin_notification),
          toInt(enable_payments), currency, vat_percentage, stripe_public_key, stripe_secret_key,
        ]
      );
      console.log("✅ INSERT completed. Insert ID:", result[0].insertId);
    }

    // Verification log
    const [verification] = await pool.query(
      "SELECT send_welcome_email, send_completion_email, send_email_in_report, send_admin_notification, currency, enable_payments, enable_registration, require_email_verification FROM app_settings ORDER BY created_at DESC LIMIT 1"
    );

    if (verification.length > 0) {
      console.log("🔍 VERIFICATION - Current settings in database:");
      console.log("  Welcome Email:", verification[0].send_welcome_email);
      console.log("  Completion Email:", verification[0].send_completion_email);
      console.log("  Email in Report:", verification[0].send_email_in_report);
      console.log("  Admin Notification:", verification[0].send_admin_notification);
      console.log("  Enable Registration:", verification[0].enable_registration);
      console.log("  Require Email Verification:", verification[0].require_email_verification);
      console.log("  Currency:", verification[0].currency);
      console.log("  Enable Payments:", verification[0].enable_payments);
    }

    res.json({ success: true, message: "App settings updated successfully" });
  } catch (error) {
    console.error("Error updating app settings:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update app settings" });
  }
});

export default router;