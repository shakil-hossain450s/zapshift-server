require('dotenv').config();
const app = require('./app');
// const connectDB = require('./config/database.config');

// Port from environment variables or fallback
const PORT = process.env.PORT || 5000;

app.listen(PORT, async() => {
  // await connectDB();
  console.log(`server is running on http://localhost:3000`);
})

