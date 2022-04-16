/* eslint-disable operator-linebreak */
class Thread {
  constructor(payload) {
    this._verifyPayload(payload);
    this.id = payload.id;
    this.title = payload.title;
    this.body = payload.body;
    this.date = payload.date;
    this.username = payload.username;
  }

  _verifyPayload(payload) {
    const {
      id, title, body, date, username,
    } = payload;

    if (
      id == null ||
      title == null ||
      body == null ||
      username == null ||
      date == null
    ) {
      throw new Error('THREAD_ENTITY.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof id !== 'string' ||
      typeof username !== 'string' ||
      typeof body !== 'string' ||
      typeof title !== 'string' ||
      (date instanceof Date) === false
    ) {
      throw new Error('THREAD_ENTITY.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = Thread;
