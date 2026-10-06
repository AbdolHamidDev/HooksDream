// Express app tối giản cho test HTTP (supertest).
// Chỉ mount routes/posts + JSON parser — KHÔNG require server.js
// (tránh listen, rate-limit, cron, Cloudinary ping, socket).
// Lưu ý: routes/posts -> uploadController -> utils/cloudinary gọi
// testConnection() ở top-level. tests/setup.js đã đặt CLOUDINARY_*
// dummy nên ping fail nhanh và không chặn test (catch -> false).
const express = require('express');

function buildPostsApp() {
  const app = express();
  app.use(express.json());
  const postRoutes = require('../../routes/posts');
  app.use('/api/posts', postRoutes);
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(500).json({ success: false, message: 'Internal server error' });
  });
  return app;
}

module.exports = { buildPostsApp };
