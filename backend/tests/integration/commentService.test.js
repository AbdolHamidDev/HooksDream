// Test tích hợp cho service layer với MongoDB thật (in-memory).
// Mục tiêu: bảo vệ các bug đã sửa — scope của `parentComment` và tên field.
const mongoose = require('mongoose');
const { connectDB, disconnectDB, clearDB } = require('../helpers/db');

const Post = require('../../models/Post');
// createNotification() gọi mongoose.model('User') nên model này phải được đăng ký.
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const CommentService = require('../../services/commentService');

let post;

beforeAll(async () => {
  await connectDB();
}, 120000);

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  await clearDB();
  post = await Post.create({
    userId: 'user-owner',
    content: 'Bài viết gốc',
    commentCount: 0,
  });
});

describe('commentService.createComment', () => {
  it('tạo bình luận gốc và tăng commentCount của bài viết', async () => {
    const comment = await CommentService.createComment('user-a', post._id, {
      content: 'Bình luận đầu tiên',
    });

    expect(comment).toBeTruthy();
    expect(comment.content).toBe('Bình luận đầu tiên');

    const updated = await Post.findById(post._id);
    expect(updated.commentCount).toBe(1);
  });

  it('lưu đúng tên field parentCommentId cho reply', async () => {
    const parent = await CommentService.createComment('user-a', post._id, {
      content: 'Bình luận gốc',
    });

    const reply = await CommentService.createComment('user-b', post._id, {
      content: 'Trả lời',
      parentCommentId: parent._id,
    });

    // Nếu service ghi nhầm `parentComment`, field này sẽ null.
    expect(reply.parentCommentId).toBeTruthy();
    expect(reply.parentCommentId.toString()).toBe(parent._id.toString());
  });

  it('gửi thông báo cho chủ bài viết khi có người khác bình luận', async () => {
    await CommentService.createComment('user-b', post._id, { content: 'Chào' });

    const notifications = await Notification.find({});
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('comment');
    expect(notifications[0].recipient).toBe('user-owner');
  });

  it('không gửi thông báo khi tự bình luận bài của mình', async () => {
    await CommentService.createComment('user-owner', post._id, { content: 'Bài của tôi' });

    const notifications = await Notification.find({});
    expect(notifications).toHaveLength(0);
  });

  it('ném lỗi khi bình luận vào bài không tồn tại', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(
      CommentService.createComment('user-a', fakeId, { content: 'x' })
    ).rejects.toThrow('Post not found');
  });

  it('ném lỗi khi bình luận gốc của reply không tồn tại', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await expect(
      CommentService.createComment('user-a', post._id, {
        content: 'x',
        parentCommentId: fakeId,
      })
    ).rejects.toThrow('Parent comment not found');
  });

  it('gửi thông báo reply cho người viết bình luận gốc', async () => {
    // user-a viết bình luận gốc, user-owner (chủ bài) reply lại
    // -> user-a phải nhận được thông báo 'reply'.
    const parent = await CommentService.createComment('user-a', post._id, {
      content: 'Gốc',
    });

    const reply = await CommentService.createComment('user-owner', post._id, {
      content: 'Trả lời',
      parentCommentId: parent._id,
    });

    expect(reply).toBeTruthy();

    const notifications = await Notification.find({ type: 'reply' });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].recipient).toBe('user-a');
    expect(notifications[0].sender).toBe('user-owner');
    expect(notifications[0].metadata.parentCommentId).toBe(String(parent._id));
  });

  it('không gửi thông báo reply khi tự trả lời bình luận của mình', async () => {
    const parent = await CommentService.createComment('user-a', post._id, {
      content: 'Gốc',
    });

    await CommentService.createComment('user-a', post._id, {
      content: 'Tự trả lời',
      parentCommentId: parent._id,
    });

    const notifications = await Notification.find({ type: 'reply' });
    expect(notifications).toHaveLength(0);
  });
});
