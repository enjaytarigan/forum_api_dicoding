const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const pool = require('../../database/postgres/pool');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const NewComment = require('../../../Domains/comments/entities/NewComment');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');
const Comment = require('../../../Domains/comments/entities/Comment');

describe('CommentRepositoryPostgres', () => {
  const threadId = 'thread-001';
  const commentedUserId = 'user-002';
  const commentedUsername = 'dev2';

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
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        mockIdGenerator,
      );

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

  describe('verifyCommentOwner function', () => {
    it('should throw NotFoundError when comment not exist', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);

      await expect(
        commentRepositoryPostgres.verifyCommentOwner('comment-xxx', 'user-xxx'),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when given invalid owner', async () => {
      const idGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        idGenerator,
      );
      const { id } = await commentRepositoryPostgres.addComment({
        content: 'comment conter',
        threadId,
        owner: commentedUserId,
      });
      await expect(commentRepositoryPostgres.verifyCommentOwner(id, 'user-xxx'))
        .rejects
        .toThrowError(AuthorizationError);
    });

    it('should not throw error when given valid payload', async () => {
      const idGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, idGenerator);
      const { id } = await commentRepositoryPostgres.addComment({
        content: 'true comment',
        threadId,
        owner: commentedUserId,
      });
      await expect(commentRepositoryPostgres.verifyCommentOwner(id, commentedUserId))
        .resolves
        .not.toThrowError();
    });
  });

  describe('deleteCommentById function', () => {
    it('should change is_delete value to true', async () => {
      const idGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, idGenerator);

      const { id } = await commentRepositoryPostgres.addComment({
        content: 'comment for delete',
        threadId,
        owner: commentedUserId,
      });

      await commentRepositoryPostgres.deleteCommentById(id);

      const [comment] = await CommentsTableTestHelper.findById(id);

      expect(comment.is_delete).toEqual(true);
    });

    it('should throw error when given invalid commentId', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);

      await expect(commentRepositoryPostgres.deleteCommentById('comment-xxx'))
        .rejects
        .toThrowError(NotFoundError);
    });
  });

  describe('getCommentsByThreadId', () => {
    it('should have total comments correctly', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-0001',
        threadId,
        owner: commentedUserId,
        content: 'default content',
      });

      async function addCommentForAnotherThread() {
        await ThreadsTableTestHelper.addThread({
          id: 'thread-xxx',
          owner: commentedUserId,
        });

        await CommentsTableTestHelper.addComment({
          id: 'comment-0002',
          threadId: 'thread-xxx',
          owner: commentedUserId,
          content: 'another content',
        });
      }

      await addCommentForAnotherThread();

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);

      const comments = await commentRepositoryPostgres.getCommentsByThreadId(threadId);

      expect(comments).toHaveLength(1);
    });

    it('each comment should have correct property and value', async () => {
      const date = new Date();
      const payloadComment = {
        threadId,
        content: 'default comment',
        owner: commentedUserId,
        id: 'comment-0001',
        date,
      };

      await CommentsTableTestHelper.addComment(payloadComment);

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      const expecetedComments = [new Comment({
        id: 'comment-0001',
        content: 'default comment',
        username: commentedUsername,
        date,
        is_delete: false,
      })];

      const comments = await commentRepositoryPostgres.getCommentsByThreadId(threadId);
      expect(comments).toStrictEqual(expecetedComments);
    });
  });

  describe('verifyCommentIsExist function', () => {
    it('should throw not found error when given invalid commentId', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);

      await expect(commentRepositoryPostgres.verifyCommentIsExist('xxx'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should not throw error when given valid commentId', async () => {
      const payload = {
        threadId, owner: commentedUserId, id: 'comment-xxx', content: 'exmaple comment',
      };
      await CommentsTableTestHelper.addComment(payload);

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool);
      await expect(commentRepositoryPostgres.verifyCommentIsExist(payload.id))
        .resolves
        .not
        .toThrow();
    });
  });
});
