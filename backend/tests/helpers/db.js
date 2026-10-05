// Helper khởi động MongoDB in-memory cho test tích hợp.
// Chỉ dùng trong tests/integration — test unit không cần database.
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Kết nối mongoose tới MongoDB in-memory.
 * Tự tải binary MongoDB ở lần chạy đầu nên có thể chậm.
 */
async function connectDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: 'hooksdream_test' });

  return { mongoose, uri };
}

/** Ngắt kết nối và tắt server in-memory. */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = undefined;
  }
}

/** Xoá sạch dữ liệu giữa các test nhưng giữ nguyên server. */
async function clearDB() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

module.exports = { connectDB, disconnectDB, clearDB };
