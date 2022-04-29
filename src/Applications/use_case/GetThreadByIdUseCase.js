const CommentReply = require('../../Domains/comment_replies/entities/CommentReply');

class GetThreadByIdUseCase {
  constructor({ threadRepository, commentRepository, commentReplyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._commentReplyRepository = commentReplyRepository;
  }

  async execute(useCasePayload) {
    this._verifyUseCasePayload(useCasePayload);
    const thread = await this._threadRepository.getThreadById(
      useCasePayload.threadId,
    );
    let comments = await this._commentRepository.getCommentsByThreadId(
      useCasePayload.threadId,
    );
    let replies = await this._commentReplyRepository
      .findRepliesByCommentIds(comments.map((comment) => comment.id));

    replies = this._groupReplyByCommentId(replies);

    comments = comments.map((comment) => ({
      ...comment,
      replies: replies[comment.id],
    }));

    return { ...thread, comments };
  }

  _verifyUseCasePayload(payload) {
    const { threadId } = payload;

    if (threadId == null) {
      throw new Error('GET_THREAD_BY_ID_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
    }
  }

  _groupReplyByCommentId(replies) {
    const result = {};
    replies.forEach((reply) => {
      const comment = new CommentReply({ ...reply, date: reply.created_at });
      if (!result[reply.comment_id]) {
        result[reply.comment_id] = [comment];
      } else {
        result[reply.comment_id].push(comment);
      }
    });

    return result;
  }
}

module.exports = GetThreadByIdUseCase;
