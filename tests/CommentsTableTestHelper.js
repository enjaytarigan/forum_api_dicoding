/* istanbul ignore file */

const pool = require('../src/Infrastructures/database/postgres/pool');

const CommentsTableTestHelper = {
  async findById(id) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [id],
    };

    const { rows } = await pool.query(query);
    return rows;
  },

  async addComment({
    id, content, threadId, owner, date = new Date(),
  }) {
    const query = {
      text: `INSERT INTO 
             comments(id, content, thread_id, owner, created_at)
             VALUES($1, $2, $3, $4, $5)`,
      values: [id, content, threadId, owner, date],
    };

    await pool.query(query);
  },

  async cleanTable() {
    await pool.query('DELETE FROM comments WHERE 1=1');
  },
};

module.exports = CommentsTableTestHelper;
