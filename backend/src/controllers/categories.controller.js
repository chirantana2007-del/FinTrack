const pool = require("../config/db");

const CATEGORY_TYPES = ["income", "expense"];

// Visible categories = global defaults (user_id NULL) + this user's own.
const listCategories = async (req, res) => {
    const [categories] = await pool.execute(
        `SELECT category_id, user_id, parent_category_id, name, type, icon
         FROM Categories
         WHERE user_id IS NULL OR user_id = ?
         ORDER BY type, parent_category_id IS NOT NULL, name`,
        [req.user.id]
    );
    return res.json({ categories });
};

const createCategory = async (req, res) => {
    const { name, type, parent_category_id: parentCategoryId, icon } = req.body;

    if (!name || !type) {
        return res.status(400).json({ message: "name and type are required" });
    }
    if (!CATEGORY_TYPES.includes(type)) {
        return res.status(400).json({ message: `type must be one of: ${CATEGORY_TYPES.join(", ")}` });
    }

    if (parentCategoryId) {
        const [parent] = await pool.execute(
            "SELECT category_id FROM Categories WHERE category_id = ? AND (user_id IS NULL OR user_id = ?)",
            [parentCategoryId, req.user.id]
        );
        if (parent.length === 0) {
            return res.status(400).json({ message: "parent_category_id does not exist or is not visible to you" });
        }
    }

    // The UNIQUE KEY on (user_id, parent_category_id, name) never catches this
    // for top-level categories: MySQL unique indexes never treat two NULLs as
    // equal, and parent_category_id is NULL for every top-level category. A
    // NULL-safe (<=>) pre-check here is what actually enforces "one category
    // per name per scope" in the common case.
    const [duplicates] = await pool.execute(
        "SELECT category_id FROM Categories WHERE user_id = ? AND parent_category_id <=> ? AND name = ?",
        [req.user.id, parentCategoryId || null, name]
    );
    if (duplicates.length > 0) {
        return res.status(409).json({ message: "You already have a category with this name in this scope" });
    }

    const [result] = await pool.execute(
        "INSERT INTO Categories (user_id, parent_category_id, name, type, icon) VALUES (?, ?, ?, ?, ?)",
        [req.user.id, parentCategoryId || null, name, type, icon || null]
    );
    return res.status(201).json({
        message: "Category created",
        category: { category_id: result.insertId, name, type, parent_category_id: parentCategoryId || null }
    });
};

// Global (user_id IS NULL) categories are read-only to regular users — only
// a category this user owns can be edited or removed.
const updateCategory = async (req, res) => {
    const { name, type, icon } = req.body;

    if (type && !CATEGORY_TYPES.includes(type)) {
        return res.status(400).json({ message: `type must be one of: ${CATEGORY_TYPES.join(", ")}` });
    }

    const [existing] = await pool.execute(
        "SELECT category_id FROM Categories WHERE category_id = ? AND user_id = ?",
        [req.params.id, req.user.id]
    );
    if (existing.length === 0) {
        return res.status(404).json({ message: "Category not found or not editable (global categories can't be modified)" });
    }

    await pool.execute(
        `UPDATE Categories SET
           name = COALESCE(?, name),
           type = COALESCE(?, type),
           icon = COALESCE(?, icon)
         WHERE category_id = ?`,
        [name ?? null, type ?? null, icon ?? null, req.params.id]
    );

    return res.json({ message: "Category updated" });
};

const deleteCategory = async (req, res) => {
    const [result] = await pool.execute(
        "DELETE FROM Categories WHERE category_id = ? AND user_id = ?",
        [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Category not found or not deletable (global categories can't be removed)" });
    }
    return res.json({ message: "Category deleted" });
};

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
