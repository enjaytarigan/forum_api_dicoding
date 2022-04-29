const CommentRepository = require('../../../Domains/comments/CommentRepository');
const CommentReplyRepository = require('../../../Domains/comment_replies/CommentReplyRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const DeleteReplyCommentUseCase = require('../DeleteReplyCommentUseCase');

describe('DeleteReplyCommentUseCase', () => {
  it('should orchestrating the flow delete replied comment action correctly', async () => {
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();
    const mockCommentReplyRepository = new CommentReplyRepository();

    mockThreadRepository.verifyThreadIsExist = jest
      .fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentRepository.verifyCommentIsExist = jest
      .fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentReplyRepository.verifyReplyCommentIsExist = jest
      .fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentReplyRepository.verifyReplyCommentOwner = jest
      .fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentReplyRepository.deleteReplyCommentById = jest
      .fn()
      .mockImplementation(() => Promise.resolve());
    const deleteReplyCommentUseCase = new DeleteReplyCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      commentReplyRepository: mockCommentReplyRepository,
    });

    const payload = {
      threadId: 'thread-xxx',
      commentId: 'comment-xxx',
      id: 'reply-xxx',
      owner: 'user-xxx',
    };

    await expect(deleteReplyCommentUseCase.execute(payload))
      .resolves
      .not
      .toThrow();

    expect(mockThreadRepository.verifyThreadIsExist).toBeCalledWith(payload.threadId);
    expect(mockCommentRepository.verifyCommentIsExist).toBeCalledWith(payload.commentId);
    expect(mockCommentReplyRepository.verifyReplyCommentIsExist).toBeCalledWith(payload.id);
    expect(mockCommentReplyRepository.verifyReplyCommentOwner)
      .toBeCalledWith(payload.id, payload.owner);
    expect(mockCommentReplyRepository.deleteReplyCommentById).toBeCalledWith(payload.id);
  });
});
