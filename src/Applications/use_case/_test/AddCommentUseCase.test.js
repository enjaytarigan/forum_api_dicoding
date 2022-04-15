const CommentRepository = require('../../../Domains/comments/CommentRepository');
const NewComment = require('../../../Domains/comments/entities/NewComment');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddCommentUseCase = require('../AddCommentUseCase');

describe('AddCommentUseCase', () => {
  it('should orchestrating the add comment action flow correctly', async () => {
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    const useCasePayload = {
      content: 'great thread',
      owner: 'user-002',
      threadId: 'thread-001',
    };

    const expectedResult = new NewComment({
      content: 'great thread',
      owner: 'user-002',
      id: 'comment-001',
    });

    mockThreadRepository.verifyThreadIsExist = jest
      .fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentRepository.addComment = jest
      .fn()
      .mockImplementation(() => Promise.resolve(expectedResult));

    const addCommentUseCase = new AddCommentUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    const result = await addCommentUseCase.execute(useCasePayload);

    expect(result).toStrictEqual(expectedResult);
    expect(mockThreadRepository.verifyThreadIsExist).toBeCalledWith(
      useCasePayload.threadId,
    );
    expect(mockCommentRepository.addComment).toBeCalledWith(useCasePayload);
  });

  it('should throw error when use case payload not contain needed property', async () => {
    const addCommentUseCase = new AddCommentUseCase({});

    await expect(addCommentUseCase.execute({})).rejects.toThrowError('ADD_COMMENT_USE_CASE.PAYLOAD_NOT_CONTAIN_NEEDED_PROERTY');
  });

  it('should throw error when use case payload not meet data type specification', async () => {
    const addCommentUseCase = new AddCommentUseCase({});

    await expect(addCommentUseCase.execute({ content: {}, threadId: false, owner: [] }))
      .rejects
      .toThrowError('ADD_COMMENT_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION');
  });
});
