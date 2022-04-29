const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const container = require('../../container');
const pool = require('../../database/postgres/pool');
const createServer = require('../createServer');

describe('/threads endpoint', () => {
  const exampleUser = {
    fullname: 'example user',
    username: 'example',
    password: 'example',
  };
  beforeAll(async () => {
    const server = await createServer(container);

    await server.inject({
      method: 'POST',
      url: '/users',
      payload: exampleUser,
    });
  });

  afterAll(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await pool.end();
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
  });

  describe('when POST /threads', () => {
    it('should throw 401 if not authenticated', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        url: '/threads',
        method: 'POST',
        payload: {},
      });

      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson).toHaveProperty('message');
      expect(responseJson.message).toEqual('Missing authentication');
    });

    it('should throw 400 if request payload not contain needed property', async () => {
      const server = await createServer(container);

      const responseAuth = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: exampleUser.username,
          password: exampleUser.password,
        },
      });

      const { accessToken } = JSON.parse(responseAuth.payload).data;

      const responseThread = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: {
          title: 'Example Thread',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseThreadJson = JSON.parse(responseThread.payload);
      expect(responseThread.statusCode).toEqual(400);
      expect(responseThreadJson.status).toEqual('fail');
      expect(typeof responseThreadJson.message).toEqual('string');
    });

    it('should throw 400 if request payload not meet data type specification', async () => {
      const server = await createServer(container);

      const responseAuth = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: exampleUser.username,
          password: exampleUser.password,
        },
      });
      const { accessToken } = JSON.parse(responseAuth.payload).data;

      const response = await server.inject({
        url: '/threads',
        method: 'POST',
        payload: {
          title: {},
          body: false,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('title dan body harus string');
    });

    it('should response 201 and response new thread', async () => {
      const server = await createServer(container);

      const responseAuth = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: exampleUser.username,
          password: exampleUser.password,
        },
      });
      const { accessToken } = JSON.parse(responseAuth.payload).data;

      const payloadThread = {
        title: 'Dicoding Thread',
        body: 'Hello Thread',
      };

      const response = await server.inject({
        url: '/threads',
        method: 'POST',
        payload: payloadThread,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data).toBeDefined();
      expect(responseJson.data).toHaveProperty('addedThread');

      const { id, title, owner } = responseJson.data.addedThread;

      expect(id).not.toEqual('');
      expect(title).not.toEqual('');
      expect(owner).not.toEqual('');
      expect(typeof id).toEqual('string');
      expect(title).toEqual(payloadThread.title);
      expect(typeof owner).toEqual('string');
    });
  });

  describe('when GET /threads/{threadId}', () => {
    it('should response 404 status code when given invalid thread id', async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: 'GET',
        url: '/threads/thread-xxx',
      });

      const responseJson = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('Gagal menemukan thread');
    });

    it('should response 200 status code and detail thread correctly', async () => {
      const server = await createServer(container);

      const userJohnPayload = {
        username: 'johndoe_dummy',
        password: 'user',
        fullname: 'john doe',
      };

      const userDoePayload = {
        username: 'doe_dummy',
        password: 'user',
        fullname: 'doe doe',
      };

      await server.inject({
        url: '/users',
        method: 'POST',
        payload: userJohnPayload,
      });

      await server.inject({
        url: '/users',
        method: 'POST',
        payload: userDoePayload,
      });

      // john login
      const responseAuthUserJohn = await server.inject({
        url: '/authentications',
        method: 'POST',
        payload: {
          username: userJohnPayload.username,
          password: userJohnPayload.password,
        },
      });

      // doe login
      const responseAuthUserDoe = await server.inject({
        url: '/authentications',
        method: 'POST',
        payload: {
          username: userDoePayload.username,
          password: userDoePayload.password,
        },
      });

      const accessTokenJohn = JSON.parse(responseAuthUserJohn.payload).data.accessToken;
      const accessTokenDoe = JSON.parse(responseAuthUserDoe.payload).data.accessToken;

      const payloadThreadJohn = {
        title: 'Thread John',
        body: 'Example...',
      };
      // john post thread
      const responsePostThreadJson = await server.inject({
        url: '/threads',
        method: 'POST',
        payload: payloadThreadJohn,
        headers: {
          Authorization: `Bearer ${accessTokenJohn}`,
        },
      });

      const { addedThread: threadJohn } = JSON.parse(responsePostThreadJson.payload).data;

      // comment 1
      const responsePostCommentDoe = await server.inject({
        url: `/threads/${threadJohn.id}/comments`,
        method: 'POST',
        payload: {
          content: 'comment 1',
        },
        headers: {
          Authorization: `Bearer ${accessTokenDoe}`,
        },
      });
      const { addedComment: firstComment } = JSON.parse(responsePostCommentDoe.payload).data;

      // reply to comment 1
      await server.inject({
        url: `/threads/${threadJohn.id}/comments/${firstComment.id}/replies`,
        method: 'POST',
        payload: {
          content: 'reply comment 1',
        },
        headers: {
          Authorization: `Bearer ${accessTokenJohn}`,
        },
      });

      // comment 2
      const responseSecondCommentDoe = await server.inject({
        url: `/threads/${threadJohn.id}/comments`,
        method: 'POST',
        payload: {
          content: 'comment 2',
        },
        headers: {
          Authorization: `Bearer ${accessTokenDoe}`,
        },
      });

      const { addedComment: secondCommentDoe } = JSON.parse(responseSecondCommentDoe.payload).data;

      // doe deleted the second comment
      await server.inject({
        url: `/threads/${threadJohn.id}/comments/${secondCommentDoe.id}`,
        method: 'DELETE',
        payload: {
          content: 'comment 1',
        },
        headers: {
          Authorization: `Bearer ${accessTokenDoe}`,
        },
      });

      // get thread john

      const responseGetThreadByIdJohn = await server.inject({
        method: 'GET',
        url: `/threads/${threadJohn.id}`,
      });

      const responseJson = JSON.parse(responseGetThreadByIdJohn.payload);

      expect(responseGetThreadByIdJohn.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
      expect(responseJson).toHaveProperty('data');
      expect(responseJson.data).toHaveProperty('thread');
      const { thread } = responseJson.data;
      expect(thread.id).toEqual(threadJohn.id);
      expect(thread.title).toEqual(payloadThreadJohn.title);
      expect(thread.body).toEqual(payloadThreadJohn.body);
      expect(thread.username).toEqual(userJohnPayload.username);
      expect(thread.comments).toHaveLength(2);
      const deletedComment = thread.comments.find((comment) => comment.id === secondCommentDoe.id);
      const firstCommentDoe = thread.comments.find((comment) => comment.id === firstComment.id);

      expect(deletedComment.content).toEqual('**komentar telah dihapus**');
      expect(firstCommentDoe).toHaveProperty('replies');
      expect(firstCommentDoe.replies).toHaveLength(1);
    });
  });
});
