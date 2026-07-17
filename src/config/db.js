const mongoose = require("mongoose");

const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri || process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("Database Connection Failed");
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };