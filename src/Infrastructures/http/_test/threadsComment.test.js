const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');

describe('/threads/{threadId}/comments endpoint', () => {
  const user1 = {
    fullname: 'User 1',
    username: 'user1',
    password: 'user',
  };

  const user2 = {
    fullname: 'User 2',
    username: 'user2',
    password: 'user',
  };

  let accessTokenUser1 = '';
  let accessTokenUser2 = '';
  let idUser2 = '';

  beforeAll(async () => {
    const server = await createServer(container);

    await server.inject({
      method: 'POST',
      url: '/users',
      payload: user1,
    });

    const responseCreateUser2 = await server.inject({
      method: 'POST',
      url: '/users',
      payload: user2,
    });

    idUser2 = JSON.parse(responseCreateUser2.payload).data.addedUser.id;

    const responseLoginUser1 = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username: user1.username,
        password: user1.password,
      },
    });

    const responseLoginUser2 = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username: user2.username,
        password: user2.password,
      },
    });

    accessTokenUser1 = JSON.parse(responseLoginUser1.payload).data.accessToken;
    accessTokenUser2 = JSON.parse(responseLoginUser2.payload).data.accessToken;
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
          Authorization: `Bearer ${accessTokenUser1}`,
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
          Authorization: `Bearer ${accessTokenUser1}`,
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
          Authorization: `Bearer ${accessTokenUser1}`,
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
          Authorization: `Bearer ${accessTokenUser1}`,
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
          Authorization: `Bearer ${accessTokenUser2}`,
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
      expect(addedComment.owner).toEqual(idUser2);
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
          Authorization: `Bearer ${accessTokenUser2}`,
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
          Authorization: `Bearer ${accessTokenUser1}`,
        },
      });

      const { addedThread } = JSON.parse(responseAddThread.payload).data;
      const response = await server.inject({
        url: `/threads/${addedThread.id}/comments/comment-xxx`,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessTokenUser2}`,
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
          Authorization: `Bearer ${accessTokenUser1}`,
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
          Authorization: `Bearer ${accessTokenUser2}`, // comment user 2
        },
      });
      const { addedComment } = JSON.parse(responseAddComment.payload).data;

      const response = await server.inject({
        url: `/threads/${addedThread.id}/comments/${addedComment.id}`,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessTokenUser1}`, // user 1 try delete comment user 2
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
          Authorization: `Bearer ${accessTokenUser1}`,
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
          Authorization: `Bearer ${accessTokenUser2}`, // comment user 2
        },
      });
      const { addedComment } = JSON.parse(responseAddComment.payload).data;

      const response = await server.inject({
        url: `/threads/${addedThread.id}/comments/${addedComment.id}`,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessTokenUser2}`,
        },
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });
  });
});
