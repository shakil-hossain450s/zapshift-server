const admin= require('firebase-admin');
const serviceAccount = require('./zapshift-firebase-adminsdk-file.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;