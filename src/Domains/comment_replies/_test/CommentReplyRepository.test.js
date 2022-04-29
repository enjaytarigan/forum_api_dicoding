const CommentReplyRepository = require('../CommentReplyRepository');

describe('CommentReplyRepository interface', () => {
  it('should throw error when invoke abstract method', async () => {
    const commentReplyRepository = new CommentReplyRepository();

    await expect(
      commentReplyRepository.addReplyComment({}),
    ).rejects.toThrowError('COMMENT_REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');

    await expect(
      commentReplyRepository.findRepliesByCommentIds([]),
    ).rejects.toThrowError('COMMENT_REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');

    await expect(commentReplyRepository.verifyReplyCommentIsExist('comment-xxx'))
      .rejects
      .toThrowError('COMMENT_REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');

    await expect(commentReplyRepository.verifyReplyCommentOwner('xxx', 'xxx'))
      .rejects
      .toThrowError('COMMENT_REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');

    await expect(
      commentReplyRepository.deleteReplyCommentById('reply-xxx'),
    ).rejects.toThrowError('COMMENT_REPLY_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  });
});
