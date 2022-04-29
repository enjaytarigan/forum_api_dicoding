class DeleteReplyCommentUseCase {
  constructor({ commentRepository, threadRepository, commentReplyRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
    this._commentReplyRepository = commentReplyRepository;
  }

  async execute(payload) {
    await this._threadRepository.verifyThreadIsExist(payload.threadId);
    await this._commentRepository.verifyCommentIsExist(payload.commentId);
    await this._commentReplyRepository.verifyReplyCommentIsExist(payload.id);
    await this._commentReplyRepository.verifyReplyCommentOwner(payload.id, payload.owner);
    await this._commentReplyRepository.deleteReplyCommentById(payload.id);
  }
}

module.exports = DeleteReplyCommentUseCase;
