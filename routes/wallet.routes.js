// routes/wallet.routes.js
const express = require('express');
const walletCollections = require('../models/wallet.model.js');
const verifyFirebaseToken = require('../middlewares/verifyFireBaseToken.js');

const walletRoutes = express.Router();

// Test route without authentication
walletRoutes.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Wallet API is working!',
    timestamp: new Date().toISOString()
  });
});

// Get wallet balance and details
walletRoutes.get('/wallet/balance', verifyFirebaseToken, async (req, res) => {
  try {
    console.log('=== WALLET BALANCE REQUEST ===');
    console.log('User UID:', req.decoded.uid);

    const riderId = req.decoded.uid;

    if (!riderId) {
      return res.status(400).json({
        success: false,
        message: 'Rider ID is required'
      });
    }

    // First, check if wallet exists, if not create one
    let wallet = await walletCollections.findOne({ riderId });

    console.log('Wallet found:', !!wallet);

    if (!wallet) {
      // Create new wallet if doesn't exist
      console.log('Creating new wallet for rider:', riderId);
      wallet = new walletCollections({
        riderId: riderId, // Now using String instead of ObjectId
        availableBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        transactionHistory: [],
        pendingWithdrawals: []
      });
      await wallet.save();
      console.log('New wallet created successfully');
    }

    // Prepare response data
    const responseData = {
      availableBalance: wallet.availableBalance || 0,
      totalEarned: wallet.totalEarned || 0,
      totalWithdrawn: wallet.totalWithdrawn || 0,
      pendingWithdrawals: wallet.pendingWithdrawals || [],
      transactionHistory: (wallet.transactionHistory || []).slice(-20).reverse(),
      lastUpdated: wallet.lastUpdated || new Date()
    };

    console.log('Sending wallet data:', responseData);

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet balance',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update earnings when delivery is completed
walletRoutes.patch('/wallet/update-earnings', verifyFirebaseToken, async (req, res) => {
  try {
    const { amount, parcelId, description } = req.body;
    const riderId = req.decoded.uid;

    console.log('Updating earnings:', { riderId, amount, parcelId });

    if (!amount || !parcelId) {
      return res.status(400).json({
        success: false,
        message: 'Amount and parcel ID are required'
      });
    }

    // Find or create wallet
    let wallet = await walletCollections.findOne({ riderId });
    if (!wallet) {
      wallet = new walletCollections({
        riderId: riderId,
        availableBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        transactionHistory: [],
        pendingWithdrawals: []
      });
    }

    const previousBalance = wallet.availableBalance;
    const newBalance = previousBalance + parseFloat(amount);

    // Add transaction
    const transaction = {
      type: 'credit',
      amount: parseFloat(amount),
      description: description || `Delivery completed for parcel ${parcelId}`,
      parcelId: parcelId,
      timestamp: new Date(),
      balanceAfter: newBalance
    };

    // Update wallet
    wallet.availableBalance = newBalance;
    wallet.totalEarned += parseFloat(amount);
    wallet.transactionHistory.push(transaction);
    wallet.lastUpdated = new Date();

    await wallet.save();

    console.log('Earnings updated successfully');

    res.json({
      success: true,
      message: `Earnings of ৳${amount} added to wallet`,
      data: {
        newBalance: wallet.availableBalance,
        transaction: transaction
      }
    });
  } catch (error) {
    console.error('Error updating earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update earnings',
      error: error.message
    });
  }
});

// Request cash-out
walletRoutes.post('/wallet/cash-out', verifyFirebaseToken, async (req, res) => {
  try {
    const { amount, method, accountInfo } = req.body;
    const riderId = req.decoded.uid;

    console.log('Cash-out request:', { riderId, amount, method });

    if (!amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'Amount and payment method are required'
      });
    }

    // Validate amount
    const cashOutAmount = parseFloat(amount);
    const minAmount = 500;
    const maxAmount = 50000;

    if (cashOutAmount < minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum cash-out amount is ৳${minAmount}`
      });
    }

    if (cashOutAmount > maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Maximum cash-out amount is ৳${maxAmount}`
      });
    }

    // Find wallet
    const wallet = await walletCollections.findOne({ riderId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Check sufficient balance
    if (cashOutAmount > wallet.availableBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Calculate processing fee and net amount
    const processingFee = 10;
    const netAmount = cashOutAmount - processingFee;

    // Create withdrawal request
    const withdrawal = {
      amount: cashOutAmount,
      method: method,
      accountInfo: accountInfo,
      status: 'pending',
      requestedAt: new Date()
    };

    // Add debit transaction for processing fee
    const feeTransaction = {
      type: 'debit',
      amount: processingFee,
      description: `Processing fee for ${method} cash-out`,
      timestamp: new Date(),
      balanceAfter: wallet.availableBalance - processingFee
    };

    // Update wallet
    wallet.availableBalance -= processingFee;
    wallet.pendingWithdrawals.push(withdrawal);
    wallet.transactionHistory.push(feeTransaction);
    wallet.lastUpdated = new Date();

    await wallet.save();

    console.log('Cash-out request submitted successfully');

    res.json({
      success: true,
      message: 'Cash-out request submitted successfully',
      data: {
        withdrawalId: withdrawal._id,
        amount: cashOutAmount,
        processingFee: processingFee,
        netAmount: netAmount,
        estimatedProcessing: '24-48 hours'
      }
    });
  } catch (error) {
    console.error('Error processing cash-out:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process cash-out request',
      error: error.message
    });
  }
});

walletRoutes.post('/wallet/cash-out', verifyFirebaseToken, async (req, res) => {
  try {
    const { amount, method, accountInfo } = req.body;
    const riderId = req.decoded.uid;

    console.log('Cash-out request:', { riderId, amount, method });

    if (!amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'Amount and payment method are required'
      });
    }

    // Validate amount
    const cashOutAmount = parseFloat(amount);
    const minAmount = 500;
    const maxAmount = 50000;

    if (cashOutAmount < minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum cash-out amount is ৳${minAmount}`
      });
    }

    if (cashOutAmount > maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Maximum cash-out amount is ৳${maxAmount}`
      });
    }

    // Find wallet
    const wallet = await walletCollections.findOne({ riderId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Check sufficient balance
    if (cashOutAmount > wallet.availableBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Calculate processing fee and net amount
    const processingFee = 10;
    const netAmount = cashOutAmount - processingFee;

    // Create withdrawal request
    const withdrawal = {
      amount: cashOutAmount,
      method: method,
      accountInfo: accountInfo,
      status: 'pending',
      requestedAt: new Date()
    };

    // Add debit transaction for processing fee
    const feeTransaction = {
      type: 'debit',
      amount: processingFee,
      description: `Processing fee for ${method} cash-out`,
      timestamp: new Date(),
      balanceAfter: wallet.availableBalance - processingFee
    };

    // Update wallet - DEDUCT PROCESSING FEE IMMEDIATELY
    wallet.availableBalance -= processingFee;
    wallet.totalWithdrawn += cashOutAmount; // Track total withdrawn amount
    wallet.pendingWithdrawals.push(withdrawal);
    wallet.transactionHistory.push(feeTransaction);
    wallet.lastUpdated = new Date();

    await wallet.save();

    console.log('Cash-out request submitted successfully');

    res.json({
      success: true,
      message: 'Cash-out request submitted successfully',
      data: {
        withdrawalId: withdrawal._id,
        amount: cashOutAmount,
        processingFee: processingFee,
        netAmount: netAmount,
        estimatedProcessing: '24-48 hours',
        newBalance: wallet.availableBalance
      }
    });
  } catch (error) {
    console.error('Error processing cash-out:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process cash-out request',
      error: error.message
    });
  }
});

module.exports = walletRoutes;