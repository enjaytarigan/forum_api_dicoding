const NewThread = require('../../Domains/threads/entities/NewThread');
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
}

module.exports = ThreadRepositoryPostgres;
