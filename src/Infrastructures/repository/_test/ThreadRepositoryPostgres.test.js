const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const NewThread = require('../../../Domains/threads/entities/NewThread');
const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');

describe('ThreadRepository', () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  beforeEach(async () => {
    await UsersTableTestHelper.addUser({ id: 'user-0001' });
  });

  afterAll(async () => {
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
});
