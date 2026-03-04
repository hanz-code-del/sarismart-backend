// routes/products.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { protect, restrictTo } = require('../middleware/auth');

// Get my products (supplier only)
router.get('/', protect, restrictTo('supplier'), async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.*, s.name AS supplier_name
       FROM products p
       JOIN suppliers s ON p.supplier_id = s.supplier_id
       WHERE s.user_id = ?`,
      [req.user.user_id]
    );
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add product (supplier)
router.post('/', protect, restrictTo('supplier'), async (req, res) => {
  const { name, price, cost, stock } = req.body;

  try {
    const [sup] = await pool.query('SELECT supplier_id FROM suppliers WHERE user_id = ?', [req.user.user_id]);
    if (sup.length === 0) return res.status(403).json({ message: 'No supplier profile' });

    const supplierId = sup[0].supplier_id;

    const [result] = await pool.query(
      'INSERT INTO products (supplier_id, name, price, cost, stock) VALUES (?, ?, ?, ?, ?)',
      [supplierId, name, price, cost || price, stock || 0]
    );

    res.status(201).json({ product_id: result.insertId, name, price, stock });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;