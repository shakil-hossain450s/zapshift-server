const express = require('express');
const parcelRoutes = express.Router();
const ParcelsCollections = require('../models/parcel.model');
const mongoose = require('mongoose');
const verifyFirebaseTokenToken = require('../middlewares/verfiyFireBaseToken');

// get all parcels
// parcelRoutes.get('/parcels', async (req, res) => {
//   try {
//     const parcels = await ParcelsCollections.find().lean();
//     res.status(200).json({
//       success: true,
//       parcels
//     })
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       success: false,
//       message: `Error reading storage: ${err}`
//     })
//   }
// })

// get parcel data by specific user email
parcelRoutes.get('/parcels', verifyFirebaseTokenToken, async (req, res) => {
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
parcelRoutes.get('/parcel/:parcelId', async (req, res) => {
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
})

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
})

module.exports = parcelRoutes;