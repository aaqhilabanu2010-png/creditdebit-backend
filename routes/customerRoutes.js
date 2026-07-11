const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

// @route POST /customers
// @desc Create new customer
// @access Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, phone, details, photo } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide customer name'
      });
    }

    const customer = await Customer.create({
      userId: req.user._id,
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      details: details ? details.trim() : '',
      photo: photo || ''
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route GET /customers
// @desc Get all customers for logged in user (with search)
// @access Private
router.get('/', protect, async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = { 
      userId: req.user._id,
      isDeleted: false
    };

    // Search by name or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Calculate stats for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const transactions = await Transaction.find({
          userId: req.user._id,
          customerId: customer._id
        }).lean();

        let totalReceived = 0;  // credit (money received FROM customer)
        let totalSent = 0;      // debit (money sent TO customer)

        transactions.forEach(t => {
          if (t.type === 'credit') {
            totalReceived += t.amount;
          } else {
            totalSent += t.amount;
          }
        });

        // pendingAmount = how much customer still owes you
        // If totalSent > totalReceived, customer owes you (positive)
        // If totalReceived > totalSent, you owe customer (negative = advance)
        const pendingAmount = totalSent - totalReceived;

        return {
          ...customer,
          photo: customer.photo || '', // Ensure photo is included
          totalReceived,
          totalSent,
          netBalance: totalReceived - totalSent,
          pendingAmount: pendingAmount > 0 ? pendingAmount : 0, // Only show positive pending
          advanceAmount: pendingAmount < 0 ? Math.abs(pendingAmount) : 0, // Show advance separately
          transactionCount: transactions.length
        };
      })
    );

    res.json({
      success: true,
      count: customersWithStats.length,
      customers: customersWithStats
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route GET /customers/:id
// @desc Get single customer with full stats and transactions
// @access Private
router.get('/:id', protect, async (req, res) => {
  try {
    // Allow viewing deleted customers too (for history)
    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.user._id
      // Removed: isDeleted: false
    }).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get all transactions for this customer
    const transactions = await Transaction.find({
      userId: req.user._id,
      customerId: customer._id
    })
    .sort({ date: -1 })
    .lean();

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

    res.json({
      success: true,
      customer: {
        ...customer,
        photo: customer.photo || '', // Ensure photo is included in detail view
        totalReceived,
        totalSent,
        netBalance,
        pendingAmount: pendingAmount > 0 ? pendingAmount : 0,
        advanceAmount: pendingAmount < 0 ? Math.abs(pendingAmount) : 0,
        transactionCount: transactions.length,
        transactions
      }
    });

  } catch (error) {
    console.error('Get customer detail error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route DELETE /customers/:id
// @desc Soft delete customer (keep transactions)
// @access Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.isDeleted = true;
    customer.updatedAt = Date.now();
    await customer.save();

    res.json({
      success: true,
      message: 'Customer deleted successfully. Transaction history preserved.'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;