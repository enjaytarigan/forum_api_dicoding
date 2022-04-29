/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const CommentRepliesTableTestHelper = {

  async addReply({
    content, owner, commentId, id,
  }) {
    const query = {
      text: 'INSERT INTO comment_replies(id, content, comment_id, owner) VALUES($1, $2, $3, $4)',
      values: [id, content, commentId, owner],
    };

    await pool.query(query);
  },

  async findComment(commentId) {
    const query = {
      text: 'SELECT * FROM comment_replies WHERE id = $1',
      values: [commentId],
    };

    const { rows } = await pool.query(query);

    return rows;
  },
  async cleanTable() {
    await pool.query('DELETE FROM comment_replies WHERE 1=1');
  },

};

module.exports = CommentRepliesTableTestHelper;
