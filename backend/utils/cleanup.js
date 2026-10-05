require('dotenv').config({ path: '../.env' });
const { cloudinary } = require('./cloudinary');


// Script để cleanup toàn bộ Cloudinary
const cleanupCloudinary = async () => {
  // Lấy tất cả resources
  const allResources = await cloudinary.api.resources({
    type: 'upload',
    max_results: 500, // Tăng limit
    resource_type: 'image'
  });

  // Lấy danh sách public_ids
  const publicIds = allResources.resources.map(resource => resource.public_id);

  if (publicIds.length === 0) {
    return;
  }

  // Xóa hàng loạt (tối đa 100 cùng lúc)
  const batchSize = 100;
  for (let i = 0; i < publicIds.length; i += batchSize) {
    const batch = publicIds.slice(i, i + batchSize);

    try {
      const result = await cloudinary.api.delete_resources(batch);

      if (result.not_found && Object.keys(result.not_found).length > 0) {
        console.warn(
          `[cleanup] Có ${Object.keys(result.not_found).length} file không tồn tại trong batch ${i / batchSize + 1}`
        );
      }
    } catch (batchError) {
      console.warn(`[cleanup] Không xóa được batch ${i / batchSize + 1}:`, batchError.message);
    }

    // Delay để tránh rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Cleanup videos nếu có
  const videoResources = await cloudinary.api.resources({
    type: 'upload',
    max_results: 500,
    resource_type: 'video'
  });

  if (videoResources.resources.length > 0) {
    const videoPublicIds = videoResources.resources.map(resource => resource.public_id);

    for (let i = 0; i < videoPublicIds.length; i += batchSize) {
      const batch = videoPublicIds.slice(i, i + batchSize);

      try {
        await cloudinary.api.delete_resources(batch, { resource_type: 'video' });
      } catch (batchError) {
        console.warn(`[cleanup] Không xóa được batch video ${i / batchSize + 1}:`, batchError.message);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Xóa folder uploads/images và uploads/videos nếu rỗng.
  // Lỗi ở đây không chặn cleanup nên chỉ log, không ném.
  try {
    await cloudinary.api.delete_folder('uploads/images');
  } catch (err) {
    console.warn('[cleanup] Bỏ qua lỗi xóa folder uploads/images:', err.message);
  }

  try {
    await cloudinary.api.delete_folder('uploads/videos');
  } catch (err) {
    console.warn('[cleanup] Bỏ qua lỗi xóa folder uploads/videos:', err.message);
  }
};

// Function để reset database avatars về default
const resetDatabaseAvatars = async () => {
// Dùng model User (Mongoose) thay vì driver `db` thô để đúng với kiến trúc hiện tại.
  const User = require('../models/User');
  const result = await User.updateMany(
    { avatar: { $regex: 'cloudinary.com' } },
    { $unset: { avatar: 1 } }
  );
  console.log(`Reset avatar cho ${result.modifiedCount} user`);
  return result;
};

// Chạy cleanup
if (require.main === module) {
  cleanupCloudinary()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      process.exit(1);
    });
}

module.exports = { cleanupCloudinary, resetDatabaseAvatars };