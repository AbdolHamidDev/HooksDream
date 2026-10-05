// Thiết lập dùng chung cho toàn bộ test backend.
//
// Cách hoạt động:
//  - Test không cần DB (tests/unit) -> chạy độc lập, không khởi động MongoDB.
//  - Test cần DB (tests/integration) -> tự yêu cầu DB qua helper `withDatabase`.
process.env.NODE_ENV = 'test';

// Biến môi trường tối thiểu để các module nạp ở top-level không lỗi.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hooksdream_test';

// Tắt testConnection() chạy ngầm khi require utils/cloudinary.
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'test-cloud';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || 'test-key';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'test-secret';

module.exports = {};
