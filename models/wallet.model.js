// models/wallet.model.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['credit', 'debit'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  description: { 
    type: String, 
    required: true 
  },
  parcelId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Parcel' 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  balanceAfter: { 
    type: Number, 
    required: true 
  }
});

const withdrawalSchema = new mongoose.Schema({
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  method: { 
    type: String, 
    enum: ['bkash', 'nagad', 'bank'],
    required: true 
  },
  accountInfo: {
    phoneNumber: String,
    accountNumber: String,
    bankName: String,
    branchName: String,
    accountType: String
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  requestedAt: { 
    type: Date, 
    default: Date.now 
  },
  processedAt: Date,
  adminNotes: String,
  transactionId: String
});

const walletSchema = new mongoose.Schema({
  riderId: { 
    type: String,  // CHANGED FROM ObjectId to String
    required: true,
    unique: true 
  },
  availableBalance: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  totalEarned: { 
    type: Number, 
    default: 0 
  },
  totalWithdrawn: { 
    type: Number, 
    default: 0 
  },
  pendingWithdrawals: [withdrawalSchema],
  transactionHistory: [transactionSchema],
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index for faster queries
walletSchema.index({ riderId: 1 });
walletSchema.index({ 'transactionHistory.timestamp': -1 });

const walletCollections = mongoose.model('Wallet', walletSchema);
module.exports = walletCollections;