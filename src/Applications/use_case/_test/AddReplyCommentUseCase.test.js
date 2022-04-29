const CommentRepository = require('../../../Domains/comments/CommentRepository');
const NewComment = require('../../../Domains/comments/entities/NewComment');
const CommentReplyRepository = require('../../../Domains/comment_replies/CommentReplyRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddReplyCommentUseCase = require('../AddReplyCommentUseCase');

describe('AddReplyCommentUseCase', () => {
  it('should throw error when payload not meet data type specification', async () => {
    const payload = {
      threadId: {},
      commentId: [],
      content: false,
      owner: true,
    };

    const addReplyCommentUseCase = new AddReplyCommentUseCase({});

    await expect(() => addReplyCommentUseCase.execute(payload))
      .rejects
      .toThrowError('ADD_REPLY_COMMENT_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION');
  });
  it('should throw error when payload not contain needed property', async () => {
    const payload = {
      threadId: 'thread-000',
      commentId: 'comment-000',
      owner: '',
    };

    const addReplyCommentUseCase = new AddReplyCommentUseCase({});

    await expect(() => addReplyCommentUseCase.execute(payload))
      .rejects
      .toThrowError('ADD_REPLY_COMMENT_USE_CASE.PAYLOAD_NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when given invalid "content" property', async () => {
    const payload = {
      threadId: 'thread-000',
      commentId: 'comment-000',
      owner: 'user-000',
      content: '',
    };

    const addReplyCommentUseCase = new AddReplyCommentUseCase({});

    await expect(() => addReplyCommentUseCase.execute(payload))
      .rejects
      .toThrowError('ADD_REPLY_COMMENT_USE_CASE.CONTENT_MUST_BE_STRING_AND_NOT_TO_EMPTY');
  });

  it('should orchestrating the reply comment flow correctly', async () => {
    const mockCommentReplyRepository = new CommentReplyRepository();
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    const expectedResult = new NewComment({
      id: 'reply-0001',
      content: 'reply',
      owner: 'user-0001',
    });

    mockCommentReplyRepository.addReplyComment = jest.fn()
      .mockImplementation(() => Promise.resolve(expectedResult));

    mockCommentRepository.verifyCommentIsExist = jest.fn()
      .mockImplementation(() => Promise.resolve());

    mockThreadRepository.verifyThreadIsExist = jest.fn()
      .mockImplementation(() => Promise.resolve());

    const addReplyCommentUseCase = new AddReplyCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
      commentReplyRepository: mockCommentReplyRepository,
    });

    const useCasePayload = {
      content: 'reply',
      owner: 'user-0001',
      commentId: 'comment-0001',
      threadId: 'thread-0001',
    };

    const result = await addReplyCommentUseCase.execute(useCasePayload);

    expect(result).toStrictEqual(expectedResult);
    expect(mockThreadRepository.verifyThreadIsExist).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentIsExist).toBeCalledWith(useCasePayload.commentId);
    expect(mockCommentReplyRepository.addReplyComment).toBeCalledWith(useCasePayload);
  });
});
