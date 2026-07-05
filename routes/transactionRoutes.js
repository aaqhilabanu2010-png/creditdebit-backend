const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

// @route POST /transactions
// @desc Create new transaction (now with customerId)
// @access Private
router.post('/', protect, async (req, res) => {
  try {
    const { customerId, type, personName, personPhone, amount, description } = req.body;

    if (!type || !personName || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide type, personName, and amount'
      });
    }

    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be credit or debit'
      });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      customerId: customerId || null,
      type,
      personName,
      personPhone: personPhone || '',
      amount: Number(amount),
      currency: 'INR',
      description: description || '',
      date: new Date(),
      status: 'settled', // Simple: all transactions are settled immediately
      paidAmount: Number(amount)
    });

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      transaction
    });

  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route GET /transactions
// @desc Get all transactions for logged in user (with customer filter)
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const { customerId, type, page = 1, limit = 50 } = req.query;

    let query = { userId: req.user._id };

    if (customerId) {
      query.customerId = customerId;
    }

    if (type && ['credit', 'debit'].includes(type)) {
      query.type = type;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Transaction.countDocuments(query);

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      transactions
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route GET /transactions/:id
// @desc Get single transaction by ID
// @access Private
router.get('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('Get single transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route PUT /transactions/:id
// @desc Update transaction
// @access Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { amount, description } = req.body;

    let transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (amount) transaction.amount = Number(amount);
    if (description !== undefined) transaction.description = description;
    transaction.updatedAt = Date.now();
    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      transaction
    });

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route DELETE /transactions/:id
// @desc Delete transaction
// @access Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await Transaction.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;