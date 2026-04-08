import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// GET all pages (for navbar/menu)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, title, menu_title as menuTitle, in_main_menu as inMainMenu, sort_order as `order`, is_active FROM pages WHERE is_active = TRUE ORDER BY sort_order ASC"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// GET single page content
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT id, title, menu_title as menuTitle, content, in_main_menu as inMainMenu, sort_order as `order` FROM pages WHERE id = ? AND is_active = TRUE", 
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Page not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// POST create new page
router.post("/", async (req, res) => {
  const { id, title, menuTitle, content, inMainMenu, order } = req.body;
  try {
    await pool.query(
      "INSERT INTO pages (id, title, menu_title, content, in_main_menu, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)",
      [id, title, menuTitle || title, content || "", inMainMenu !== false, order || 0]
    );
    res.json({ success: true, message: "Page created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update page (content + metadata)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, menuTitle, content, inMainMenu, order } = req.body;
  
  try {
    // Check if page exists
    const [existing] = await pool.query("SELECT id FROM pages WHERE id = ?", [id]);
    
    if (existing.length > 0) {
      // Update existing
      await pool.query(
        "UPDATE pages SET title = ?, menu_title = ?, content = ?, in_main_menu = ?, sort_order = ? WHERE id = ?",
        [title, menuTitle || title, content, inMainMenu !== false, order || 0, id]
      );
    } else {
      // Insert new
      await pool.query(
        "INSERT INTO pages (id, title, menu_title, content, in_main_menu, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)",
        [id, title, menuTitle || title, content || "", inMainMenu !== false, order || 0]
      );
    }
    
    res.json({ success: true, message: "Page saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE page (soft delete)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE pages SET is_active = FALSE WHERE id = ?", [id]);
    res.json({ success: true, message: "Page deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ✅ POST /api/pages/contact-form — Contact form submission
router.post("/contact-form", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Nome, email e messaggio sono obbligatori" });
    }
    try {
      const [settings] = await pool.query("SELECT contact_email FROM app_settings ORDER BY created_at DESC LIMIT 1");
      const adminEmail = settings.length > 0 ? settings[0].contact_email : null;
      const gmailEmail = process.env.GMAIL_EMAIL;
      const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
      if (adminEmail && gmailEmail && gmailPass) {
        const nodemailer = (await import("nodemailer")).default;
        const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: gmailEmail, pass: gmailPass } });
        await transporter.sendMail({
          from: `"${name}" <${gmailEmail}>`, to: adminEmail, replyTo: email,
          subject: subject || `Nuovo messaggio da ${name}`,
          html: `<h2>Nuovo messaggio dal sito</h2><p><strong>Nome:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Oggetto:</strong> ${subject || "—"}</p><p><strong>Messaggio:</strong></p><p style="white-space:pre-wrap;">${message}</p>`,
        });
        console.log("✅ Contact form email sent to:", adminEmail);
      }
    } catch (emailErr) { console.error("Contact email error:", emailErr.message); }
    try {
      await pool.query("INSERT INTO contact_submissions (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, NOW())", [name, email, subject || null, message]);
    } catch (dbErr) { console.warn("contact_submissions table not found"); }
    res.json({ success: true, message: "Messaggio inviato con successo" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ GET /api/pages/contact-info — Frontend ke liye contact info fetch
router.get("/contact-info", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT content FROM pages WHERE id = 'contact' AND is_active = TRUE");
    if (rows.length === 0) {
      return res.json({ success: true, data: {"email": "info@simolyai.com", "phone": "+39 123 456 7890", "address": "Via Roma 123, 00100 Roma, Italy", "formHeading": "Inviaci un messaggio", "successMsg": "Messaggio inviato con successo! Ti risponderemo al più presto."} });
    }
    try {
      const parsed = JSON.parse(rows[0].content);
      res.json({ success: true, data: parsed });
    } catch {
      // Content HTML hai ya invalid — default return karo
      res.json({ success: true, data: {"email": "info@simolyai.com", "phone": "+39 123 456 7890", "address": "Via Roma 123, 00100 Roma, Italy", "formHeading": "Inviaci un messaggio", "successMsg": "Messaggio inviato con successo! Ti risponderemo al più presto."} });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ PUT /api/pages/contact-info — Admin se contact info save karo (JSON format)
router.put("/contact-info", async (req, res) => {
  try {
    const { email, phone, address, formHeading, successMsg } = req.body;
    const contactData = JSON.stringify({ email, phone, address, formHeading, successMsg });
    const [existing] = await pool.query("SELECT id FROM pages WHERE id = 'contact'");
    if (existing.length > 0) {
      await pool.query("UPDATE pages SET content = ? WHERE id = 'contact'", [contactData]);
    } else {
      await pool.query(
        "INSERT INTO pages (id, title, menu_title, content, in_main_menu, sort_order, is_active) VALUES ('contact', 'Contatti', 'Contatti', ?, TRUE, 4, TRUE)",
        [contactData]
      );
    }
    res.json({ success: true, message: "Contact info saved" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ POST /api/pages/seed-contact — Ek baar chalao to default contact info DB mein aa jaye
router.post("/seed-contact", async (req, res) => {
  try {
    const defaultData = {"email": "info@simolyai.com", "phone": "+39 123 456 7890", "address": "Via Roma 123, 00100 Roma, Italy", "formHeading": "Inviaci un messaggio", "successMsg": "Messaggio inviato con successo! Ti risponderemo al più presto."};
    const [existing] = await pool.query("SELECT id, content FROM pages WHERE id = 'contact'");
    if (existing.length > 0) {
      // Sirf tab update karo jab content JSON nahi hai
      let isJson = false;
      try { JSON.parse(existing[0].content); isJson = true; } catch {}
      if (!isJson) {
        await pool.query("UPDATE pages SET content = ? WHERE id = 'contact'", [JSON.stringify(defaultData)]);
        return res.json({ success: true, message: "Contact page seeded with default JSON" });
      }
      return res.json({ success: true, message: "Contact page already has JSON content — no change" });
    } else {
      await pool.query(
        "INSERT INTO pages (id, title, menu_title, content, in_main_menu, sort_order, is_active) VALUES ('contact', 'Contatti', 'Contatti', ?, TRUE, 4, TRUE)",
        [JSON.stringify(defaultData)]
      );
      res.json({ success: true, message: "Contact page created with default JSON" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;