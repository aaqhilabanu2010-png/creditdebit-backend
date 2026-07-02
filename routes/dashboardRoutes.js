const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /dashboard/summary
// @desc    Get total credit, debit, and net balance
// @access  Private
router.get('/summary', protect, async (req, res) => {
    try {
        // Get all transactions for user
        const transactions = await Transaction.find({ userId: req.user._id });

        // Calculate totals
        let totalCredit = 0;
        let totalDebit = 0;
        let pendingCredit = 0;
        let pendingDebit = 0;

        transactions.forEach(t => {
            if (t.type === 'credit') {
                totalCredit += t.amount;
                if (t.status === 'pending') {
                    pendingCredit += (t.amount - t.paidAmount);
                }
            } else {
                totalDebit += t.amount;
                if (t.status === 'pending') {
                    pendingDebit += (t.amount - t.paidAmount);
                }
            }
        });

        const netBalance = totalCredit - totalDebit;
        const pendingNet = pendingCredit - pendingDebit;

        res.json({
            success: true,
            summary: {
                totalCredit,
                totalDebit,
                netBalance,
                pendingCredit,
                pendingDebit,
                pendingNet,
                totalTransactions: transactions.length
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

// @route   GET /dashboard/by-person
// @desc    Get transactions grouped by person
// @access  Private
router.get('/by-person', protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id });

        // Group by person
        const personMap = {};

        transactions.forEach(t => {
            const name = t.personName;
            
            if (!personMap[name]) {
                personMap[name] = {
                    personName: name,
                    personPhone: t.personPhone,
                    totalCredit: 0,
                    totalDebit: 0,
                    pendingCredit: 0,
                    pendingDebit: 0,
                    transactionCount: 0
                };
            }

            if (t.type === 'credit') {
                personMap[name].totalCredit += t.amount;
                if (t.status === 'pending') {
                    personMap[name].pendingCredit += (t.amount - t.paidAmount);
                }
            } else {
                personMap[name].totalDebit += t.amount;
                if (t.status === 'pending') {
                    personMap[name].pendingDebit += (t.amount - t.paidAmount);
                }
            }

            personMap[name].transactionCount += 1;
        });

        // Convert to array and calculate net
        const byPerson = Object.values(personMap).map(p => ({
            ...p,
            netBalance: p.totalCredit - p.totalDebit,
            pendingNet: p.pendingCredit - p.pendingDebit
        }));

        // Sort by highest net balance first
        byPerson.sort((a, b) => b.netBalance - a.netBalance);

        res.json({
            success: true,
            count: byPerson.length,
            byPerson
        });

    } catch (error) {
        console.error('Dashboard by-person error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /dashboard/by-month
// @desc    Get monthly transaction trends
// @access  Private
router.get('/by-month', protect, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id });

        // Group by month
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

        // Convert to array and calculate net
        const byMonth = Object.values(monthMap).map(m => ({
            ...m,
            netBalance: m.totalCredit - m.totalDebit
        }));

        // Sort by month (newest first)
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

// @route   GET /dashboard/overdue
// @desc    Get overdue transactions (past due date and still pending)
// @access  Private
router.get('/overdue', protect, async (req, res) => {
    try {
        const today = new Date();
        
        const overdueTransactions = await Transaction.find({
            userId: req.user._id,
            status: { $in: ['pending', 'partially_paid'] },
            dueDate: { $lt: today, $ne: null }
        }).sort({ dueDate: 1 }).lean();

        // Calculate total overdue amounts
        let totalOverdueCredit = 0;
        let totalOverdueDebit = 0;

        overdueTransactions.forEach(t => {
            const remaining = t.amount - t.paidAmount;
            if (t.type === 'credit') {
                totalOverdueCredit += remaining;
            } else {
                totalOverdueDebit += remaining;
            }
        });

        res.json({
            success: true,
            count: overdueTransactions.length,
            totalOverdueCredit,
            totalOverdueDebit,
            netOverdue: totalOverdueCredit - totalOverdueDebit,
            overdueTransactions
        });

    } catch (error) {
        console.error('Dashboard overdue error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});





module.exports = router;