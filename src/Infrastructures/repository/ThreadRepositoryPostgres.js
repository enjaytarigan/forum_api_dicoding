const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const NewThread = require('../../Domains/threads/entities/NewThread');
const Thread = require('../../Domains/threads/entities/Thread');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addThread({ title, body, owner }) {
    const threadId = `thread-${this._idGenerator()}`;

    const query = {
      text: `INSERT INTO threads(id, title, body, owner)
             VALUES($1, $2, $3, $4)
             RETURNING id, title, owner`,
      values: [threadId, title, body, owner],
    };

    const { rows } = await this._pool.query(query);
    return new NewThread(rows[0]);
  }

  async verifyThreadIsExist(id) {
    const query = {
      text: 'SELECT title FROM threads WHERE id = $1',
      values: [id],
    };

    const { rows } = await this._pool.query(query);

    if (rows.length === 0) {
      throw new NotFoundError('Gagal menemukan thread');
    }
  }

  async getThreadById(id) {
    const query = {
      text: `
      SELECT threads.*, users.username
      FROM threads
      JOIN users ON threads.owner = users.id
      WHERE threads.id = $1`,
      values: [id],
    };

    const { rows } = await this._pool.query(query);

    if (rows.length === 0) {
      throw new NotFoundError('Gagal menemukan thread');
    }
    const [thread] = rows;

    return new Thread({
      ...thread,
      date: thread.created_at,
    });
  }
}

module.exports = ThreadRepositoryPostgres;
