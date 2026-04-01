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

export default router;