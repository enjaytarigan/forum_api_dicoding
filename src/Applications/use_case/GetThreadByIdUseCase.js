class GetThreadByIdUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload) {
    this._verifyUseCasePayload(useCasePayload);
    const thread = await this._threadRepository.getThreadById(
      useCasePayload.threadId,
    );
    const comments = await this._commentRepository.getCommentsByThreadId(
      useCasePayload.threadId,
    );
    return { ...thread, comments };
  }

  _verifyUseCasePayload(payload) {
    const { threadId } = payload;

    if (threadId == null) {
      throw new Error('GET_THREAD_BY_ID_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
    }
  }
}

module.exports = GetThreadByIdUseCase;
