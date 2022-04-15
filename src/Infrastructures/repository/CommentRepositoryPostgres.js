const CommentRepository = require('../../Domains/comments/CommentRepository');
const NewComment = require('../../Domains/comments/entities/NewComment');

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment({ content, owner, threadId }) {
    const id = `comment-${this._idGenerator()}`;
    const query = {
      text: `INSERT INTO 
             comments(id, content, owner, thread_id) 
             VALUES($1, $2, $3, $4)
             RETURNING id, content, owner`,
      values: [id, content, owner, threadId],
    };

    const { rows } = await this._pool.query(query);

    return new NewComment({ ...rows[0] });
  }
}

module.exports = CommentRepositoryPostgres;
