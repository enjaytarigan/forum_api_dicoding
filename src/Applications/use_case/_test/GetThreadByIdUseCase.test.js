const CommentRepository = require('../../../Domains/comments/CommentRepository');
const Comment = require('../../../Domains/comments/entities/Comment');
const Thread = require('../../../Domains/threads/entities/Thread');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const GetThreadByIdUseCase = require('../GetThreadByIdUseCase');

describe('GetThreadByIdUseCase', () => {
  it('should orchestarating the get thread detail flow correctly', async () => {
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    const thread = new Thread({
      id: 'thread-001',
      username: 'user',
      date: new Date(),
      title: 'thread',
      body: 'body thread',
    });

    mockThreadRepository.getThreadById = jest
      .fn()
      .mockImplementation(() => Promise.resolve(thread));

    const comments = [
      new Comment({
        id: 'comment-001',
        content: 'comment',
        username: 'user2',
        date: new Date(),
        is_delete: false,
      }),
    ];
    mockCommentRepository.getCommentsByThreadId = jest
      .fn()
      .mockImplementation(() => Promise.resolve(comments));

    const getThreadByIdUseCase = new GetThreadByIdUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    const payload = {
      threadId: 'thread-001',
    };

    const threadDetail = await getThreadByIdUseCase.execute(payload);

    const expectedThread = {
      ...thread,
      comments,
    };

    expect(threadDetail).toStrictEqual(expectedThread);
    expect(mockThreadRepository.getThreadById).toBeCalledWith(payload.threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(
      payload.threadId,
    );
  });

  it('should throw error when use case payload not contain needed property', async () => {
    const getThreadByIdUseCase = new GetThreadByIdUseCase({});

    await expect(getThreadByIdUseCase.execute({}))
      .rejects
      .toThrow('GET_THREAD_BY_ID_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
  });
});
