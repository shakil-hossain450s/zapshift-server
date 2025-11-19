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

// Get pending deliveries for rider by email
parcelRoutes.get('/rider/pending-deliveries/:riderEmail', verifyFireBaseToken, async (req, res) => {
  try {
    const { riderEmail } = req.params;
    
    console.log('Fetching pending deliveries for rider:', riderEmail);

    if (!riderEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rider email is required' 
      });
    }

    // Find parcels assigned to this rider with pending status
    const pendingDeliveries = await ParcelsCollections.find({
      $or: [
        { riderEmail: riderEmail },
        { 'assignedRider.email': riderEmail }
      ],
      deliveryStatus: 'rider_assigned',
      parcelStatus: 'On the Way'
    })
    .select('-__v')
    .sort({ createdAt: 1 }) // Oldest first
    .lean();

    console.log(`Found ${pendingDeliveries.length} pending deliveries for rider ${riderEmail}`);

    res.status(200).json({
      success: true,
      count: pendingDeliveries.length,
      pendingDeliveries
    });

  } catch (err) {
    console.error('Error fetching rider pending deliveries:', err);
    res.status(500).json({
      success: false,
      message: `Failed to fetch pending deliveries: ${err.message}`
    });
  }
});

// Get all active deliveries for rider by email
parcelRoutes.get('/rider/active-deliveries/:riderEmail', verifyFireBaseToken, async (req, res) => {
  try {
    const { riderEmail } = req.params;
    
    console.log('Fetching active deliveries for rider:', riderEmail);

    if (!riderEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rider email is required' 
      });
    }

    // Find parcels assigned to this rider with active statuses
    const activeDeliveries = await ParcelsCollections.find({
      $or: [
        { riderEmail: riderEmail },
        { 'assignedRider.email': riderEmail }
      ],
      deliveryStatus: { 
        $in: ['rider_assigned', 'in_transit'] 
      }
    })
    .select('-__v')
    .sort({ createdAt: 1 })
    .lean();

    console.log(`Found ${activeDeliveries.length} active deliveries for rider ${riderEmail}`);

    res.status(200).json({
      success: true,
      count: activeDeliveries.length,
      activeDeliveries
    });

  } catch (err) {
    console.error('Error fetching rider active deliveries:', err);
    res.status(500).json({
      success: false,
      message: `Failed to fetch active deliveries: ${err.message}`
    });
  }
});

// Get completed deliveries for rider by email
parcelRoutes.get('/rider/completed-deliveries/:riderEmail', verifyFireBaseToken, async (req, res) => {
  try {
    const { riderEmail } = req.params;
    
    console.log('Fetching completed deliveries for rider:', riderEmail);

    if (!riderEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rider email is required' 
      });
    }

    // Find parcels assigned to this rider with delivered status
    const completedDeliveries = await ParcelsCollections.find({
      $or: [
        { riderEmail: riderEmail },
        { 'assignedRider.email': riderEmail }
      ],
      deliveryStatus: 'delivered'
    })
    .select('-__v')
    .sort({ updatedAt: -1 }) // Most recent first
    .lean();

    console.log(`Found ${completedDeliveries.length} completed deliveries for rider ${riderEmail}`);

    res.status(200).json({
      success: true,
      count: completedDeliveries.length,
      completedDeliveries
    });

  } catch (err) {
    console.error('Error fetching rider completed deliveries:', err);
    res.status(500).json({
      success: false,
      message: `Failed to fetch completed deliveries: ${err.message}`
    });
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

// Migration route to update existing parcels with rider fields
parcelRoutes.post('/admin/migrate-rider-fields', verifyFireBaseToken, verifyAdmin, async (req, res) => {
  try {
    const parcels = await ParcelsCollections.find({
      assignedRider: { $exists: true, $ne: null }
    });

    let updatedCount = 0;

    for (let parcel of parcels) {
      if (parcel.assignedRider && parcel.assignedRider._id) {
        // Only update if fields don't exist or are different
        if (!parcel.riderId || parcel.riderId.toString() !== parcel.assignedRider._id.toString()) {
          parcel.riderId = parcel.assignedRider._id;
          parcel.riderEmail = parcel.assignedRider.email;
          parcel.riderName = parcel.assignedRider.name;
          await parcel.save();
          updatedCount++;
          console.log(`Updated parcel ${parcel.trackingId}`);
        }
      }
    }

    console.log('Migration completed. Updated', updatedCount, 'parcels');

    res.status(200).json({
      success: true,
      message: `Migration completed. Updated ${updatedCount} parcels.`,
      updatedCount
    });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({
      success: false,
      message: `Migration failed: ${err.message}`
    });
  }
});

// Update parcel delivery status
parcelRoutes.patch('/parcel/:parcelId/delivery-status', verifyFireBaseToken, async (req, res) => {
  try {
    const { parcelId } = req.params;
    const { deliveryStatus, parcelStatus, action } = req.body;
    const riderEmail = req.decoded.email;

    console.log('Updating delivery status:', { parcelId, deliveryStatus, parcelStatus, action, riderEmail });

    if (!mongoose.Types.ObjectId.isValid(parcelId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid parcel ID' 
      });
    }

    const parcel = await ParcelsCollections.findById(parcelId);
    if (!parcel) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parcel not found' 
      });
    }

    // Verify the rider is assigned to this parcel
    const isRiderAssigned = parcel.riderEmail === riderEmail || 
                           parcel.assignedRider?.email === riderEmail;

    if (!isRiderAssigned) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not assigned to this delivery' 
      });
    }

    // Validate status transitions
    const validTransitions = {
      'rider_assigned': ['in_transit'], // Can only go to in_transit
      'in_transit': ['delivered'] // Can only go to delivered
    };

    const currentStatus = parcel.deliveryStatus;
    if (!validTransitions[currentStatus]?.includes(deliveryStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status transition from ${currentStatus} to ${deliveryStatus}` 
      });
    }

    // Update parcel status
    parcel.deliveryStatus = deliveryStatus;
    parcel.parcelStatus = parcelStatus;
    parcel.updatedAt = new Date();

    // Add to history
    const actionMessages = {
      'picked_up': `Parcel picked up by rider ${riderEmail}`,
      'delivered': `Parcel delivered successfully by rider ${riderEmail}`
    };

    parcel.history.push({
      status: `${parcelStatus} - ${deliveryStatus}`,
      time: new Date(),
      by: riderEmail,
      action: action,
      message: actionMessages[action]
    });

    // If delivered, update rider's current delivery
    if (deliveryStatus === 'delivered') {
      await RidersCollections.findOneAndUpdate(
        { email: riderEmail },
        { $unset: { currentDelivery: "" } }
      );
    }

    const savedParcel = await parcel.save();

    console.log('Parcel status updated successfully:', {
      trackingId: savedParcel.trackingId,
      oldStatus: currentStatus,
      newStatus: deliveryStatus
    });

    res.status(200).json({
      success: true,
      message: `Parcel status updated to ${deliveryStatus}`,
      parcel: savedParcel
    });

  } catch (err) {
    console.error('Error updating delivery status:', err);
    res.status(500).json({
      success: false,
      message: `Failed to update delivery status: ${err.message}`
    });
  }
});

// Assign rider to parcel - FIXED ERROR HANDLING
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
    const rider = await RidersCollections.findById(riderId).select('name email phone bikeRegNo currentDelivery _id').lean();
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    console.log('Found rider:', rider);

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

    // FIXED: Check if parcel already has a rider assigned (different rider)
    // Check if assignedRider exists and has _id property before comparing
    if (parcel.assignedRider && parcel.assignedRider._id && parcel.assignedRider._id.toString() !== riderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parcel already has a different rider assigned' 
      });
    }

    // Update parcel with ALL rider details in assignedRider object
    parcel.assignedRider = {
      _id: rider._id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      bikeRegNo: rider.bikeRegNo
    };
    
    // ADD SEPARATE FIELDS FOR RIDER INFORMATION
    parcel.riderId = rider._id;
    parcel.riderEmail = rider.email;
    parcel.riderName = rider.name;
    
    // Update statuses
    parcel.parcelStatus = "On the Way";
    parcel.paymentStatus = "Paid";
    parcel.deliveryStatus = "rider_assigned";
    
    parcel.history.push({
      status: 'Rider Assigned - rider_assigned',
      time: new Date(),
      by: req.decoded.email,
      riderName: rider.name,
      riderId: rider._id,
      riderEmail: rider.email
    });

    console.log('Parcel after update - Before save:');
    console.log('New parcelStatus:', parcel.parcelStatus);
    console.log('New deliveryStatus:', parcel.deliveryStatus);
    console.log('New assignedRider:', parcel.assignedRider);
    console.log('New riderId:', parcel.riderId);
    console.log('New riderEmail:', parcel.riderEmail);
    console.log('New riderName:', parcel.riderName);

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
    console.log('Final assignedRider:', savedParcel.assignedRider);
    console.log('Final riderId:', savedParcel.riderId);
    console.log('Final riderEmail:', savedParcel.riderEmail);
    console.log('Final riderName:', savedParcel.riderName);
    
    res.status(200).json({ 
      success: true, 
      message: 'Rider assigned successfully. Delivery status: rider_assigned', 
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