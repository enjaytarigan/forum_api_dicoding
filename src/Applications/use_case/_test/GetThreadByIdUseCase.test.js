const CommentRepository = require('../../../Domains/comments/CommentRepository');
const Comment = require('../../../Domains/comments/entities/Comment');
const CommentReplyRepository = require('../../../Domains/comment_replies/CommentReplyRepository');
const CommentReply = require('../../../Domains/comment_replies/entities/CommentReply');
const Thread = require('../../../Domains/threads/entities/Thread');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const GetThreadByIdUseCase = require('../GetThreadByIdUseCase');

describe('GetThreadByIdUseCase', () => {
  it('should orchestarating the get thread detail flow correctly', async () => {
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockCommentReplyRepository = new CommentReplyRepository();

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

    const replies = [{
      username: 'user3',
      id: 'reply-001',
      comment_id: 'comment-001',
      is_delete: false,
      created_at: new Date(),
      owner: 'user3',
      content: 'reply comment',
    }];

    mockCommentRepository.getCommentsByThreadId = jest
      .fn()
      .mockImplementation(() => Promise.resolve(comments));

    mockCommentReplyRepository.findRepliesByCommentIds = jest.fn()
      .mockImplementation(() => Promise.resolve(replies));

    const getThreadByIdUseCase = new GetThreadByIdUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      commentReplyRepository: mockCommentReplyRepository,
    });

    const payload = {
      threadId: 'thread-001',
    };

    const threadDetail = await getThreadByIdUseCase.execute(payload);

    const expectedThread = {
      ...thread,
      comments: comments.map((comment) => {
        const repliesComment = replies.filter((reply) => reply.comment_id === comment.id);
        return {
          ...comment,
          replies: repliesComment.map(
            (reply) => new CommentReply({ ...reply, date: reply.created_at }),
          ),
        };
      }),
    };

    expect(threadDetail).toStrictEqual(expectedThread);
    expect(mockThreadRepository.getThreadById).toBeCalledWith(payload.threadId);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(
      payload.threadId,
    );
    expect(mockCommentReplyRepository.findRepliesByCommentIds)
      .toBeCalledWith(comments.map((comment) => comment.id));
  });

  it('should throw error when use case payload not contain needed property', async () => {
    const getThreadByIdUseCase = new GetThreadByIdUseCase({});

    await expect(getThreadByIdUseCase.execute({}))
      .rejects
      .toThrow('GET_THREAD_BY_ID_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  describe('_groupReplyByCommentId function', () => {
    it('should return {} when replies length is 0', () => {
      const getThreadByIdUseCase = new GetThreadByIdUseCase({});

      expect(getThreadByIdUseCase._groupReplyByCommentId([])).toEqual({});
    });

    it('should return grouping replies comment by commentId}', () => {
      const replies = [
        {
          comment_id: 'comment-001',
          content: 'reply comment',
          id: 'reply-0001',
          created_at: new Date(),
          is_delete: false,
          username: 'user-0001',
        },
        {
          comment_id: 'comment-001',
          content: 'reply comment',
          id: 'reply-0002',
          created_at: new Date(),
          is_delete: false,
          username: 'user-0001',
        },
      ];

      const getCommentsByThreadId = new GetThreadByIdUseCase({});
      const date = new Date();
      const expectedResult = {
        'comment-001': [
          new CommentReply({
            content: 'reply comment',
            id: 'reply-0001',
            date,
            username: 'user-0001',
            is_delete: false,
          }),
          new CommentReply({
            content: 'reply comment',
            id: 'reply-0002',
            date,
            username: 'user-0001',
            is_delete: false,
          }),
        ],
      };

      const result = getCommentsByThreadId._groupReplyByCommentId(replies);

      expect(result).toStrictEqual(expectedResult);
    });
  });
});
