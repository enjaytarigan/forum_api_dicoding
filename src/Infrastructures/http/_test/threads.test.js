const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const container = require('../../container');
const pool = require('../../database/postgres/pool');
const createServer = require('../createServer');

describe('/threads endpoint', () => {
  beforeAll(async () => {
    const server = await createServer(container);

    await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        fullname: 'example user',
        username: 'example',
        password: 'example',
      },
    });
  });

  afterAll(async () => {
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
          username: 'example',
          password: 'example',
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
          username: 'example',
          password: 'example',
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
          username: 'example',
          password: 'example',
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
});
