const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');
const AddReplyCommentUseCase = require('../../../../Applications/use_case/AddReplyCommentUseCase');
const DeleteCommentUseCase = require('../../../../Applications/use_case/DeleteCommentUseCase');
const DeleteReplyCommentUseCase = require('../../../../Applications/use_case/DeleteReplyCommentUseCase');

class ThreadCommentsHandler {
  constructor(container) {
    this._container = container;
    this.postCommentByThreadIdHandler = this.postCommentByThreadIdHandler.bind(this);
    this.deleteCommentByIdHandler = this.deleteCommentByIdHandler.bind(this);
    this.postReplyCommentHandler = this.postReplyCommentHandler.bind(this);
    this.deleteReplyCommentByIdHandler = this.deleteReplyCommentByIdHandler.bind(this);
  }

  async postCommentByThreadIdHandler(request, h) {
    const addCommentUseCase = this._container.getInstance(
      AddCommentUseCase.name,
    );
    const useCasePayload = {
      threadId: request.params.threadId,
      owner: request.auth.credentials.id,
      ...request.payload,
    };
    const addedComment = await addCommentUseCase.execute(useCasePayload);
    const response = h.response({
      status: 'success',
      data: {
        addedComment,
      },
    });
    response.code(201);
    return response;
  }

  async deleteCommentByIdHandler(request, h) {
    const deleteCommentUseCase = this._container.getInstance(DeleteCommentUseCase.name);
    const { threadId, commentId } = request.params;
    const { id: owner } = request.auth.credentials;
    await deleteCommentUseCase.execute({ threadId, commentId, owner });
    const response = h.response({
      status: 'success',
    });
    response.code(200);
    return response;
  }

  async postReplyCommentHandler(request, h) {
    const useCasePayload = {
      commentId: request.params.commentId,
      threadId: request.params.threadId,
      owner: request.auth.credentials.id,
      content: request.payload.content,
    };

    const addReplyCommentUseCase = this._container.getInstance(AddReplyCommentUseCase.name);
    const addedReply = await addReplyCommentUseCase.execute(useCasePayload);
    const response = h.response({
      status: 'success',
      data: {
        addedReply,
      },
    });

    response.code(201);
    return response;
  }

  async deleteReplyCommentByIdHandler(request) {
    const useCasePayload = {
      threadId: request.params.threadId,
      commentId: request.params.commentId,
      id: request.params.replyId,
      owner: request.auth.credentials.id,
    };

    const addReplyCommentUseCase = this._container.getInstance(DeleteReplyCommentUseCase.name);

    await addReplyCommentUseCase.execute(useCasePayload);
    return { status: 'success' };
  }
}

module.exports = ThreadCommentsHandler;
