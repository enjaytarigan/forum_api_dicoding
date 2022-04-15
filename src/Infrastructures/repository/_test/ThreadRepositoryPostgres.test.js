const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const NewThread = require('../../../Domains/threads/entities/NewThread');
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');

describe('ThreadRepository', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
  });

  beforeEach(async () => {
  });

  beforeAll(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-0001' });
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist thread in database', async () => {
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );
      const thread = {
        title: 'New Thread',
        body: 'Body New Thread',
        owner: 'user-0001',
      };
      await threadRepositoryPostgres.addThread(thread);
      const threads = await ThreadsTableTestHelper.findById('thread-123');

      expect(threads).toHaveLength(1);
    });

    it('should return new thread correclty', async () => {
      const fakeIdGenerator = jest.fn().mockImplementation(() => '123');

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      const thread = {
        title: 'New Thread',
        body: 'Body New Thread',
        owner: 'user-0001',
      };

      const addedThread = await threadRepositoryPostgres.addThread(thread);
      expect(addedThread).toStrictEqual(
        new NewThread({
          id: 'thread-123',
          title: 'New Thread',
          owner: 'user-0001',
        }),
      );
      expect(fakeIdGenerator).toBeCalledTimes(1);
    });
  });

  describe('verifyThreadIsExist function', () => {
    it('should throw NotFound error when thread not exist in database', async () => {
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool);

      await expect(threadRepositoryPostgres.verifyThreadIsExist('thread-123-wrong'))
        .rejects
        .toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when thread is exist', async () => {
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool);
      const threadId = 'thread-0001';
      await ThreadsTableTestHelper.addThread({
        id: threadId,
        title: 'exmaple',
        owner: 'user-0001',
        body: 'example body',
      });
      await expect(threadRepositoryPostgres.verifyThreadIsExist(threadId))
        .resolves
        .not
        .toThrowError(NotFoundError);
    });
  });
});
