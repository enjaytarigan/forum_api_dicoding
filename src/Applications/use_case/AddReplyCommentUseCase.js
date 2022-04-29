class AddReplyCommentUseCase {
  constructor({ commentReplyRepository, commentRepository, threadRepository }) {
    this._commentReplyRepository = commentReplyRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(payload) {
    this._verifyPayload(payload);
    await this._threadRepository.verifyThreadIsExist(payload.threadId);
    await this._commentRepository.verifyCommentIsExist(payload.commentId);
    return this._commentReplyRepository.addReplyComment(payload);
  }

  _verifyPayload(payload) {
    const {
      threadId, commentId, content, owner,
    } = payload;

    if (threadId == null || commentId == null || content == null || owner == null) {
      throw new Error('ADD_REPLY_COMMENT_USE_CASE.PAYLOAD_NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof threadId !== 'string' || typeof commentId !== 'string' || typeof content !== 'string' || typeof owner !== 'string'
    ) {
      throw new Error(
        'ADD_REPLY_COMMENT_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION',
      );
    }

    if (content === '') {
      throw new Error(
        'ADD_REPLY_COMMENT_USE_CASE.CONTENT_MUST_BE_STRING_AND_NOT_TO_EMPTY',
      );
    }
  }
}

module.exports = AddReplyCommentUseCase;
