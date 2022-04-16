/* eslint-disable operator-linebreak */
class Comment {
  constructor(payload) {
    this._verifyPayload(payload);
    this.id = payload.id;
    this.content = payload.is_delete
      ? '**komentar telah dihapus**'
      : payload.content;
    this.username = payload.username;
    this.date = payload.date;
  }

  _verifyPayload(payload) {
    const {
      id, username, content, is_delete: isDelete, date,
    } = payload;

    if (id == null || username == null || content == null || isDelete == null) {
      throw new Error('COMMENT_ENTITY.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof id !== 'string' ||
      typeof username !== 'string' ||
      typeof content !== 'string' ||
      typeof isDelete !== 'boolean' ||
      (date instanceof Date) === false
    ) {
      throw new Error('COMMENT_ENTITY.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = Comment;
