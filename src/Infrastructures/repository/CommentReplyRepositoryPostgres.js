const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const NewComment = require('../../Domains/comments/entities/NewComment');
const CommentReplyRepository = require('../../Domains/comment_replies/CommentReplyRepository');

class CommentReplyRepositoryPostgres extends CommentReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addReplyComment({ content, owner, commentId }) {
    const id = `reply-${this._idGenerator()}`;
    const query = {
      text: `INSERT INTO comment_replies(id, content, owner, comment_id)
             VALUES($1, $2, $3, $4)
             RETURNING id, content, owner
        `,
      values: [id, content, owner, commentId],
    };

    const { rows } = await this._pool.query(query);

    return new NewComment({ ...rows[0] });
  }

  async findRepliesByCommentIds(commentIds) {
    const query = {
      text: `SELECT replies.*, users.username
             FROM comment_replies AS replies
             INNER JOIN users ON replies.owner = users.id
             WHERE replies.comment_id = ANY($1::text[])
             ORDER BY created_at ASC
            `,
      values: [commentIds],
    };

    const { rows } = await this._pool.query(query);
    return rows;
  }

  async verifyReplyCommentIsExist(replyId) {
    const query = {
      text: 'SELECT content FROM comment_replies WHERE id = $1',
      values: [replyId],
    };

    const { rows } = await this._pool.query(query);

    if (rows.length === 0) {
      throw new NotFoundError('komentar tidak ditemukan');
    }
  }

  async verifyReplyCommentOwner(replyId, owner) {
    const query = {
      text: 'SELECT owner FROM comment_replies WHERE id = $1',
      values: [replyId],
    };

    const { rows } = await this._pool.query(query);

    if (rows.length === 0) {
      throw new NotFoundError('komentar tidak ditemukan');
    }

    const { owner: realOwner } = rows[0];

    if (realOwner !== owner) {
      throw new AuthorizationError('anda tidak berhak mengakses resource ini');
    }
  }

  async deleteReplyCommentById(replyId) {
    const query = {
      text: 'UPDATE comment_replies SET is_delete = true WHERE id = $1 RETURNING id',
      values: [replyId],
    };

    const { rows } = await this._pool.query(query);

    if (rows.length === 0) {
      throw new NotFoundError('komentar tidak ditemukan');
    }
  }
}

module.exports = CommentReplyRepositoryPostgres;
