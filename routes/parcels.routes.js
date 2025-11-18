const express = require('express');
const parcelRoutes = express.Router();
const ParcelsCollections = require('../models/parcel.model');
const RidersCollections = require('../models/rider.model'); // IMPORT ADDED
const mongoose = require('mongoose');
const verifyFireBaseToken = require('../middlewares/verifyFireBaseToken');
const verifyAdmin = require('../middlewares/verifyAdmin');

// 1. Admin: Get parcels eligible for assignment
parcelRoutes.get('/admin/parcels', verifyFireBaseToken, verifyAdmin, async (req, res) => {
  try {
    const { parcelStatus, paymentStatus, deliveryStatus } = req.query;
    const query = {};

    if (parcelStatus) query.parcelStatus = parcelStatus;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (deliveryStatus) query.deliveryStatus = deliveryStatus;

    const parcels = await ParcelsCollections.find(query).sort({ createdAt: 1 }).lean();
    res.status(200).json({ success: true, parcels, count: parcels.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// get parcel data by specific user email
parcelRoutes.get('/parcels', verifyFireBaseToken, async (req, res) => {
  try {
    const userEmail = req.query.email;

    console.log(req.decoded.email);

    if (req.decoded.email !== userEmail) {
      return res.status(403).json({
        message: 'Forbidden Access'
      })
    }

    const query = userEmail ? { createdBy: userEmail } : {};

    const parcels = await ParcelsCollections
      .find(query)
      .sort({ createdAt: -1 }).lean();

    if (userEmail && parcels.length === 0) {
      return res.status(404).json({
        success: false,
        parcels: [],
        message: `No parcel found for ${userEmail}`
      })
    }

    res.status(200).json({
      success: true,
      count: parcels.length,
      parcels
    })

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `Error reading storage: ${err}`
    })
  }
});

// get a single parcel data from DB
parcelRoutes.get('/parcel/:parcelId', verifyFireBaseToken, async (req, res) => {
  try {
    const { parcelId } = req.params;

    // mongoose id validation
    if (!mongoose.Types.ObjectId.isValid(parcelId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parcel ID'
      })
    }

    // get the parcel data
    const parcel = await ParcelsCollections.findById(parcelId).lean();

    // if parcel data not exist throw a error
    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: 'Parcel not found'
      });
    }

    // send the data 
    res.status(200).json({
      success: true,
      parcel
    })
  } catch (err) {
    console.log('error getting the single parcel data:', err);
    res.status(500).json({
      success: false,
      message: `Error getting single parcel data from: ${err.message}`
    })
  }
});

// create a percel data
parcelRoutes.post('/parcels', async (req, res) => {
  try {
    const parcelData = req.body.parcelObj;
    console.log(parcelData);

    const result = await ParcelsCollections.create(parcelData);
    res.status(201).json({
      success: true,
      result
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

parcelRoutes.put('/assign-rider/:parcelId', verifyFireBaseToken, verifyAdmin, async (req, res) => {
  try {
    const { parcelId } = req.params;
    const { riderId } = req.body;

    console.log('=== ASSIGN RIDER DEBUG ===');
    console.log('Parcel ID:', parcelId);
    console.log('Rider ID:', riderId);

    if (!mongoose.Types.ObjectId.isValid(parcelId) || !mongoose.Types.ObjectId.isValid(riderId)) {
      return res.status(400).json({ success: false, message: 'Invalid parcel or rider ID' });
    }

    // Get rider details first
    const rider = await RidersCollections.findById(riderId).select('name email phone bikeRegNo currentDelivery').lean();
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    console.log('Found rider:', rider.name);

    // Check if rider is already assigned to ANOTHER delivery (not this same parcel)
    if (rider.currentDelivery && rider.currentDelivery !== parcelId) {
      return res.status(400).json({ 
        success: false, 
        message: `Rider ${rider.name} is currently assigned to another delivery` 
      });
    }

    const parcel = await ParcelsCollections.findById(parcelId);
    if (!parcel) return res.status(404).json({ success: false, message: 'Parcel not found' });

    console.log('Found parcel - Before update:');
    console.log('Current parcelStatus:', parcel.parcelStatus);
    console.log('Current deliveryStatus:', parcel.deliveryStatus);
    console.log('Current assignedRider:', parcel.assignedRider);

    // Check if parcel already has a rider assigned (different rider)
    if (parcel.assignedRider && parcel.assignedRider._id.toString() !== riderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parcel already has a different rider assigned' 
      });
    }

    // Update parcel with rider details and change BOTH statuses
    parcel.assignedRider = {
      _id: riderId,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      bikeRegNo: rider.bikeRegNo
    };
    
    // UPDATE BOTH STATUSES
    parcel.parcelStatus = "On the Way"; // Changed from "Processing" to "On the Way"
    parcel.paymentStatus = "Paid";
    parcel.deliveryStatus = "In Transit"; // Changed from "Not Dispatched" to "In Transit"
    
    parcel.history.push({
      status: 'Rider Assigned - Parcel On the Way & In Transit',
      time: new Date(),
      by: req.decoded.email,
    });

    console.log('Parcel after update - Before save:');
    console.log('New parcelStatus:', parcel.parcelStatus);
    console.log('New deliveryStatus:', parcel.deliveryStatus);
    console.log('New assignedRider:', parcel.assignedRider);

    // Update rider's current delivery (only if not already assigned to this parcel)
    if (!rider.currentDelivery || rider.currentDelivery !== parcelId) {
      await RidersCollections.findByIdAndUpdate(riderId, {
        currentDelivery: parcelId
      });
      console.log('Updated rider currentDelivery to:', parcelId);
    }

    const savedParcel = await parcel.save();
    console.log('Parcel after save:');
    console.log('Final parcelStatus:', savedParcel.parcelStatus);
    console.log('Final deliveryStatus:', savedParcel.deliveryStatus);
    
    res.status(200).json({ 
      success: true, 
      message: 'Rider assigned successfully. Parcel status: On the Way, Delivery status: In Transit', 
      parcel: savedParcel 
    });
  } catch (err) {
    console.error('Error in assign-rider:', err);
    res.status(500).json({ success: false, message: 'Failed to assign rider' });
  }
});

parcelRoutes.delete('/parcel/:id', async (req, res) => {
  try {
    const _id = req.params.id;

    const result = await ParcelsCollections.findByIdAndDelete(_id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found — nothing to delete",
      });
    }

    res.status(200).json({
      success: true,
      result
    })

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `Error deleting data from DB: ${err}`
    })
  }
});

module.exports = parcelRoutes;