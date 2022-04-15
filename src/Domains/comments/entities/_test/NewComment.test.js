const NewComment = require('../NewComment');

describe('NewComment entity', () => {
  it('should throw error when payload not contain needed property', () => {
    expect(() => new NewComment({})).toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload not meet data type specification', () => {
    const payload = {
      content: false,
      id: [],
      owner: {},
    };

    expect(() => new NewComment(payload)).toThrowError('NEW_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create NewComment entity correctly', () => {
    const payload = {
      id: 'comment-123',
      content: 'example content',
      owner: 'user-123',
    };

    const newComment = new NewComment(payload);

    expect(newComment).toBeInstanceOf(NewComment);
    expect(newComment.id).toEqual(payload.id);
    expect(newComment.content).toEqual(payload.content);
    expect(newComment.owner).toEqual(payload.owner);
  });
});
