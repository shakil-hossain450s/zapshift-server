const express = require('express');
const riderRoutes = express.Router();
const RidersCollections = require('../models/rider.model');
const UsersCollections = require('../models/user.model');
const verifyFirebaseToken = require('../middlewares/verifyFireBaseToken');
const verifyAdmin = require('../middlewares/verifyAdmin');

// get pending riders
riderRoutes.get('/pendingRiders', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const query = {
      status: 'pending'
    }
    const pendingRiders = await RidersCollections.find(query).lean();
    res.status(200).json({
      success: true,
      pendingRiders
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
});

// get all active riders
riderRoutes.get('/activeRiders', verifyFirebaseToken, async (req, res) => {
  try {
    const query = {
      status: 'approved'
    }
    const activeRiders = await RidersCollections.find(query).lean();
    res.status(200).json({
      success: true,
      activeRiders
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
});

// Get riders by district (used in Assign Rider modal)
riderRoutes.get('/riders', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const { district } = req.query;
    console.log('Requested district:', district);

    if (!district) {
      return res.status(400).json({
        success: false,
        message: 'District parameter is required'
      });
    }

    // Case-insensitive district search
    const riders = await RidersCollections.find({
      district: { $regex: new RegExp(`^${district}$`, 'i') },
      status: 'approved'
    }).select('name email phone bikeRegNo district currentDelivery status').lean();

    console.log(`Found ${riders.length} riders in district: ${district}`);

    res.status(200).json({
      success: true,
      riders: riders,
      count: riders.length
    });
  } catch (err) {
    console.error('Error fetching riders:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// create a rider data
riderRoutes.post('/rider', async (req, res) => {
  try {
    const riderData = req.body;

    const result = await RidersCollections.create(riderData);
    res.status(201).json({
      success: true,
      result
    })
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
});

// update rider status
riderRoutes.patch('/rider/:riderId/status', verifyFirebaseToken, verifyAdmin, async (req, res) => {
  try {
    const _id = req.params.riderId;
    const { status } = req.body;

    const { email: userEmail } = req.body;

    const result = await RidersCollections.findByIdAndUpdate(
      _id,
      { $set: { status: status } }
    );

    if (status === 'approved') {
      const userQuery = { email: userEmail };
      const updatedUserDoc = {
        $set: { role: 'rider' }
      }

      const roleResult = await UsersCollections.findOneAndUpdate(
        userQuery,
        updatedUserDoc
      )

      console.log('role result', roleResult)
    }

    res.status(200).json({
      success: true,
      result
    })

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `Could not update the rider status: ${err.message}`
    })
  }
});

module.exports = riderRoutes;