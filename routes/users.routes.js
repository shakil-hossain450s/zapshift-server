const express = require('express');
const usersRouter = express.Router();
const UsersCollections = require('../models/user.model');

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

module.exports = usersRouter;