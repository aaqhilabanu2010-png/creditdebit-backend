const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res) => {
    try {
        const { type, personName, personPhone, amount, currency, description, date, dueDate, category } = req.body;

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
            type,
            personName,
            personPhone: personPhone || '',
            amount: Number(amount),
            currency: currency || 'USD',
            description: description || '',
            date: date ? new Date(date) : new Date(),
            dueDate: dueDate ? new Date(dueDate) : null,
            category: category || ''
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



// @route   GET /transactions
// @desc    Get all transactions for logged in user with pagination
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { type, status, sortBy, page = 1, limit = 10 } = req.query;
        
        // Build query
        let query = { userId: req.user._id };
        
        // Filter by type if provided
        if (type && ['credit', 'debit'].includes(type)) {
            query.type = type;
        }
        
        // Filter by status if provided
        if (status && ['pending', 'partially_paid', 'settled'].includes(status)) {
            query.status = status;
        }
        
        // Sort options
        let sortOption = {};
        if (sortBy === 'amount_asc') sortOption.amount = 1;
        else if (sortBy === 'amount_desc') sortOption.amount = -1;
        else if (sortBy === 'date_asc') sortOption.date = 1;
        else sortOption.date = -1; // Default: newest first
        
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        // Get total count
        const total = await Transaction.countDocuments(query);
        
        // Get transactions
        const transactions = await Transaction.find(query)
            .sort(sortOption)
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

// @route   GET /transactions/:id
// @desc    Get single transaction by ID
// @access  Private
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

// @route   PUT /transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const { personName, personPhone, amount, currency, description, date, dueDate, status, paidAmount, category } = req.body;

        // Find transaction
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

        // Update fields if provided
        if (personName) transaction.personName = personName;
        if (personPhone !== undefined) transaction.personPhone = personPhone;
        if (amount) transaction.amount = Number(amount);
        if (currency) transaction.currency = currency;
        if (description !== undefined) transaction.description = description;
        if (date) transaction.date = new Date(date);
        if (dueDate !== undefined) transaction.dueDate = dueDate ? new Date(dueDate) : null;
        if (status && ['pending', 'partially_paid', 'settled'].includes(status)) transaction.status = status;
        if (paidAmount !== undefined) transaction.paidAmount = Number(paidAmount);
        if (category !== undefined) transaction.category = category;

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


// @route   DELETE /transactions/:id
// @desc    Delete transaction
// @access  Private
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