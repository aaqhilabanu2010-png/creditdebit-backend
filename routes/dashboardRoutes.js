const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/authMiddleware');

// @route GET /dashboard/summary
// @desc Get global stats: Total Received, Total Sent, Net Balance, Due
// @access Private
router.get('/summary', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id });

    let totalReceived = 0;
    let totalSent = 0;

    transactions.forEach(t => {
      if (t.type === 'credit') {
        totalReceived += t.amount;
      } else {
        totalSent += t.amount;
      }
    });

    const netBalance = totalReceived - totalSent;
    const pendingAmount = totalSent - totalReceived;

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

// @route GET /dashboard/by-month
// @desc Get monthly transaction trends
// @access Private
router.get('/by-month', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id });

    const monthMap = {};

    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthKey,
          totalCredit: 0,
          totalDebit: 0,
          transactionCount: 0
        };
      }

      if (t.type === 'credit') {
        monthMap[monthKey].totalCredit += t.amount;
      } else {
        monthMap[monthKey].totalDebit += t.amount;
      }

      monthMap[monthKey].transactionCount += 1;
    });

    const byMonth = Object.values(monthMap).map(m => ({
      ...m,
      netBalance: m.totalCredit - m.totalDebit
    }));

    byMonth.sort((a, b) => b.month.localeCompare(a.month));

    res.json({
      success: true,
      count: byMonth.length,
      byMonth
    });

  } catch (error) {
    console.error('Dashboard by-month error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;