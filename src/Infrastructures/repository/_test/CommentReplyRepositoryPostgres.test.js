const pool = require('../../database/postgres/pool');
const CommentReplyRepositoryPostgres = require('../CommentReplyRepositoryPostgres');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentRepliesTableTestHelper = require('../../../../tests/CommentRepliesTableTestHelper');
const NewComment = require('../../../Domains/comments/entities/NewComment');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('ComentReplyRepositoryPostgres', () => {
  const payloadUserJohn = { id: 'user-001', fullname: 'john', username: 'john_user' };
  const payloadUserDoe = { id: 'user-002', fullname: 'doe', username: 'doe_user' };
  const payloadThreadJohn = {
    id: 'thread-0001', title: 'thread john', body: 'body thread john', owner: payloadUserJohn.id,
  };

  beforeAll(async () => {
    await UsersTableTestHelper.addUser(payloadUserJohn);
    await UsersTableTestHelper.addUser(payloadUserDoe);
    await ThreadsTableTestHelper.addThread(payloadThreadJohn);
  });

  afterEach(async () => {
    await CommentRepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  describe('addReplyComment function', () => {
    it('should add reply comment to database', async () => {
      const commentPayload = {
        id: 'comment-0001',
        threadId: payloadThreadJohn.id,
        owner: payloadUserJohn.id,
        content: 'john comment to his thread',
      };

      const replyPayload = {
        commentId: commentPayload.id,
        content: 'doe reply to john\'s comment',
        owner: payloadUserDoe.id,
      };

      const idGenerator = () => '0001';

      await CommentsTableTestHelper.addComment(commentPayload);

      const commentReplyRepositoryPostgres = new CommentReplyRepositoryPostgres(pool, idGenerator);

      await commentReplyRepositoryPostgres.addReplyComment(replyPayload);

      const commentReplies = await CommentRepliesTableTestHelper.findComment(`reply-${idGenerator()}`);

      expect(commentReplies.length).toEqual(1);
    });

    it('should return new comment correctly', async () => {
      const commentPayload = {
        id: 'comment-0002',
        threadId: payloadThreadJohn.id,
        owner: payloadUserJohn.id,
        content: 'john comment to his thread',
      };

      const replyPayload = {
        commentId: commentPayload.id,
        content: "doe reply to john's comment",
        owner: payloadUserDoe.id,
      };

      const idGenerator = jest.fn().mockImplementation(() => '0002');

      await CommentsTableTestHelper.addComment(commentPayload);

      const commentReplyRepositoryPostgres = new CommentReplyRepositoryPostgres(
        pool,
        idGenerator,
      );

      const result = await commentReplyRepositoryPostgres.addReplyComment(replyPayload);

      const expectedResult = new NewComment({
        content: replyPayload.content,
        id: 'reply-0002',
        owner: replyPayload.owner,
      });

      expect(result).toStrictEqual(expectedResult);
      expect(idGenerator).toBeCalled();
    });
  });

  describe('findRepliesByCommentIds', () => {
    it('should return replies comment correctly', async () => {
      const firstCommentJohnPayload = {
        owner: payloadUserJohn.id,
        content: 'comment john',
        threadId: payloadThreadJohn.id,
        id: 'comment-0001',
      };

      const firstCommentDoePayload = {
        owner: payloadUserDoe.id,
        content: 'comment doe',
        threadId: payloadThreadJohn.id,
        id: 'comment-0002',
      };

      const replyCommentJohn = {
        owner: payloadUserDoe.id,
        content: 'doe reply john\'s comment',
        commentId: firstCommentJohnPayload.id,
        id: 'reply-0001',
      };

      const replyCommentDoe = {
        owner: payloadUserJohn.id,
        content: 'john reply doe\'s comment',
        commentId: firstCommentDoePayload.id,
        id: 'reply-0002',
      };

      const comments = [
        firstCommentDoePayload,
        firstCommentJohnPayload,
      ].map((commentPayload) => CommentsTableTestHelper.addComment(commentPayload));

      // const replies = [
      //   replyCommentJohn,
      //   replyCommentDoe,
      // ].map((replyPayload) => CommentRepliesTableTestHelper.addReply(replyPayload));

      await Promise.all(comments);
      await CommentRepliesTableTestHelper.addReply(replyCommentDoe);
      await CommentRepliesTableTestHelper.addReply(replyCommentJohn);

      const commentReplyRepositoryPostgres = new CommentReplyRepositoryPostgres(pool);
      const findPayload = [
        firstCommentDoePayload.id,
        firstCommentJohnPayload.id,
      ];

      const resultReplies = await commentReplyRepositoryPostgres
        .findRepliesByCommentIds(findPayload);

      expect(resultReplies).toHaveLength(2);
    });
  });

  describe('verifyReplyCommentIsExist function', () => {
    it('should throw NotFoundError when given invalid replyId', async () => {
      const commentReplyRepositoryPostgres = new CommentReplyRepositoryPostgres(pool);

      await expect(commentReplyRepositoryPostgres.verifyReplyCommentIsExist('xxx'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should not throw error when replyId is valid', async () => {
      const commentPayload = {
        id: 'comment-0001',
        threadId: payloadThreadJohn.id,
        content: 'coment',
        owner: payloadUserJohn.id,
      };

      const replyPayload = {
        id: 'reply-0001',
        commentId: commentPayload.id,
        content: 'reply comment',
        owner: payloadUserDoe.id,
      };

      await CommentsTableTestHelper.addComment(commentPayload);
      await CommentRepliesTableTestHelper.addReply(replyPayload);

      const commentReplyRepository = new CommentReplyRepositoryPostgres(pool);

      await expect(commentReplyRepository.verifyReplyCommentIsExist(replyPayload.id))
        .resolves
        .not
        .toThrowError(NotFoundError);
    });
  });

  describe('verifyReplyCommentOwner function', () => {
    it('should throw not found error when given invalid replyId', async () => {
      const commentReplyRepositoryPostgres = new CommentReplyRepositoryPostgres(pool);

      await expect(commentReplyRepositoryPostgres.verifyReplyCommentOwner('xxx', 'owner'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should throw AuthorizationError when owner not match with replied comment', async () => {
      const commentPayload = {
        id: 'comment-0001',
        threadId: payloadThreadJohn.id,
        content: 'coment',
        owner: payloadUserJohn.id,
      };

      const replyPayload = {
        id: 'reply-0001',
        commentId: commentPayload.id,
        content: 'reply comment',
        owner: payloadUserDoe.id,
      };

      await CommentsTableTestHelper.addComment(commentPayload);
      await CommentRepliesTableTestHelper.addReply(replyPayload);

      const commentReplyRepositoryPostgres = new CommentReplyRepositoryPostgres(pool);

      await expect(commentReplyRepositoryPostgres.verifyReplyCommentOwner(replyPayload.id, 'owner-xxx'))
        .rejects
        .toThrowError(AuthorizationError);
    });

    it('should not throw error when replyId and owner is valid', async () => {
      const commentPayload = {
        id: 'comment-0001',
        threadId: payloadThreadJohn.id,
        content: 'coment',
        owner: payloadUserJohn.id,
      };

      const replyPayload = {
        id: 'reply-0001',
        commentId: commentPayload.id,
        content: 'reply comment',
        owner: payloadUserDoe.id,
      };

      await CommentsTableTestHelper.addComment(commentPayload);
      await CommentRepliesTableTestHelper.addReply(replyPayload);

      const commentReplyRepositoryPostgres = new CommentReplyRepositoryPostgres(pool);

      await expect(
        commentReplyRepositoryPostgres.verifyReplyCommentOwner(
          replyPayload.id,
          replyPayload.owner,
        ),
      ).resolves.not.toThrowError(AuthorizationError);

      await expect(
        commentReplyRepositoryPostgres.verifyReplyCommentOwner(
          replyPayload.id,
          replyPayload.owner,
        ),
      ).resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('deleteReplyCommentById function', () => {
    it('should throw not found error when given invalid replyId', async () => {
      const commentReplyRepositoryPostgres = new CommentReplyRepositoryPostgres(pool);

      await expect(commentReplyRepositoryPostgres.deleteReplyCommentById('reply-xxx'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should mark is_delete value to true', async () => {
      const commentPayload = {
        id: 'comment-0001',
        threadId: payloadThreadJohn.id,
        content: 'coment',
        owner: payloadUserJohn.id,
      };

      const replyPayload = {
        id: 'reply-0001',
        commentId: commentPayload.id,
        content: 'reply comment',
        owner: payloadUserDoe.id,
      };

      await CommentsTableTestHelper.addComment(commentPayload);
      await CommentRepliesTableTestHelper.addReply(replyPayload);

      const commentReplyRepositoryPostgres = new CommentReplyRepositoryPostgres(pool);

      await commentReplyRepositoryPostgres.deleteReplyCommentById(replyPayload.id);

      const replies = await CommentRepliesTableTestHelper.findComment(replyPayload.id);
      expect(replies[0].is_delete).toEqual(true);
    });
  });
});
