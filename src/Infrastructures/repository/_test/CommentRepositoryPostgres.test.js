const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const pool = require('../../database/postgres/pool');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const NewComment = require('../../../Domains/comments/entities/NewComment');

describe('CommentRepositoryPostgres', () => {
  const threadId = 'thread-001';
  const commentedUserId = 'user-002';

  beforeAll(async () => {
    await UsersTableTestHelper.addUser({
      fullname: 'Developer Expert',
      id: 'user-001',
      username: 'dev',
    });

    await UsersTableTestHelper.addUser({
      fullname: 'Developer Expert 2',
      id: commentedUserId,
      username: 'dev2',
    });

    await ThreadsTableTestHelper.addThread({
      id: threadId,
      title: 'Developer Thread',
      body: 'Developer Thread body',
      owner: 'user-001',
    });
  });

  afterAll(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
  });
  describe('addComment function', () => {
    it('should add comment to database', async () => {
      const idGenerator = () => '123';

      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        idGenerator,
      );

      const payloadComment = {
        content: 'comment',
        owner: commentedUserId,
        threadId,
      };

      await commentRepositoryPostgres.addComment(payloadComment);
      const comments = await CommentsTableTestHelper.findById('comment-123');

      expect(comments).toHaveLength(1);
      expect(comments[0].content).toEqual(payloadComment.content);
      expect(comments[0].owner).toEqual(payloadComment.owner);
      expect(comments[0].thread_id).toEqual(payloadComment.threadId);
    });

    it('should return new comment correctly', async () => {
      const mockIdGenerator = jest.fn().mockImplementation(() => '123');
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, mockIdGenerator);

      const expectedResult = new NewComment({
        id: 'comment-123',
        content: 'example comment',
        owner: commentedUserId,
      });

      const newComment = await commentRepositoryPostgres.addComment({
        threadId,
        content: 'example comment',
        owner: commentedUserId,
      });

      expect(newComment).toStrictEqual(expectedResult);
      expect(mockIdGenerator).toBeCalledTimes(1);
    });
  });
});
