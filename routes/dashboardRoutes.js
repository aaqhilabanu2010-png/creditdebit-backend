const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/authMiddleware');

// @route GET /dashboard/summary
// @desc Get global stats: Total Received, Net Balance, Pending
// @access Private
router.get('/summary', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id });

    let totalReceived = 0;  // credit (money received from all customers)
    let totalSent = 0;      // debit (money given to all customers)

    transactions.forEach(t => {
      if (t.type === 'credit') {
        totalReceived += t.amount;
      } else {
        totalSent += t.amount;
      }
    });

    const netBalance = totalReceived - totalSent;
    const pendingAmount = totalSent - totalReceived; // how much we're owed

    // Count active customers
    const customerCount = await Customer.countDocuments({
      userId: req.user._id,
      isDeleted: false
    });

    res.json({
      success: true,
      summary: {
        totalReceived,
        totalSent,
        netBalance,
        pendingAmount,
        totalTransactions: transactions.length,
        customerCount
      }
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;