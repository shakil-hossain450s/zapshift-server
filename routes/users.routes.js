const express = require('express');
const usersRouter = express.Router();
const UsersCollections = require('../models/user.model');


usersRouter.get('/users', async (req, res) => {
  try {
    const users = await UsersCollections
      .find({})
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      users
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

// search user by email query
usersRouter.get('/users/search', async (req, res) => {
  try {
    const emailQuery = req.query.email;
    if (!emailQuery) {
      return res.status(400).send({ message: 'Missing email query' });
    }
    const regex = new RegExp(emailQuery, 'i');

    const users = await UsersCollections.find({ email: { $regex: regex } }).limit(10).lean();

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No user found'
      })
    }

    res.status(200).json({
      success: true,
      users
    })

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
})

// create user
usersRouter.post('/saveUser', async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user already exists
    const userExists = await UsersCollections.findOne({ email });

    if (userExists) {
      return res.status(200).json({
        message: 'User already exists',
        inserted: false,
        user: userExists
      });
    }

    // Insert new user ONLY if not exists
    const user = req.body;
    const result = await UsersCollections.create(user);

    res.status(201).json({
      inserted: true,
      user: result
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message
    })
  }
})

usersRouter.patch('/users/:id/role', async (req, res) => {
  try {
    const { id: _id } = req.params;
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).send({ message: 'invalid user' })
    }

    const result = await UsersCollections.findByIdAndUpdate(
      _id,
      {
        $set: { role }
      }
    );

    res.status(200).json({
      success: true,
      message: `user role updated to ${role}`,
      result
    })

  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `Error updating users role: ${err.message}`
    })
  }
})

module.exports = usersRouter;