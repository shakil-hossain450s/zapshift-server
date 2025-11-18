const admin = require('../config/firebaseAdmin');

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  const token = authHeader.split(' ')[1];

  try {

    const decodedUser = await admin.auth().verifyIdToken(token);
    req.decoded = decodedUser;
    next();

  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = verifyFirebaseToken;