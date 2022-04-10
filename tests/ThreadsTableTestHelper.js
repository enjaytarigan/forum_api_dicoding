/* istanbul ignore file */

const pool = require('../src/Infrastructures/database/postgres/pool');

const ThreadsTableTestHelper = {
  async addThread({
    id = 'thread-1001',
    title = 'Example Thread',
    body = 'thread for test',
    owner = 'user-123',
  }) {
    const query = {
      text: `INSERT INTO 
             threads(id, title, body, owner) 
             VALUES($1, $2, $3, $4)`,
      values: [id, title, body, owner],
    };

    await pool.query(query);
  },

  async cleanTable() {
    await pool.query('DELETE FROM threads WHERE 1=1');
  },

  async findById(id) {
    const query = {
      text: 'SELECT * FROM threads WHERE id = $1',
      values: [id],
    };

    const { rows } = await pool.query(query);
    return rows;
  },
};

module.exports = ThreadsTableTestHelper;
