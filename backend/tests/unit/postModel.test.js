// Unit test cho Post model: methods toggleLike/isLikedBy, extractHashtags,
// calculateEngagementScore, softDelete, archivePost/restorePost.
// Không cần DB (chỉ test method thuần + save mock).
const Post = require('../../models/Post');

const makePost = (overrides = {}) =>
  new Post({ userId: 'user-a', content: 'hello', ...overrides });

describe('Post.extractHashtags', () => {
  it('tách hashtag và lowercase', () => {
    const post = makePost({ content: 'ăn gì ở #HaNoi ngon #FoodTour' });
    post.extractHashtags();
    expect(post.hashtags).toEqual(expect.arrayContaining(['hanoi', 'foodtour']));
  });

  it('content không có hashtag thì giữ nguyên', () => {
    const post = makePost({ content: 'không có gì' });
    post.extractHashtags();
    expect(post.hashtags).toEqual([]);
  });
});

describe('Post.calculateEngagementScore', () => {
  it('áp dụng công thức likes*2 + comments*3 + shares*5 + reposts*4', () => {
    const post = makePost({});
    post.likeCount = 10;
    post.commentCount = 4;
    post.shareCount = 2;
    post.repostCount = 1;
    expect(post.calculateEngagementScore()).toBe(20 + 12 + 10 + 4);
    expect(post.engagementScore).toBe(46);
  });
});

describe('Post.isLikedBy', () => {
  it('trả đúng khi user đã like / chưa like', () => {
    const post = makePost({ likes: [{ userId: 'user-b' }] });
    expect(post.isLikedBy('user-b')).toBe(true);
    expect(post.isLikedBy('user-c')).toBe(false);
  });
});

describe('Post.toggleLike (mock save)', () => {
  it('like tăng likeCount, unlike giảm nhưng không âm', async () => {
    const post = makePost({});
    post.save = async () => post;

    await post.toggleLike('user-b');
    expect(post.likeCount).toBe(1);
    expect(post.isLikedBy('user-b')).toBe(true);

    await post.toggleLike('user-b');
    expect(post.likeCount).toBe(0);
    expect(post.isLikedBy('user-b')).toBe(false);
  });
});

describe('Post.softDelete / archivePost / restorePost (mock save)', () => {
  it('softDelete đặt isDeleted + deletedAt', async () => {
    const post = makePost({});
    post.save = async () => post;
    await post.softDelete();
    expect(post.isDeleted).toBe(true);
    expect(post.deletedAt).toBeInstanceOf(Date);
  });

  it('archivePost đặt TTL ~30 ngày, restorePost gỡ flag', async () => {
    const post = makePost({});
    post.save = async () => post;

    await post.archivePost();
    expect(post.isArchived).toBe(true);
    const diffDays = (post.expiresAt - Date.now()) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThan(29);

    await post.restorePost();
    expect(post.isArchived).toBe(false);
    expect(post.expiresAt).toBeNull();
  });
});
