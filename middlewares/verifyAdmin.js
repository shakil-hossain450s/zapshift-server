const UsersCollections = require('../models/user.model');

const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.decoded?.email;
    if (!email) {
      return res.status(401).json({
        success: false,
        message: `Unauthorized: no email found`
      })
    }

    const user = await UsersCollections.findOne({ email }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden access: Only admin can access this route'
      })
    }

    next();


  } catch (err) {
    console.log(`verifyAdmin error: ${err}`);
    res.status(500).json({
      success: false,
      message: `Internal server error: ${err.message}`,
    });
  }
}

module.exports = verifyAdmin;