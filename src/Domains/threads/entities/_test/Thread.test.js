const Thread = require('../Thread');

describe('Thread entity', () => {
  it('should throw error when payload not contain needed property', () => {
    expect(() => new Thread({})).toThrowError(
      'THREAD_ENTITY.NOT_CONTAIN_NEEDED_PROPERTY',
    );
  });

  it('should throw error when payload not meet data type specification', () => {
    const payload = {
      id: {},
      date: {},
      body: 10,
      title: [],
      username: true,
    };

    expect(() => new Thread(payload)).toThrowError(
      'THREAD_ENTITY.NOT_MEET_DATA_TYPE_SPECIFICATION',
    );
  });

  it('should create Thread entity correctly', () => {
    const payload = {
      id: 'thread-123',
      date: new Date(),
      title: 'Thread Title',
      body: 'Thread body',
      username: 'user',
    };

    const thread = new Thread(payload);

    expect(payload.id).toEqual(thread.id);
    expect(payload.date).toEqual(thread.date);
    expect(payload.title).toEqual(thread.title);
    expect(payload.body).toEqual(thread.body);
    expect(payload.username).toEqual(thread.username);
  });
});
