class AddCommentUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  _verifyPayload(payload) {
    const { threadId, owner, content } = payload;

    if (threadId == null || owner == null || content == null) {
      throw new Error(
        'ADD_COMMENT_USE_CASE.PAYLOAD_NOT_CONTAIN_NEEDED_PROERTY',
      );
    }

    if (typeof threadId !== 'string' || typeof owner !== 'string' || typeof content !== 'string') {
      throw new Error('ADD_COMMENT_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }

  async execute(useCasePayload) {
    this._verifyPayload(useCasePayload);
    const { threadId } = useCasePayload;
    await this._threadRepository.verifyThreadIsExist(threadId);
    return this._commentRepository.addComment(useCasePayload);
  }
}

module.exports = AddCommentUseCase;
