const express = require('express');
const percelRoutes =express.Router();

percelRoutes.get('/percels', (req, res) => {
  res.status(200).send('All percels are here');
})

module.exports = percelRoutes;