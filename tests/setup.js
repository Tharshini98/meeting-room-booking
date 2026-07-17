const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let replSet;

beforeAll(async () => {
  // Transactions require a replica set, even a single-node one.
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  const uri = replSet.getUri();
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: 'test' });

  
  require('../src/models/Room');
  require('../src/models/Booking');
  require('../src/models/IdempotencyKey');
  await Promise.all(Object.values(mongoose.connection.models).map((m) => m.init()));
}, 60000);

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
}, 30000);