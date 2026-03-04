// routes/orders.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { protect, restrictTo } = require('../middleware/auth');

// Owner creates order (improved version with validation)
router.post('/', protect, restrictTo('owner'), async (req, res) => {
  const { supplier_id, items } = req.body; // items = [{product_id, quantity}]

  // Basic input validation
  if (!supplier_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'supplier_id and non-empty items array are required' });
  }

  try {
    // Start transaction (recommended for multi-query operations)
    await pool.query('START TRANSACTION');

    const [orderResult] = await pool.query(
      'INSERT INTO purchase_orders (owner_id, supplier_id) VALUES (?, ?)',
      [req.user.user_id, supplier_id]
    );

    const orderId = orderResult.insertId;

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw new Error('Each item must have valid product_id and quantity > 0');
      }

      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)',
        [orderId, item.product_id, item.quantity]
      );
      // Your DB trigger reduce_stock_after_order will run automatically
    }

    // Optional: fetch the created order for response
    const [createdOrder] = await pool.query(
      'SELECT * FROM purchase_orders WHERE order_id = ?',
      [orderId]
    );

    // Commit transaction if everything succeeded
    await pool.query('COMMIT');

    res.status(201).json({
      order_id: orderId,
      message: 'Order created successfully',
      order: createdOrder[0]
    });
  } catch (err) {
    // Rollback on error
    await pool.query('ROLLBACK').catch(() => {}); // ignore rollback errors

    console.error('Order creation error:', err);
    res.status(500).json({
      message: 'Server error while creating order',
      error: err.message
    });
  }
});

// Supplier sees incoming orders
router.get('/incoming', protect, restrictTo('supplier'), async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT po.*, u.name AS store_name
       FROM purchase_orders po
       JOIN users u ON po.owner_id = u.user_id
       JOIN suppliers s ON po.supplier_id = s.supplier_id
       WHERE s.user_id = ?`,
      [req.user.user_id]
    );
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Supplier update order status
router.patch('/:id/status', protect, restrictTo('supplier'), async (req, res) => {
  const { status } = req.body;

  // Optional: validate allowed statuses
  const allowedStatuses = ['pending', 'confirmed', 'delivered', 'cancelled'];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
  }

  try {
    const [result] = await pool.query(
      'UPDATE purchase_orders SET order_status = ? WHERE order_id = ?',
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found or not yours' });
    }

    res.json({ message: `Order updated to ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;