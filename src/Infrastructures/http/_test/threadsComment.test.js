const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

describe('/threads/{threadId}/comments endpoint', () => {
  const userJohn = {
    fullname: 'john',
    username: 'userjohn',
    password: 'user',
    id: '',
    accessToken: '',
  };

  const userDoe = {
    fullname: 'doe',
    username: 'doe_dummay',
    password: 'user',
    id: '',
    accessToken: '',
  };

  beforeAll(async () => {
    const server = await createServer(container);

    const responseCreateUserJohn = await server.inject({
      method: 'POST',
      url: '/users',
      payload: userJohn,
    });

    userJohn.id = JSON.parse(responseCreateUserJohn.payload).data.addedUser.id;

    const responseCreateUser2 = await server.inject({
      method: 'POST',
      url: '/users',
      payload: userDoe,
    });

    userDoe.id = JSON.parse(responseCreateUser2.payload).data.addedUser.id;

    const responseLoginUser1 = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username: userJohn.username,
        password: userJohn.password,
      },
    });

    const responseLoginUser2 = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username: userDoe.username,
        password: userDoe.password,
      },
    });

    userJohn.accessToken = JSON.parse(responseLoginUser1.payload).data.accessToken;
    userDoe.accessToken = JSON.parse(responseLoginUser2.payload).data.accessToken;
  });

  afterAll(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  describe('when POST /threads/{threadId}/comments/', () => {
    it('should response 401 when not given accessToken', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-xxx/comments',
        payload: {},
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(401);
      expect(responseJson).toHaveProperty('message');
      expect(responseJson.message).toEqual('Missing authentication');
    });

    it('should response 400 when request payload not contain needed property', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-xxx/comments',
        payload: { },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('harus melampirkan content dari komentar');
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-xxx/comments',
        payload: {
          content: false,
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('content komentar harus berupa string');
    });

    it('should response 404 when given invalid threadId', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-xxx/comments',
        payload: {
          content: 'Ini Example Komentar',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Gagal menemukan thread');
    });

    it('should response 201 and new comment', async () => {
      const server = await createServer(container);

      const responsePostThread = await server.inject({
        url: '/threads',
        method: 'POST',
        payload: {
          title: 'Thread Example',
          body: 'Thread Example Body',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const { addedThread } = JSON.parse(responsePostThread.payload).data;

      const payloadComment = {
        content: 'Example Content',
      };

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments`,
        payload: payloadComment,
        headers: {
          Authorization: `Bearer ${userDoe.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson).toHaveProperty('data');
      expect(responseJson.data).toHaveProperty('addedComment');
      const { addedComment } = responseJson.data;
      expect(addedComment).toHaveProperty('id');
      expect(typeof addedComment.id).toEqual('string');
      expect(addedComment).toHaveProperty('owner');
      expect(addedComment.owner).toEqual(userDoe.id);
      expect(addedComment).toHaveProperty('content');
      expect(addedComment.content).toEqual(payloadComment.content);
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should response 401 status code when not given access token', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-xxx/comments/comment-xxx',
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.message).toEqual('Missing authentication');
    });

    it('should response 404 status code when given invalid thread id', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-xxx/comments/comment-xxx',
        headers: {
          Authorization: `Bearer ${userDoe.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Gagal menemukan thread');
    });

    it('should response 404 status code when given invalid comment id', async () => {
      const server = await createServer(container);

      const responseAddThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Thread',
          body: 'Body thread',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const { addedThread } = JSON.parse(responseAddThread.payload).data;
      const response = await server.inject({
        url: `/threads/${addedThread.id}/comments/comment-xxx`,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${userDoe.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Komentar tidak ditemukan');
    });

    it('should response 403 status code when invalid owner', async () => {
      const server = await createServer(container);

      const responseAddThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Thread',
          body: 'Body thread',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const { addedThread } = JSON.parse(responseAddThread.payload).data;

      const responseAddComment = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments`,
        payload: {
          content: 'Example Comment',
        },
        headers: {
          Authorization: `Bearer ${userDoe.accessToken}`,
        },
      });
      const { addedComment } = JSON.parse(responseAddComment.payload).data;

      const response = await server.inject({
        url: `/threads/${addedThread.id}/comments/${addedComment.id}`,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`, // john try to deleting doe's comment
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual('fail');
    });

    it('should response 200 status coden when given valid threadId, commentId, and owner', async () => {
      const server = await createServer(container);

      const responseAddThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Thread',
          body: 'Body thread',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const { addedThread } = JSON.parse(responseAddThread.payload).data;

      const responseAddComment = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments`,
        payload: {
          content: 'Example Comment',
        },
        headers: {
          Authorization: `Bearer ${userDoe.accessToken}`, // comment user 2
        },
      });
      const { addedComment } = JSON.parse(responseAddComment.payload).data;

      const response = await server.inject({
        url: `/threads/${addedThread.id}/comments/${addedComment.id}`,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${userDoe.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });
  });

  describe('when POST /threads/{threadId}/comments/{commentId}', () => {
    it('should response 401 Unauthorized when request without access token', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-xxx/comments/comment-xxx/replies',
        payload: {
          content: 'reply',
        },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(401);
      expect(responseJson.message).toEqual('Missing authentication');
    });

    it('should response 404 status code when threadId is invalid', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'POST',
        url: '/threads/thread-xxx/comments/comment-xxx/replies',
        payload: {
          content: 'reply',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Gagal menemukan thread');
    });

    it('should response 404 status code when commentId is invalid', async () => {
      const server = await createServer(container);

      const responsePostThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread',
          body: 'example thread',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const { addedThread } = JSON.parse(responsePostThread.payload).data;

      const response = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments/comment-xxx/replies`,
        payload: {
          content: 'reply',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 400 status code when request body is invalid', async () => {
      const server = await createServer(container);

      const responsePostThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread',
          body: 'example thread',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const { addedThread } = JSON.parse(responsePostThread.payload).data;

      const responsePostComment = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments`,
        payload: {
          content: "doe comment on joh's thread",
        },
        headers: {
          Authorization: `Bearer ${userDoe.accessToken}`,
        },
      });

      const { addedComment } = JSON.parse(responsePostComment.payload).data;

      // john reply to doe's comment
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments/${addedComment.id}/replies`,
        payload: {
          content: '', // bad request
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('content harus string dan tidak kosong');
    });

    it('should response 201 created reply comment', async () => {
      const server = await createServer(container);

      const responsePostThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread',
          body: 'example thread',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const { addedThread } = JSON.parse(responsePostThread.payload).data;

      const responsePostComment = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments`,
        payload: {
          content: 'Hello John, I\'m Doe from Wakanda',
        },
        headers: {
          Authorization: `Bearer ${userDoe.accessToken}`,
        },
      });

      const { addedComment } = JSON.parse(responsePostComment.payload).data;

      // john reply to doe's comment
      const content = 'Hello Doe';
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments/${addedComment.id}/replies`,
        payload: {
          content,
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data).toBeDefined();
      expect(responseJson.data).toHaveProperty('addedReply');
      expect(responseJson.data.addedReply).toBeDefined();
      expect(responseJson.data.addedReply).toHaveProperty('id');
      expect(typeof responseJson.data.addedReply.id).toEqual('string');
      expect(responseJson.data.addedReply).toHaveProperty('content');
      expect(responseJson.data.addedReply.content).toEqual(content);
      expect(responseJson.data.addedReply).toHaveProperty('owner');
      expect(responseJson.data.addedReply.owner).toEqual(userJohn.id);
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
    it('should response 401 Unauthorized when request without access token', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-xxx/comments/comment-xxx/replies/reply-xxx',
        payload: {
          content: 'reply',
        },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(401);
      expect(responseJson.message).toEqual('Missing authentication');
    });

    it('should response 404 status code when threadId is invalid', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/thread-xxx/comments/comment-xxx/replies/reply-xxx',
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Gagal menemukan thread');
    });

    it('should response 404 status code when commentId is invalid', async () => {
      const server = await createServer(container);

      const responsePostThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread',
          body: 'example thread',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const { addedThread } = JSON.parse(responsePostThread.payload).data;

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${addedThread.id}/comments/comment-xxx/replies/reply-xxx`,
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 404 status code when replyId is invalid', async () => {
      const server = await createServer(container);

      const responsePostThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread',
          body: 'example thread',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const { addedThread } = JSON.parse(responsePostThread.payload).data;

      const responsePostComment = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments`,
        payload: {
          content: "Hello John, I'm Doe from Wakanda",
        },
        headers: {
          Authorization: `Bearer ${userDoe.accessToken}`,
        },
      });

      const { addedComment } = JSON.parse(responsePostComment.payload).data;

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${addedThread.id}/comments/${addedComment.id}/replies/reply-xxx`,
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });
      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 403 status code when owner is invalid', async () => {
      const server = await createServer(container);

      const responsePostThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread',
          body: 'example thread',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const { addedThread } = JSON.parse(responsePostThread.payload).data;

      const responsePostComment = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments`,
        payload: {
          content: "Hello John, I'm Doe from Wakanda",
        },
        headers: {
          Authorization: `Bearer ${userDoe.accessToken}`,
        },
      });

      const { addedComment } = JSON.parse(responsePostComment.payload).data;

      // john reply to doe's comment
      const responseReplyCommentJohn = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments/${addedComment.id}/replies`,
        payload: {
          content: 'Hello Doe',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const { addedReply } = JSON.parse(responseReplyCommentJohn.payload).data;

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${addedThread.id}/comments/${addedComment.id}/replies/${addedReply.id}`,
        headers: {
          Authorization: `Bearer ${userDoe.accessToken}`, // doe trying to delete john's comment
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('anda tidak berhak mengakses resource ini');
    });

    it('should response 403 status code when owner is invalid', async () => {
      const server = await createServer(container);

      const responsePostThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'thread',
          body: 'example thread',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const { addedThread } = JSON.parse(responsePostThread.payload).data;

      const responsePostComment = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments`,
        payload: {
          content: "Hello John, I'm Doe from Wakanda",
        },
        headers: {
          Authorization: `Bearer ${userDoe.accessToken}`,
        },
      });

      const { addedComment } = JSON.parse(responsePostComment.payload).data;

      // john reply to doe's comment
      const responseReplyCommentJohn = await server.inject({
        method: 'POST',
        url: `/threads/${addedThread.id}/comments/${addedComment.id}/replies`,
        payload: {
          content: 'Hello Doe',
        },
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const { addedReply } = JSON.parse(responseReplyCommentJohn.payload).data;

      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${addedThread.id}/comments/${addedComment.id}/replies/${addedReply.id}`,
        headers: {
          Authorization: `Bearer ${userJohn.accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });
  });
});
