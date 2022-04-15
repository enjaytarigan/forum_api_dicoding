/* istanbul ignore file */
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const DeleteCommentUseCase = require('../DeleteCommentUseCase');

describe('DeleteCommentUseCase', () => {
  it('should orchestrating the flow delete comment action correctly', async () => {
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockCommentRepository.verifyCommentOwner = jest
      .fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentRepository.deleteCommentById = jest
      .fn()
      .mockImplementation(() => Promise.resolve());

    mockThreadRepository.verifyThreadIsExist = jest
      .fn()
      .mockImplementation(() => Promise.resolve());

    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    const deleteCommentUseCase = new DeleteCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    await expect(
      deleteCommentUseCase.execute(useCasePayload),
    ).resolves.not.toThrowError();
    expect(mockThreadRepository.verifyThreadIsExist).toBeCalledWith(
      useCasePayload.threadId,
    );
    expect(mockCommentRepository.verifyCommentOwner).toBeCalledWith(
      useCasePayload.commentId,
      useCasePayload.owner,
    );
    expect(mockCommentRepository.deleteCommentById).toBeCalledWith(useCasePayload.commentId);
  });
});
