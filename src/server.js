require('dotenv').config();
const createApp = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/room-booking';

async function main() {
  await connectDB(MONGO_URI);
  console.log('Connected to MongoDB at', MONGO_URI);

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Meeting Room Booking Service listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});