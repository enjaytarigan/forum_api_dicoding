const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const CommentRepository = require('../../Domains/comments/CommentRepository');
const Comment = require('../../Domains/comments/entities/Comment');
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

  async deleteCommentById(commentId) {
    const query = {
      text: 'UPDATE comments SET is_delete = true WHERE id = $1 RETURNING id',
      values: [commentId],
    };

    const { rowCount } = await this._pool.query(query);

    if (rowCount === 0) {
      throw new NotFoundError('Komentar tidak ditemukan');
    }
  }

  async verifyCommentOwner(commentId, owner) {
    const query = {
      text: 'SELECT owner FROM comments WHERE id = $1',
      values: [commentId],
    };

    const { rows } = await this._pool.query(query);

    if (rows.length === 0) {
      throw new NotFoundError('Komentar tidak ditemukan');
    }

    const comment = rows[0];

    if (comment.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: `SELECT comments.*, users.username
             FROM comments
             JOIN users ON comments.owner = users.id
             WHERE comments.thread_id = $1`,
      values: [threadId],
    };

    const { rows } = await this._pool.query(query);

    const mapDBToComment = (comment) => new Comment({ ...comment, date: comment.created_at });

    return rows.map(mapDBToComment);
  }

  async verifyCommentIsExist(commentId) {
    const query = {
      text: 'SELECT id FROM comments WHERE id = $1',
      values: [commentId],
    };

    const { rows } = await this._pool.query(query);

    if (rows.length === 0) {
      throw new NotFoundError('komentar tidak ditemukan');
    }

    return true;
  }
}

module.exports = CommentRepositoryPostgres;
