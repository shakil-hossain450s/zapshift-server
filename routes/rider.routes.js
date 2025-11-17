const express = require('express');
const riderRoutes = express.Router();
const RidersCollections = require('../models/rider.model');
const UsersCollections = require('../models/user.model');

// get pending riders
riderRoutes.get('/pendingRiders', async (req, res) => {
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
riderRoutes.get('/activeRiders', async (req, res) => {
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
riderRoutes.patch('/rider/:riderId/status', async (req, res) => {
  try {
    const _id = req.params.riderId;
    const { status } = req.body;

    const { email: userEmail } = req.body;

    // return console.log(userEmail);

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
})


module.exports = riderRoutes;