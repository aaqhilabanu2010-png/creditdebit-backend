const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  personName: {
    type: String,
    required: true,
    trim: true
  },
  personPhone: {
    type: String,
    trim: true,
    default: ''
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'partially_paid', 'settled'],
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);