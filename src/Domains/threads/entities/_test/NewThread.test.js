const NewThread = require('../NewThread');

describe('NewThread', () => {
  it('should throw error when payload not contain property needed', () => {
    const payload = {
      title: 'thread',
      id: 'thread-123',
    };

    expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    const payload = {
      title: 123,
      owner: {},
      id: [],
    };

    expect(() => new NewThread(payload)).toThrowError('NEW_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should created NewThread entity correctly', () => {
    const payload = {
      title: 'thread a',
      owner: 'user-123',
      id: 'thread-123',
    };

    const newThread = new NewThread(payload);

    expect(newThread).toBeInstanceOf(NewThread);
    expect(newThread.id).toEqual(payload.id);
    expect(newThread.title).toEqual(payload.title);
    expect(newThread.owner).toEqual(payload.owner);
  });
});
