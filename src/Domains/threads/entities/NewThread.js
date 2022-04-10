class NewThread {
  constructor(payload) {
    this._verifyPayload(payload);
    this.title = payload.title;
    this.owner = payload.owner;
    this.id = payload.id;
  }

  _verifyPayload(payload) {
    const {
      title, owner, id,
    } = payload;

    if (title == null || owner == null || id == null) {
      throw new Error('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof title !== 'string' || typeof owner !== 'string' || typeof id !== 'string') {
      throw new Error('NEW_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = NewThread;
